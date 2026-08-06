import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-admin',
})

export const metadata: Metadata = {
  title: { default: 'Byteflow Admin', template: '%s | Byteflow Admin' },
  description: 'Protected content management for the Byteflow website.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f5f7fa] text-slate-900" style={{ fontFamily: 'var(--font-admin), sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
