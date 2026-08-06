import { isAdminAuthenticated } from '../lib/auth'
import AdminSidebar from './AdminSidebar'
import { db } from '../lib/db'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) return children
  const settings=await db.execute('SELECT logo_url FROM site_settings WHERE id=1').catch(()=>({rows:[]}))
  const logoUrl=String(settings.rows[0]?.logo_url||'')
  return <div className="min-h-screen bg-[#091218] text-slate-100"><AdminSidebar logoUrl={logoUrl||undefined}/><main className="min-w-0 lg:pl-[268px]"><div className="mx-auto max-w-[1500px] p-5 sm:p-7 lg:p-10 xl:p-12">{children}</div></main></div>
}
