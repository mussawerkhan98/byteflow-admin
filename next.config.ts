import type { NextConfig } from 'next'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadParentDatabaseEnvironment() {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) return
  try {
    const entries = new Map<string, string>()
    for (const rawLine of readFileSync(resolve(process.cwd(), '..', '.env'), 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const separator = line.indexOf('=')
      if (separator < 0) continue
      const key = line.slice(0, separator).trim().toLowerCase()
      const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
      entries.set(key, value)
    }
    process.env.TURSO_DATABASE_URL ||= entries.get('db url')
    process.env.TURSO_AUTH_TOKEN ||= entries.get('db token')
  } catch {
    // Standard project-local TURSO_* variables remain supported in production.
  }
}

loadParentDatabaseEnvironment()

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/blogs',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/software-development-company',
        destination: '/website-development',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
