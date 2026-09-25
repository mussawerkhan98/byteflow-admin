import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import { hasPermission } from "../../lib/permissions";
import MarketingContacts from "./MarketingContacts";

export default async function MarketingPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  if (!(await hasPermission("marketing.send"))) {
    return (
      <div className="pb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Marketing
        </h1>
        <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/[.06] p-4 text-sm text-amber-200">
          You do not have permission to send promotion emails. An administrator
          can grant it from Admin logins.
        </p>
      </div>
    );
  }
  return <MarketingContacts />;
}
