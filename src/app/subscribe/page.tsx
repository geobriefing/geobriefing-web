export const revalidate = 0

import { getSettings } from "@/lib/settings"
import { nextIssueDate } from "@/lib/schedule"
import Masthead from "@/components/Masthead"
import Footer from "@/components/Footer"
import SubscribeForm from "@/components/SubscribeForm"
import { Label } from "@/components/Editorial"

const SubscribePage = async () => {
  const settings = await getSettings()

  return (
    <div className="min-h-dvh">
      <Masthead active="subscribe" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-[72px] flex justify-center">
        <div className="w-full max-w-[560px]">
          <SubscribeForm
            variant="page"
            intro={<SubscribeIntro />}
            nextMonth={nextIssueDate(settings).month}
            editorName={settings.editorName}
            editorShortBio={settings.editorShortBio}
            editorPhotoUrl={settings.editorPhotoUrl}
            contactEmail={settings.editorContact}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}

const SubscribeIntro = () => (
  <div className="text-center">
    <Label>Subscribe</Label>
    <h1 className="mt-3 font-display font-bold text-[34px] sm:text-[52px] leading-[1.04] tracking-[-0.015em]">
      See the world differently.
    </h1>
    <p className="mt-3.5 mx-auto max-w-[480px] font-serif text-[17px] sm:text-lg leading-[1.6] text-ink-2">
      A monthly publication about maps, GIS, Earth observation, GeoAI, data and the geography behind the headlines.
    </p>
    <p className="mt-3 mx-auto max-w-[480px] font-serif text-[17px] sm:text-lg leading-[1.6] text-ink-2">
      Every issue brings together the stories that mattered, remarkable maps, useful datasets, one Country Desk,
      original features, curiosities and games.
    </p>
    <p className="mt-3 font-sans font-semibold text-[15px] sm:text-base text-ink">One issue. Once a month. Free.</p>
  </div>
)

export default SubscribePage
