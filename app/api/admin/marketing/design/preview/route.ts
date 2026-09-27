import { isAdminAuthenticated } from "../../../../../lib/auth";
import { requirePermission } from "../../../../../lib/permissions";
import { normaliseDesign } from "../../../../../lib/email-design";
import { emailSettings } from "../../../../../lib/campaigns";
import { buildEmail } from "../../../../../lib/email-template";

export const dynamic = "force-dynamic";

/**
 * A sample promotion rendered with design values that have not been saved
 * yet, so the screen can show the real thing rather than an impression of it.
 * It goes through the same `buildEmail` every real send uses.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return new Response("Please sign in again.", { status: 401 });
  }
  const denied = await requirePermission("marketing.send");
  if (denied) return denied;

  const design = normaliseDesign(await request.json().catch(() => ({})));
  const settings = await emailSettings();

  const { html } = buildEmail(
    {
      headline: "20% off your first IT AMC contract",
      body: "This is how your promotions will look.\n\nEach blank line starts a new paragraph, so you can write as much or as little as the offer needs.",
      buttonText: "Get a Free Quote",
      buttonUrl: "https://example.com/",
      imageUrl: "",
    },
    {
      name: "Sample",
      email: "sample@example.com",
      unsubscribeUrl: `${settings.websiteUrl}/unsubscribe`,
    },
    { ...settings, ...design },
  );

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
