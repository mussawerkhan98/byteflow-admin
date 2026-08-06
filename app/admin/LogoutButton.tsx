'use client'
import { useRouter } from 'next/navigation'
export default function LogoutButton() { const router = useRouter(); return <button className="flex w-full items-center justify-center rounded-lg border border-white/[.08] px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-red-400/20 hover:bg-red-400/[.05] hover:text-red-300" onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.replace('/admin/login'); router.refresh() }}>Sign out</button> }
