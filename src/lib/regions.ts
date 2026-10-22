/** Pill hues (oklch). null means chroma 0 (neutral grey). */
export const REGION_HUES: Record<string, number | null> = {
  "South Asia": 160,
  "Middle East": 45,
  "Central Asia": 80,
  "Europe": 305,
  "North America": 250,
  "Africa": 105,
  "Oceania": 200,
  "Global": null,
}

export const TYPE_HUES: Record<string, Record<string, number | null>> = {
  story: { analysis: 250, policy: 305, data: 160, tool: 80, history: 80, wild: 25, hero: 305 },
  map: { misleading: 25, surprising: 250, manipulative: 330, beautiful: 160, historical: 80 },
  event: { conference: 305, webinar: 250, workshop: 160, deadline: 25, hackathon: 45, meetup: 80 },
  licence: { open: 160, "non-commercial": 80, "view only": null },
  process: { "ai-assisted": 250, human: 160 },
}
