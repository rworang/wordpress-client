# Companion Plugin Contract

> **Spec version:** 1.0 · **SDK version:** `@worang/wordpress-client` ≥ 0.2.0
> **Status:** v1.0 — PHP reference implementation available in-repo.

## Purpose

The companion plugin is an **opt-in** WordPress plugin that extends what
`@worang/wordpress-client` can do beyond the core REST API. Core WordPress
exposes enough surface for reading and authoring content, but some SDK
features benefit from a small amount of server-side support — most notably
a cheap, cacheable "deploy token" the client can use to invalidate caches
across environments.

When the plugin is **not installed** the SDK still works normally. Every
companion method returns `null` on a 404, so consumers can feature-detect
without branching on error types.

## Installation model

- WordPress plugin registers under the `worang-client/v1` REST namespace.
- All endpoints are **public** — no authentication required.
- Plugin ships as a single PHP file; admins install via the WordPress plugin
  UI or WP-CLI. A Composer/WPackagist distribution is not in scope for
  v1.0 of this spec.

## Installation

- Download `worang-client-companion.zip` from the GitHub release, or build it locally with `companion-plugin/build-zip.sh`.
- Upload it in WordPress admin via **Plugins → Add New → Upload Plugin**.
- Alternatively, extract it manually to `wp-content/plugins/worang-client-companion/`.
- Activate the plugin in the WordPress plugin admin.

## REST endpoints

### `GET /wp-json/worang-client/v1/version`

Returns metadata about the installed companion plugin. The SDK uses the
`features` list for feature detection: if a capability you need isn't
listed, fall back to core-only behavior.

**Request**

```
GET /wp-json/worang-client/v1/version
```

**Response — `200 OK`**

```json
{
  "version": "1.0.0",
  "features": ["cache-version"]
}
```

**Response — `404 Not Found`**

Returned by WordPress automatically when the route is not registered (i.e.
plugin absent). The SDK maps 404 to `null`.

Any other status (`500`, network error, etc.) is rethrown by the SDK — a
broken install is not the same as a missing one.

### `GET /wp-json/worang-client/v1/cache-version`

Returns an opaque token the SDK can fold into cache keys. Bumping the
token on the server invalidates every client-side cache entry on the next
roundtrip; this is the primary mechanism for cache invalidation across
deploys.

The token format is opaque — treat it as a string. Common implementations
use a git short SHA, a Unix timestamp, or a monotonic counter persisted
in `wp_options`.

**Request**

```
GET /wp-json/worang-client/v1/cache-version
```

**Response — `200 OK`**

```json
{
  "version": "2026-04-19T14:30:00Z"
}
```

**Response — `404 Not Found`**

Plugin absent → SDK returns `null`.

## SDK integration

```ts
import { WordpressClient } from '@worang/wordpress-client'

const client = new WordpressClient({ baseURL: 'https://example.com' })

// Feature detection
const info = await client.companion.version()
if (info?.features.includes('cache-version')) {
  const token = await client.companion.cacheVersion()
  // fold token into SWR / TanStack Query keys, service worker caches, etc.
}
```

On 404 both `version()` and `cacheVersion()` resolve to `null`. On 5xx or
network failure they reject with the normal `WordpressError` hierarchy —
treat that as "the server is broken", not "the plugin is missing".

## Sample PHP stub

The full production source now lives at `companion-plugin/worang-client-companion.php` in this repository. The snippet below remains as a reference:

```php
<?php
/**
 * Plugin Name: Worang Client Companion
 * Plugin URI:  https://github.com/rworang/wordpress-client
 * Description: Exposes the `/worang-client/v1/*` endpoints consumed by @worang/wordpress-client.
 * Version:     1.0.0
 * Author:      Worang
 * License:     MIT
 */

if (! defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('worang-client/v1', '/version', [
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function () {
            return [
                'version'  => '1.0.0',
                'features' => ['cache-version'],
            ];
        },
    ]);

    register_rest_route('worang-client/v1', '/cache-version', [
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function () {
            $token = get_option('worang_client_cache_version', '0');
            return ['version' => (string) $token];
        },
    ]);
});

// Bump the cache-version token whenever any post or term is saved/deleted.
$bump = function () {
    update_option('worang_client_cache_version', (string) time(), false);
};
add_action('save_post', $bump);
add_action('deleted_post', $bump);
add_action('edited_terms', $bump);
add_action('delete_term', $bump);
```

## Versioning

- The companion plugin versions independently of the SDK.
- The SDK uses `features` for capability detection — do not rely on exact
  version strings. Add a new feature flag for any endpoint or field
  introduced in a new plugin release.
- Breaking changes to an existing feature bump the plugin's major version
  AND require a new `features` flag; the SDK will treat the old flag as
  absent and fall back to core-only behavior.

## Future endpoints (non-normative)

Reserved slots that may appear in future spec revisions — not implemented
today, listed only to communicate intent:

- `GET /worang-client/v1/plugins` — discovery of installed plugins the SDK
  knows how to talk to (e.g. `woocommerce`, `yoast-seo`).
- `GET /worang-client/v1/menus/:location` — a companion-only menu lookup by
  theme location that would obviate the current two-step menu lookup.

Neither is load-bearing for SDK 0.2.0.
