import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Classmate AI — Teach to Learn',
  description: 'Not another AI tutor. A confused classmate who needs your help.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
