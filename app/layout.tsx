import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })

import AuthProvider from "@/components/providers/auth-provider";
import ClientToaster from "@/components/providers/client-toaster";

export const metadata: Metadata = {
  title: 'SkillSync — Placement Intelligence Hub',
  description: 'Placement Intelligence Hub',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="bg-background text-foreground font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        <ClientToaster />
      </body>
    </html>
  )
}
