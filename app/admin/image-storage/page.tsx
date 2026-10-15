import { redirect } from "next/navigation";
import { isAdministrator } from "../../lib/auth";
import { surveyMedia } from "../../lib/media-survey";
import ImageStorageManager from "./ImageStorageManager";

export default async function ImageStoragePage() {
  if (!(await isAdministrator())) redirect("/admin");
  const initial = await surveyMedia().catch(() => null);
  return <ImageStorageManager initial={initial} />;
}
