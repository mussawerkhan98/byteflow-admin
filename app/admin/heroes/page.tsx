import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import HeroesManager from "./HeroesManager";

export default async function HeroesPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <HeroesManager />;
}
