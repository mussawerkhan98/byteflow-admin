import "server-only";

/**
 * Sending through Brevo's transactional API with built-in fetch — no SDK.
 *
 * The API key is read from the environment at call time and never returned,
 * logged or included in any error message that reaches the browser.
 */

const ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export type Sender = { name: string; email: string };

export type Message = {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text: string;
  /** RFC 8058 one-click unsubscribe, which Gmail and Yahoo expect. */
  listUnsubscribe?: string;
  tag: string;
};

export type SendOutcome = {
  sent: number;
  failed: number;
  firstError: string;
  failedEmails: string[];
  /** Set when the key is rejected — the run stops rather than hammering. */
  aborted: boolean;
};

export class BrevoNotConfigured extends Error {
  constructor() {
    super(
      "BREVO_API_KEY is not set. Add it in Vercel (Production and Preview) and redeploy.",
    );
    this.name = "BrevoNotConfigured";
  }
}

export const brevoConfigured = () => Boolean(process.env.BREVO_API_KEY);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Anything the API says is kept short and free of the key. */
const readError = async (response: Response) => {
  let detail = "";
  try {
    const body = (await response.json()) as { message?: unknown; code?: unknown };
    detail = String(body.message ?? body.code ?? "");
  } catch {
    detail = "";
  }
  return `Brevo responded ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`;
};

/**
 * Sends one message. Retries a 429 twice with backoff; a 401 or 403 means the
 * key is wrong, so it reports `abort` and the caller stops.
 */
async function sendOne(
  message: Message,
  sender: Sender,
): Promise<{ ok: boolean; error?: string; abort?: boolean }> {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new BrevoNotConfigured();

  const payload = {
    sender,
    replyTo: sender,
    to: [message.to],
    subject: message.subject,
    htmlContent: message.html,
    textContent: message.text,
    tags: [message.tag],
    ...(message.listUnsubscribe
      ? {
          headers: {
            "List-Unsubscribe": message.listUnsubscribe,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }
      : {}),
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "api-key": key,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      if (attempt === 2) return { ok: false, error: "Could not reach Brevo." };
      await wait(400 * (attempt + 1));
      continue;
    }

    if (response.ok) return { ok: true };
    if (response.status === 401 || response.status === 403) {
      return { ok: false, abort: true, error: await readError(response) };
    }
    if (response.status === 429 && attempt < 2) {
      await wait(1000 * (attempt + 1));
      continue;
    }
    return { ok: false, error: await readError(response) };
  }
  return { ok: false, error: "Brevo did not accept the message." };
}

/** Five at a time: enough to be quick, gentle enough not to trip rate limits. */
const CONCURRENCY = 5;

export async function sendBatch(
  messages: Message[],
  sender: Sender,
): Promise<SendOutcome> {
  const outcome: SendOutcome = {
    sent: 0,
    failed: 0,
    firstError: "",
    failedEmails: [],
    aborted: false,
  };

  let index = 0;
  const worker = async () => {
    while (index < messages.length && !outcome.aborted) {
      const message = messages[index];
      index += 1;
      const result = await sendOne(message, sender);
      if (result.ok) {
        outcome.sent += 1;
        continue;
      }
      outcome.failed += 1;
      outcome.failedEmails.push(message.to.email);
      if (!outcome.firstError && result.error) outcome.firstError = result.error;
      if (result.abort) outcome.aborted = true;
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, messages.length) }, worker),
  );

  // Everything not attempted after an abort still counts as not delivered.
  if (outcome.aborted) {
    const attempted = outcome.sent + outcome.failed;
    const remaining = messages.length - attempted;
    if (remaining > 0) {
      outcome.failed += remaining;
      outcome.failedEmails.push(
        ...messages.slice(attempted).map((message) => message.to.email),
      );
    }
  }

  return outcome;
}
