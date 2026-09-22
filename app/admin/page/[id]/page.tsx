import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../../lib/auth";
import PageWorkspace from "./PageWorkspace";

export default async function PageWorkspaceRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { id } = await params;
  const pageId = Number(id);
  if (!Number.isFinite(pageId) || pageId <= 0) notFound();
  return <PageWorkspace pageId={pageId} />;
}
