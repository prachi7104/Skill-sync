import type { Metadata } from 'next'
import './globals.css'
import { Inter, Lora, JetBrains_Mono } from 'next/font/google'
import AuthProvider from "@/components/providers/auth-provider"
import ClientToaster from "@/components/providers/client-toaster"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SkillSync',
  description: 'AI-powered placement preparation and interview assistant',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${lora.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans bg-background text-foreground antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
        <ClientToaster />
      </body>
    </html>
  )
}
