import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import AboutFounderManager from "./AboutFounderManager";

export default async function AboutPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <AboutFounderManager />;
}
