import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GeoBriefing — Spatial Intelligence, Global Edition',
  description: 'Weekly GIS intelligence covering South Asia, Middle East, Central Asia and beyond.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="bg-[#FAFAF7] text-[#1a1a1a] min-h-screen">
        {children}
      </body>
    </html>
  )
}

export default RootLayout