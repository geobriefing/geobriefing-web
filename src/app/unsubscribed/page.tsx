import Masthead from "@/components/Masthead"
import Footer from "@/components/Footer"
import { Label, PrimaryLink } from "@/components/Editorial"

const UnsubscribedPage = () => (
  <div className="min-h-screen">
    <Masthead />
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
      <Label>Unsubscribed</Label>
      <h1 className="mt-3 font-display font-bold text-[30px] sm:text-[44px] leading-[1.08] tracking-[-0.012em]">You won&apos;t get any more emails</h1>
      <p className="mt-4 mx-auto max-w-[460px] font-serif text-[17px] sm:text-lg leading-[1.6] text-ink-2">
        Sorry to see you go. Every issue stays on the website, and you can subscribe again any time.
      </p>
      <div className="mt-8"><PrimaryLink href="/">Read this week&apos;s issue</PrimaryLink></div>
    </main>
    <Footer />
  </div>
)

export default UnsubscribedPage
