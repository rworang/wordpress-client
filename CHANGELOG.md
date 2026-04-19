# Changelog

All notable changes to `@worang/wordpress-client` will be documented in this
file. This project follows [Semantic Versioning](https://semver.org/).

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
