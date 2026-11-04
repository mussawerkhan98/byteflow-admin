import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import HomeSectionsManager from "./HomeSectionsManager";

export default async function HomeSectionsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <HomeSectionsManager />;
}
