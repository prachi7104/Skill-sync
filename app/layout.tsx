import type { Metadata } from 'next'
import './globals.css'

import AuthProvider from "@/components/providers/auth-provider";
import ClientToaster from "@/components/providers/client-toaster";

export const metadata: Metadata = {
  title: 'SkillSync',
  description: 'AI-powered placement preparation and interview assistant',
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
    <html lang="en">
      <body className="bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
        <ClientToaster />
      </body>
    </html>
  )
}
