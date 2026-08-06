import { createAdminSession, verifyAdminCredentials } from '../../../lib/auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
  if (!body?.email || !body.password || !(await verifyAdminCredentials(body.email, body.password))) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 })
  }
  await createAdminSession(body.email)
  return Response.json({ ok: true })
}
