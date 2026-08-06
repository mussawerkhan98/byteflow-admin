import 'server-only'
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { db } from './db'

const COOKIE_NAME = 'byteflow_admin_session'
const MAX_AGE = 60 * 60 * 12
export type CurrentAdminUser = { displayName: string; email: string; role: 'administrator' | 'editor' }
type AuthSource = 'environment' | 'database'
type AdminSession = { email: string; expires: number; source?: AuthSource; role?: 'administrator' | 'editor' }
export type AuthenticatedAdmin = { email: string; source: AuthSource; role: 'administrator' | 'editor' }

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET
  if (!value || value.length < 32) throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters')
  return value
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`
}

function verifyPassword(password: string, stored: string) {
  if (stored.startsWith('scrypt$')) {
    const [, salt, expectedHex] = stored.split('$')
    if (!salt || !expectedHex) return false
    const actual = scryptSync(password, salt, 64)
    const expected = Buffer.from(expectedHex, 'hex')
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  }
  const actual = createHash('sha256').update(password).digest('hex')
  const left = Buffer.from(actual), right = Buffer.from(stored)
  return left.length === right.length && timingSafeEqual(left, right)
}

export async function authenticateAdminCredentials(email: string, password: string): Promise<AuthenticatedAdmin | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const expectedHash = process.env.ADMIN_PASSWORD_SHA256?.trim().toLowerCase()
  if (expectedEmail && normalizedEmail === expectedEmail && expectedHash && verifyPassword(password, expectedHash)) {
    return { email: normalizedEmail, source: 'environment', role: 'administrator' }
  }
  try {
    const result = await db.execute({ sql: 'SELECT password_hash,role FROM admin_users WHERE lower(email) = ? AND active = 1 LIMIT 1', args: [normalizedEmail] })
    const stored = result.rows[0]?.password_hash
    if (typeof stored === 'string' && verifyPassword(password, stored)) {
      return { email: normalizedEmail, source: 'database', role: result.rows[0]?.role === 'administrator' ? 'administrator' : 'editor' }
    }
  } catch {
    // The environment account remains available before the first migration.
  }
  return null
}

export async function createAdminSession(admin: AuthenticatedAdmin) {
  const payload = Buffer.from(JSON.stringify({ ...admin, expires: Date.now() + MAX_AGE * 1000 })).toString('base64url')
  const store = await cookies()
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE,
  })
}

export async function destroyAdminSession() {
  (await cookies()).delete(COOKIE_NAME)
}

export async function isAdminAuthenticated() {
  try {
    const value = (await cookies()).get(COOKIE_NAME)?.value
    if (!value) return false
    const [payload, signature] = value.split('.')
    if (!payload || !signature) return false
    const expected = Buffer.from(sign(payload))
    const received = Buffer.from(signature)
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as AdminSession
    return Number.isFinite(session.expires) && session.expires > Date.now()
  } catch {
    return false
  }
}

export async function isAdministrator() {
  try {
    const value = (await cookies()).get(COOKIE_NAME)?.value
    if (!value || !(await isAdminAuthenticated())) return false
    const [payload] = value.split('.')
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as AdminSession
    if (session.source === 'environment') return true
    if (!session.source && session.email.toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase()) return true
    const result = await db.execute({ sql: 'SELECT role FROM admin_users WHERE lower(email)=? AND active=1 LIMIT 1', args: [session.email.toLowerCase()] })
    return result.rows[0]?.role === 'administrator'
  } catch { return false }
}

export async function getCurrentAdminUser(): Promise<CurrentAdminUser | null> {
  try {
    if (!(await isAdminAuthenticated())) return null
    const value = (await cookies()).get(COOKIE_NAME)?.value
    if (!value) return null
    const [payload] = value.split('.')
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as AdminSession
    const email = session.email.trim().toLowerCase()
    if (session.source === 'environment' || (!session.source && email === process.env.ADMIN_EMAIL?.trim().toLowerCase())) {
      return {
        displayName: email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
        email,
        role: 'administrator',
      }
    }
    const result = await db.execute({
      sql: 'SELECT display_name,email,role FROM admin_users WHERE lower(email)=? AND active=1 LIMIT 1',
      args: [email],
    }).catch(() => ({ rows: [] }))
    const user = result.rows[0]
    if (user) {
      return {
        displayName: String(user.display_name || user.email),
        email: String(user.email),
        role: user.role === 'administrator' ? 'administrator' : 'editor',
      }
    }
    return null
  } catch {
    return null
  }
}
