import { authenticateAdminCredentials, createAdminSession } from '../../../lib/auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
  if (!body?.email || !body.password) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 })
  }
  const admin = await authenticateAdminCredentials(body.email, body.password)
  if (!admin) return Response.json({ error: 'Invalid email or password' }, { status: 401 })
  await createAdminSession(admin)
  return Response.json({ ok: true })
}
