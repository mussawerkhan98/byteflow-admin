/**
 * The OAuth 2.1 pieces behind the Claude connector that need no database:
 * token generation and hashing, PKCE (S256 only), which redirect addresses a
 * client may register, and the signature that ties the sign-in form to the
 * request that opened it.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** The one scope there is: read and write blog articles. */
export const ARTICLES_SCOPE = "articles";

export const ACCESS_TOKEN_SECONDS = 60 * 60;
export const REFRESH_TOKEN_SECONDS = 60 * 60 * 24 * 30;
export const CODE_SECONDS = 10 * 60;

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

/** Tokens and codes are stored only as this hash. */
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const pkceChallenge = (verifier: string) => createHash("sha256").update(verifier).digest("base64url");

/** RFC 7636: a 43–128 character verifier whose S256 hash matches the challenge sent at authorize. */
export function verifyPkce(verifier: string, challenge: string): boolean {
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier) || !challenge) return false;
  return safeEqual(pkceChallenge(verifier), challenge);
}

/**
 * Only Claude's own callback, and loopback addresses for Claude Desktop and
 * Claude Code, may receive an authorization code. Anything else is refused at
 * registration, so a code can't be sent to someone else's site.
 */
export function allowedRedirectUri(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.hash || url.username || url.password) return false;
  if (url.protocol === "https:") return (url.hostname === "claude.ai" || url.hostname === "claude.com") && !url.port;
  if (url.protocol === "http:") return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  return false;
}

/** Signs the authorize request's parameters, so the sign-in form can't be replayed with different ones. */
export function signForm(secret: string, params: Record<string, string>, expires: number): string {
  const payload = JSON.stringify([expires, Object.keys(params).sort().map((key) => [key, params[key]])]);
  return `${expires}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

export function verifyForm(secret: string, params: Record<string, string>, signature: string, now = Date.now()): boolean {
  const expires = Number(signature.split(".")[0]);
  if (!Number.isFinite(expires) || expires * 1000 < now) return false;
  return safeEqual(signForm(secret, params, expires), signature);
}
