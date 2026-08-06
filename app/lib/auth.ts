import 'server-only'
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { db } from './db'

const COOKIE_NAME = 'byteflow_admin_session'
const MAX_AGE = 60 * 60 * 12

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

export async function verifyAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()
  try {
    const result = await db.execute({ sql: 'SELECT password_hash FROM admin_users WHERE lower(email) = ? AND active = 1 LIMIT 1', args: [normalizedEmail] })
    const stored = result.rows[0]?.password_hash
    if (typeof stored === 'string') return verifyPassword(password, stored)
  } catch {
    // The environment account remains available before the first migration.
  }
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const expectedHash = process.env.ADMIN_PASSWORD_SHA256?.trim().toLowerCase()
  return Boolean(expectedEmail && expectedHash && normalizedEmail === expectedEmail && verifyPassword(password, expectedHash))
}

export async function createAdminSession(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, expires: Date.now() + MAX_AGE * 1000 })).toString('base64url')
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
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { expires: number }
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
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { email: string }
    if (session.email.toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase()) return true
    const result = await db.execute({ sql: 'SELECT role FROM admin_users WHERE lower(email)=? AND active=1 LIMIT 1', args: [session.email.toLowerCase()] })
    return result.rows[0]?.role === 'administrator'
  } catch { return false }
}
