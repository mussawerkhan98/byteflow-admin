import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import { contactBlocks } from "../../lib/home-sections";
import HomeSectionsManager from "../home-sections/HomeSectionsManager";

export default async function ContactSectionsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <HomeSectionsManager blocks={contactBlocks} sectionKey="contact-sections" pageName="Contact page" preview="/contact-us" />;
}
