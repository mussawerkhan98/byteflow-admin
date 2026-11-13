import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import { projectsBlocks } from "../../lib/home-sections";
import HomeSectionsManager from "../home-sections/HomeSectionsManager";

export default async function ProjectsSectionsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <HomeSectionsManager blocks={projectsBlocks} sectionKey="projects-sections" pageName="Projects page" preview="/projects" />;
}
