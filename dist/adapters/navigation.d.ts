/**
 * @internal
 * Transforms raw WordPress navigation responses into clean domain objects.
 *
 * Covers both navigation menus (containers) and menu items (links).
 * Requires WP 5.9+ with the Menus REST API.
 */
import type { RawMenuItem, RawNavigationMenu } from '../types/raw';
import type { MenuItem, NavigationMenu } from '../types/domain';
/** @internal Converts a raw WordPress menu item to a clean MenuItem object. */
export declare const toMenuItem: (raw: RawMenuItem) => MenuItem;
/** @internal Converts a raw WordPress navigation menu to a clean NavigationMenu object. */
export declare const toNavigationMenu: (raw: RawNavigationMenu) => NavigationMenu;
//# sourceMappingURL=navigation.d.ts.map