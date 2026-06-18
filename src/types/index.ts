export interface Story {
  id: string
  issue_id: string | null
  title: string
  summary: string | null
  source_url: string
  source_type: string
  source_name: string
  region: string
  topic: string
  relevance_score: number | null
  engagement: number
  published_at: string | null
  scraped_at: string
  url_hash: string
  is_featured: boolean
}

export interface Issue {
  id: string
  issue_number: number
  slug: string
  headline: string
  editor_note: string | null
  digest_html: string | null
  published_at: string | null
  status: string
  created_at: string
  stories?: Story[]
  quote_text?: string
  quote_author?: string
  quote_role?: string
}