import type { Metadata, Viewport } from 'next'
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
  title: 'GeoBriefing — Spatial Intelligence Monthly',
  description: 'An independent monthly publication covering GIS, maps, Earth observation, GeoAI, spatial data and the geography behind the stories shaping our world.',
  openGraph: {
    title: 'GeoBriefing | Read the World Spatially',
    description: 'Maps, GIS, Earth observation, GeoAI, data, global stories and one Country Desk every month.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'GeoBriefing | Read the World Spatially',
    description: 'Maps, GIS, Earth observation, GeoAI, data, global stories and one Country Desk every month.',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

// The phone's status bar and browser chrome take the page's paper colour.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF7' },
    { media: '(prefers-color-scheme: dark)', color: '#131412' },
  ],
}

// Applies a stored day/night choice before first paint (and to the status bar
// colour). With no stored choice, the CSS follows prefers-color-scheme.
const editionScript = `try{var e=localStorage.getItem('gb-edition');if(e==='day'||e==='night'){document.documentElement.dataset.edition=e;document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('meta[name=theme-color]').forEach(function(m){m.content=e==='night'?'#131412':'#FAFAF7'})})}}catch(_){}`

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
      <body className="bg-paper text-ink font-sans min-h-dvh">
        {children}
      </body>
    </html>
  )
}

export default RootLayout
