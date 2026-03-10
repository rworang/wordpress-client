/**
 * Clean domain types returned by the client.
 *
 * These are the types you'll work with—normalized from WordPress's
 * nested API responses into flat, easy-to-use objects.
 *
 * @example
 * import type { Post, Category, Media } from '@worang/wordpress-client'
 *
 * function renderPost(post: Post) {
 *   return `<h1>${post.title}</h1><p>By ${post.author.name}</p>`
 * }
 */

/** A WordPress post author. */
export interface Author {
  id: number
  name: string
  /** Author's website URL */
  url: string
  /** Author bio */
  description: string
}

/** A WordPress category for organizing posts. */
export interface Category {
  id: number
  /** URL-friendly identifier (e.g., 'tech-news') */
  slug: string
  /** Display name (e.g., 'Tech News') */
  name: string
  description?: string
  /** Number of posts in this category */
  count?: number
}

/** A WordPress tag for labeling posts. */
export interface Tag {
  id: number
  /** URL-friendly identifier (e.g., 'javascript') */
  slug: string
  /** Display name (e.g., 'JavaScript') */
  name: string
  description?: string
  /** Number of posts with this tag */
  count?: number
}

/**
 * A WordPress post with embedded author, categories, and media.
 *
 * @example
 * const post = await client.post('hello-world')
 * console.log(post?.title, post?.author.name)
 */
export interface Post {
  id: number
  /** URL-friendly identifier */
  slug: string
  /** Post title (HTML entities decoded) */
  title: string
  /** Full post content as HTML */
  content: string
  /** Short excerpt as HTML */
  excerpt: string
  author: Author
  /** Basic featured image info (use featuredMedia for full details) */
  featuredImage: {
    id: number | undefined
    url: string
    alt: string
  }
  /** Full featured media with all size variants */
  featuredMedia?: Media
  /** ISO 8601 publication date */
  date: string
  categories: Category[]
  /** Tags associated with this post */
  tags: Tag[]
  /** Whether this post is pinned/sticky */
  sticky: boolean
}

/**
 * A WordPress page with embedded author and media.
 *
 * @example
 * const page = await client.page('about')
 * console.log(page?.title)
 */
export interface Page {
  id: number
  /** URL-friendly identifier */
  slug: string
  /** Page title (HTML entities decoded) */
  title: string
  /** Full page content as HTML */
  content: string
  /** Short excerpt as HTML */
  excerpt: string
  author: Author
  /** Basic featured image info (use featuredMedia for full details) */
  featuredImage: {
    id: number | undefined
    url: string
    alt: string
  }
  /** Full featured media with all size variants */
  featuredMedia?: Media
  /** ISO 8601 publication date */
  date: string
  /** Parent page ID (0 if top-level) */
  parent: number
  /** Menu ordering value */
  menuOrder: number
}

/**
 * A WordPress media item (image, video, etc.) with responsive sizes.
 *
 * @example
 * // Get thumbnail URL
 * const thumbUrl = media.sizes['thumbnail']?.url ?? media.url
 */
export interface Media {
  /** Full-size URL */
  url: string
  id: number
  /** Alt text for accessibility */
  alt: string
  mimeType: string
  /** Full-size width in pixels */
  width: number
  /** Full-size height in pixels */
  height: number
  /** Responsive size variants (thumbnail, medium, large, etc.) */
  sizes: Record<
    string,
    {
      url: string
      width: number
      height: number
      mimeType: string
      filesize?: number
    }
  >
}

/**
 * A WordPress navigation menu item.
 *
 * Represents a single link in a navigation menu, with support for hierarchy.
 * Requires WP 5.9+ with the Menus REST API.
 */
export interface MenuItem {
  id: number
  /** Display label */
  title: string
  /** Target URL */
  url: string
  /** Menu this item belongs to */
  menus: number
  /** Parent menu item ID (0 if top-level) */
  parent: number
  /** Display order */
  menuOrder: number
  /** Type of object this links to (e.g., 'post_type', 'custom', 'taxonomy') */
  objectType: string
  /** Specific object (e.g., 'page', 'post', 'category') */
  object: string
  /** The linked object's ID (0 for custom links) */
  objectId: number
  /** Link target (e.g., '_blank') */
  target: string
}

/**
 * A WordPress navigation menu (the container, not individual items).
 *
 * Requires WP 5.9+ with the Menus REST API.
 */
export interface NavigationMenu {
  id: number
  /** Menu name */
  name: string
  /** Menu slug */
  slug: string
  description: string
}
