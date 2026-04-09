import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })

import AuthProvider from "@/components/providers/auth-provider";
import ClientToaster from "@/components/providers/client-toaster";

import { ThemeProvider } from "@/components/providers/theme-provider";

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
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
          <ClientToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
