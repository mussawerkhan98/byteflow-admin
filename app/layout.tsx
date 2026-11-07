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

// Before paint, so a light-mode admin never flashes dark (AdminThemeToggle
// stores the choice).
const themeScript = `try{if(localStorage.getItem('admin-theme')==='light')document.documentElement.setAttribute('data-admin-theme','light')}catch(e){}`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The script sets data-admin-theme before React hydrates; that one difference is expected.
    <html lang="en" className={`${manrope.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-[#f5f7fa] text-slate-900" style={{ fontFamily: 'var(--font-admin), sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
