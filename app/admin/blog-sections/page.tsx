import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import { blogBlocks } from "../../lib/home-sections";
import HomeSectionsManager from "../home-sections/HomeSectionsManager";

export default async function BlogSectionsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <HomeSectionsManager blocks={blogBlocks} sectionKey="blog-sections" pageName="Blog page" preview="/blog" />;
}
