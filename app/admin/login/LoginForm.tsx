'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('')
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) })
    const data = await response.json()
    if (!response.ok) { setError(data.error ?? 'Login failed'); setLoading(false); return }
    router.replace('/admin'); router.refresh()
  }
  return <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-slate-950 p-8 shadow-2xl">
    <p className="text-xs font-bold uppercase tracking-[.25em] text-cyan-400">Byteflow CMS</p>
    <h1 className="mt-3 text-3xl font-bold text-white">Admin sign in</h1>
    <p className="mt-2 text-sm text-slate-400">Use the administrator credentials configured in the environment.</p>
    <label className="mt-7 block text-sm font-medium text-slate-200">Email<input name="email" type="email" autoComplete="username" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400" /></label>
    <label className="mt-4 block text-sm font-medium text-slate-200">Password<input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400" /></label>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
    <button disabled={loading} className="mt-6 w-full rounded-lg bg-cyan-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-50">{loading ? 'Signing in…' : 'Sign in'}</button>
  </form>
}
