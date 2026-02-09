import type { Metadata } from 'next'
import './globals.css'

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
        {children}
      </body>
    </html>
  )
}
