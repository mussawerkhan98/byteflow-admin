import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../../lib/auth";
import { previewLink, previewPath } from "../../../lib/preview-link";

/**
 * GET ?path=/digital-marketing: for a signed-in admin, opens that website
 * page in preview mode (hidden sections and packages shown, marked).
 */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return new Response("Sign in to the admin first.", { status: 401 });
  const path = previewPath(new URL(request.url).searchParams.get("path"));
  const link = path ? previewLink(path) : null;
  if (!link)
    return new Response("Preview isn't set up: REVALIDATE_SECRET must be set (the same value) in the admin and the website.", { status: 500 });
  redirect(link);
}
