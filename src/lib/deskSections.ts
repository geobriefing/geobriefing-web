/**
 * Editor's Desk sections: the review keys stored in issue_section_review, the
 * table behind each, and which fields the desk may edit. Shared by the admin API
 * and the desk page.
 */

export type DeskSection =
  | "news" | "country_desk" | "gis_story" | "maps_dont_lie" | "comics" | "games"
  | "events" | "data_drops" | "quote" | "jokes" | "fun_facts" | "features"

export interface DeskSectionDef {
  key: DeskSection
  label: string
  table: string
  /** Can be left out of an issue. */
  skippable: boolean
  /** The editor can add an item by hand. */
  creatable: boolean
}

// Issue order first, then the extras that are mixed into other sections.
export const DESK_SECTIONS: DeskSectionDef[] = [
  { key: "news", label: "GIS News", table: "stories", skippable: false, creatable: false },
  { key: "country_desk", label: "Country desk", table: "country_desks", skippable: true, creatable: true },
  { key: "gis_story", label: "GIS Story", table: "gis_stories", skippable: true, creatable: false },
  { key: "maps_dont_lie", label: "Maps Don't Lie", table: "maps_dont_lie", skippable: true, creatable: false },
  { key: "comics", label: "Comics", table: "comic_strips", skippable: true, creatable: false },
  { key: "games", label: "Games", table: "games", skippable: true, creatable: false },
  { key: "events", label: "Events", table: "events", skippable: true, creatable: true },
  { key: "data_drops", label: "Data drops", table: "datasets", skippable: true, creatable: true },
  { key: "quote", label: "Quote of the week", table: "quotes", skippable: true, creatable: false },
  { key: "jokes", label: "Jokes", table: "jokes", skippable: true, creatable: false },
  { key: "fun_facts", label: "Fun facts", table: "fun_facts", skippable: true, creatable: false },
  { key: "features", label: "Features", table: "features", skippable: true, creatable: false },
]

/** Fields the desk may change per table. Anything else in a patch is ignored. */
export const EDITABLE: Record<string, string[]> = {
  stories: ["title", "summary", "region", "topic"],
  country_desks: ["country", "region", "intro", "facts", "follow"],
  gis_stories: ["title", "content", "story_type"],
  maps_dont_lie: ["title", "commentary", "map_type", "source_url", "image_url"],
  comic_strips: ["title"],
  games: [],
  events: ["name", "description", "start_date", "end_date", "location", "event_type", "url", "organizer", "is_free", "is_online"],
  datasets: ["name", "publisher", "region", "format", "licence", "resolution", "url"],
  quotes: ["quote_text", "quote_author", "quote_role"],
  jokes: ["setup", "punchline"],
  fun_facts: ["fact", "source"],
  features: ["title", "type", "author_name", "body_markdown"],
  sources: ["name", "url", "group_name", "description", "region", "language", "sort_order", "active"],
}

/** Tables whose rows carry an ai_draft flag (features uses is_ai_suggested instead). */
export const HAS_AI_DRAFT = new Set([
  "stories", "country_desks", "gis_stories", "maps_dont_lie", "comic_strips", "games",
  "events", "datasets", "quotes", "jokes", "fun_facts",
])

/** Tables that can be reordered with sort_order. */
export const SORTABLE = new Set([
  "stories", "comic_strips", "datasets", "jokes", "fun_facts", "events", "games", "sources",
])

export const DATASET_FORMATS = ["GeoTIFF", "COG", "Shapefile", "GeoPackage", "GeoJSON", "GeoParquet", "WMS", "WMTS", "API", "Other"]
export const REGIONS = ["South Asia", "Middle East", "Central Asia", "Africa", "Europe", "North America", "Oceania", "Global"]
