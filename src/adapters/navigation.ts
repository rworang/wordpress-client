/**
 * @internal
 * Transforms raw WordPress navigation responses into clean domain objects.
 *
 * Covers both navigation menus (containers) and menu items (links).
 * Requires WP 5.9+ with the Menus REST API.
 */

import type { RawMenuItem, RawNavigationMenu } from '../types/raw'
import type { MenuItem, NavigationMenu } from '../types/domain'
import { RawMenuItemSchema, RawNavigationMenuSchema } from '../schemas/navigation'
import { WordpressSchemaError } from '../errors'

/** @internal Converts a raw WordPress menu item to a clean MenuItem object. */
export const toMenuItem = (raw: RawMenuItem): MenuItem => {
  const result = RawMenuItemSchema.safeParse(raw)
  if (!result.success) {
    throw new WordpressSchemaError('menu item', result.error.issues)
  }

  return {
    id: raw.id,
    title: raw.title?.rendered ?? '',
    url: raw.url,
    menus: raw.menus,
    parent: raw.parent,
    menuOrder: raw.menu_order,
    objectType: raw.type,
    object: raw.object,
    objectId: raw.object_id,
    target: raw.target,
  }
}

/** @internal Converts a raw WordPress navigation menu to a clean NavigationMenu object. */
export const toNavigationMenu = (raw: RawNavigationMenu): NavigationMenu => {
  const result = RawNavigationMenuSchema.safeParse(raw)
  if (!result.success) {
    throw new WordpressSchemaError('navigation menu', result.error.issues)
  }

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
  }
}
