export interface PostWritePayload {
  title?: string
  content?: string
  excerpt?: string
  status?: 'publish' | 'draft' | 'pending' | 'private' | 'future'
  slug?: string
  author?: number
  featured_media?: number
  comment_status?: 'open' | 'closed'
  ping_status?: 'open' | 'closed'
  sticky?: boolean
  template?: string
  format?: 'standard' | 'aside' | 'chat' | 'gallery' | 'link' | 'image' | 'quote' | 'status' | 'video' | 'audio'
  categories?: number[]
  tags?: number[]
  meta?: Record<string, unknown>
  date?: string
  date_gmt?: string
  password?: string
}
