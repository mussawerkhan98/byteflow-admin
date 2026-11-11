import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import { servicesBlocks } from "../../lib/home-sections";
import HomeSectionsManager from "../home-sections/HomeSectionsManager";

export default async function ServicesSectionsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <HomeSectionsManager blocks={servicesBlocks} sectionKey="services-sections" pageName="Services page" preview="/services" />;
}
