export const revalidate = 0

import { getSettings } from "@/lib/settings"
import Masthead from "@/components/Masthead"
import Footer from "@/components/Footer"
import SubscribeForm from "@/components/SubscribeForm"
import { Label } from "@/components/Editorial"

const SubscribePage = async () => {
  const settings = await getSettings()

  return (
    <div className="min-h-screen">
      <Masthead active="subscribe" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-[72px] flex justify-center">
        <div className="w-full max-w-[560px]">
          <SubscribeForm
            variant="page"
            intro={<SubscribeIntro publishDay={settings.publishDay} />}
            publishDay={settings.publishDay}
            editorName={settings.editorName}
            editorPhotoUrl={settings.editorPhotoUrl}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}

const SubscribeIntro = ({ publishDay }: { publishDay: string }) => (
  <div className="text-center">
    <Label>Subscribe</Label>
    <h1 className="mt-3 font-display font-bold text-[34px] sm:text-[52px] leading-[1.04] tracking-[-0.015em]">
      Free. Every {publishDay}.
    </h1>
    <p className="mt-3.5 mx-auto max-w-[460px] font-serif text-[17px] sm:text-lg leading-[1.6] text-ink-2">
      One email a week: the news, a story, a map, a comic and a game. No ads. Unsubscribe in one click.
    </p>
  </div>
)

export default SubscribePage
