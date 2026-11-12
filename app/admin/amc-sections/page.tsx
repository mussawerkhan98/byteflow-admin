import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import { amcBlocks } from "../../lib/home-sections";
import HomeSectionsManager from "../home-sections/HomeSectionsManager";

export default async function AmcSectionsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <HomeSectionsManager blocks={amcBlocks} sectionKey="amc-sections" pageName="IT AMC page" preview="/it-amc-services-dubai" />;
}
