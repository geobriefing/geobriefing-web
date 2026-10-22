import type { Metadata } from 'next'
import { Source_Serif_4, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

// Variable font (all weights plus optical sizes for large headlines).
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-source-serif',
  display: 'swap',
})

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GeoBriefing — Spatial Intelligence · Weekly',
  description: 'A free weekly briefing for the global geospatial community, with a focus on South Asia, the Middle East and Central Asia.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

// Applies a stored day/night choice before first paint. With no stored choice,
// the CSS follows prefers-color-scheme.
const editionScript = `try{var e=localStorage.getItem('gb-edition');if(e==='day'||e==='night')document.documentElement.dataset.edition=e}catch(_){}`

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: editionScript }} />
      </head>
      <body className="bg-paper text-ink font-sans min-h-screen">
        {children}
      </body>
    </html>
  )
}

export default RootLayout
