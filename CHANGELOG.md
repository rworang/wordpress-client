# Changelog

All notable changes to `@worang/wordpress-client` will be documented in this
file. This project follows [Semantic Versioning](https://semver.org/).

## Unreleased

## 0.3.0 — 2026-04-20 (Quality)

### Fixed

- `deletePost`/`Page`/`Category`/`Tag`/`Media` and
  `defineResource.delete` now correctly handle `force: false` soft-deletes.
  The previous shape (`{ deleted: true, previous }`) threw on the trash
  response that WordPress returns for soft deletes. Methods now return a
  discriminated `DeleteResult<T>` — `{ deleted: true, previous: T }` for
  hard delete or `{ deleted: false, trashed: T }` for soft delete.
- README API docs now correctly show the Node 20 requirement, `DeleteResult<T>` return types, and the optional `RequestOptions` params on the low-level read methods.
- Removed dead fallbacks in the navigation and media adapters, and removed the collapsed `| unknown` union in the generic resource delete path.
- `defineResource` README and JSDoc examples now show `base: 'site'` for
  plugin-registered namespaces — the previous examples silently targeted
  `/wp-json/wp/v2/worang/v1/...`, which is not where a plugin endpoint
  lives.

### Changed

- CI now runs the full quality gate on pushes to `dev` and `main`, plus pull requests targeting either branch, while the `dist/` commit step remains restricted to pushes on `main`.
- Minimum Node version raised to **Node 20**. Node 18 is EOL; this also
  unblocks `@vitest/coverage-v8@4.x` which relies on
  `node:inspector/promises` (Node 19+).
- Low-level HTTP helper coverage increased to 94.8% statements, strengthening the retry, timeout, abort, and response parsing safety net.

### Added

- `DeleteResult<T>` discriminated-union type exported from the package
  root for typing delete responses.
- `WordpressConflictError` for 409 conflict responses.
- `WordpressRateLimitError` for 429 rate-limited responses, including parsed `retryAfter` seconds when available.
- `companion-plugin/worang-client-companion.php` v1.0.0 with public `worang-client/v1/version` and `worang-client/v1/cache-version` endpoints plus a portable zip build script.

## 0.2.0 — 2026-04-19 (Authoring)

### Added

- `auth` option on `WordpressClient` supporting static credentials
  (`{ username, appPassword }`) or a dynamic resolver (`{ getAuthHeader }`).
  See types: `AuthConfig`, `AuthCredentials`, `AuthResolver`.
- Post CUD: `createPost`, `updatePost`, `deletePost`.
- Page CUD: `createPage`, `updatePage`, `deletePage`.
- Category CUD: `createCategory`, `updateCategory`, `deleteCategory` —
  invalidates both `/categories` and `/posts` caches.
- Tag CUD: `createTag`, `updateTag`, `deleteTag` — invalidates both
  `/tags` and `/posts` caches.
- Media CUD + upload: `updateMedia`, `deleteMedia`, `uploadMedia`
  (supports `Blob` and `File`, preserves Content-Type, attaches metadata
  via a follow-up `POST /media/:id`).
- `userById(id)` method mirroring `postById` / `pageById`.
- Public `client.request<T>({ method, path, body, params, base, ... })`
  low-level escape hatch with retry + auth + cache invalidation.
- `client.invalidate(pattern)` — invalidate cached entries by prefix,
  `RegExp`, or predicate.
- `client.defineResource<Item, Payload>({ ... })` factory for wrapping
  arbitrary REST endpoints as typed resources. Supports full CRUD
  (`list`/`get`/`create`/`update`/`delete`), singleton shape
  (`{ get, update }` only via `singleton: true`), optional Zod
  `itemSchema` validation, and extra cache invalidation via
  `invalidates: [...]`. See types: `DefineResourceConfig`,
  `ResourceMethods`, `SingletonResourceMethods`.
- `client.companion` namespace with `version()` and `cacheVersion()` —
  both return `null` on 404 for graceful feature detection. See types:
  `CompanionNamespace`, `CompanionVersion`.
- Write payload types exported: `PostWritePayload`, `PageWritePayload`,
  `TermWritePayload`, `MediaWritePayload`.
- `docs/companion-plugin.md` — full contract spec for the opt-in
  companion WordPress plugin, with reference PHP stub.

### Changed

- HTTP transport migrated from axios + axios-retry to native `fetch`
  (Sprint 2 closeout). Runtime dependencies reduced to `{ zod }`.
- Retries are now restricted to **idempotent** methods (`GET`/`HEAD`/
  `OPTIONS` and explicitly-marked idempotent writes). Non-idempotent
  writes are never retried to avoid duplicates on network races.
- README overhauled for the authoring surface — new sections for
  Authentication, Writing Content, Custom Resources, and Companion
  Plugin, plus rewritten Limitations.

### Deprecated

- `client.cacheVersion()` — use `client.companion.cacheVersion()`
  instead. The legacy method continues to work and still hits
  `/worang/v1/cache-version`; removal is planned for v0.3.0.

## 0.1.0 — 2026-03-10

- Initial release. Typed read client for posts, pages, categories,
  tags, users, media, and menus. Zod-validated responses,
  adapter-normalized domain types, TTL response cache, request
  deduplication, retry with exponential backoff, `fetchAll()` helper.
