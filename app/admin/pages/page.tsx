import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import PagesHub from "./PagesHub";

export default async function PagesHubPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <PagesHub />;
}
