import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import { industriesBlocks } from "../../lib/home-sections";
import HomeSectionsManager from "../home-sections/HomeSectionsManager";

export default async function IndustriesSectionsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <HomeSectionsManager blocks={industriesBlocks} sectionKey="industries-sections" pageName="Industries page" preview="/industries" />;
}
