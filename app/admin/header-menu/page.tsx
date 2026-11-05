import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import HeaderMenuManager from "./HeaderMenuManager";

export default async function HeaderMenuPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <HeaderMenuManager />;
}
