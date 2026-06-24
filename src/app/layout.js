// src/app/layout.js

import { Space_Grotesk, Geist, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuroraBackdrop } from '@/components/shared/AuroraBackdrop'
import { auth } from '@/lib/auth/auth'

const display = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const sans = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

const mono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
})

export const metadata = {
  title: 'SOW Tracker',
  description: 'Statement of Work Tracker for Howl',
}

export default async function RootLayout({ children }) {
  const session = await auth()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}>
        <ThemeProvider>
          <AuroraBackdrop />
          <SessionProvider session={session}>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
