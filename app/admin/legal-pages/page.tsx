import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import { legalBlocks } from "../../lib/home-sections";
import HomeSectionsManager from "../home-sections/HomeSectionsManager";

export default async function LegalPagesPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <HomeSectionsManager blocks={legalBlocks} sectionKey="legal-pages" pageName="legal pages" preview="/privacy-policy" />;
}
