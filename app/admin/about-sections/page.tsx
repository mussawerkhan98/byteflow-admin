import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import { aboutBlocks } from "../../lib/home-sections";
import HomeSectionsManager from "../home-sections/HomeSectionsManager";

export default async function AboutSectionsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <HomeSectionsManager blocks={aboutBlocks} sectionKey="about-sections" pageName="About Us page" preview="/about-us" />;
}
