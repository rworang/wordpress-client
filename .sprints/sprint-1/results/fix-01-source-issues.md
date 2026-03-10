# Fix F-01: Source Issues — Result Summary

**Branch:** `fix/source-issues`
**Date:** 2026-03-09
**Status:** Complete

---

## Files Modified

| File                    | Change                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`          | Removed adapter export line and associated comment (lines 50–51)                                                |
| `src/client.ts`         | Added `options?: RequestOptions` to `menus()` signature; pass `options?.signal` to `dedupGet`                   |
| `src/schemas/index.ts`  | Added 4 missing schema exports: `RawTagSchema`, `RawPageSchema`, `RawMenuItemSchema`, `RawNavigationMenuSchema` |
| `src/adapters/media.ts` | Fixed unreachable optional chain: `raw.description?.rendered ?? ''` → `raw.description.rendered`                |
| `tests/client.test.ts`  | Added abort signal test for `menus()` in the `describe('navigation'` block                                      |

---

## Test Results

| Metric            | Before | After |
| ----------------- | ------ | ----- |
| Total tests       | 62     | 63    |
| Passing           | 62     | 63    |
| Failing           | 0      | 0     |
| TypeScript errors | 0      | 0     |

---

## Deliverables

### D1 — Remove adapter exports from public barrel

Removed from `src/index.ts`:

```ts
// Adapters (for advanced use cases)
export {
	toPost,
	toPage,
	toMedia,
	toCategory,
	toTag,
	toMenuItem,
	toNavigationMenu,
	toAuthor,
} from "./adapters"
```

The public API now exposes only `WordpressClient`, domain types, query param types, errors, and `fetchAll`. Adapter functions remain internal, accessible only through `src/adapters/index.ts` (which is documented as `@internal`).

### D2 — Abort signal support for `menus()`

`menus()` now matches the `menuItems()` pattern exactly:

```ts
// Before
async menus(): Promise<PaginatedResponse<NavigationMenu>> {
  const response = await this.dedupGet<RawNavigationMenu[]>(this.http, '/menus', {
    page: 1, per_page: 100,
  })

// After
async menus(options?: RequestOptions): Promise<PaginatedResponse<NavigationMenu>> {
  const response = await this.dedupGet<RawNavigationMenu[]>(this.http, '/menus', {
    page: 1, per_page: 100,
  }, options?.signal)
```

One new test added to `tests/client.test.ts` inside `describe('navigation'`:

```ts
it("aborts a menus request when signal is triggered", async () => {
	const controller = new AbortController()
	controller.abort()
	const client = createClient()
	await expect(client.menus({ signal: controller.signal })).rejects.toThrow()
})
```

### D3 — Complete schema barrel

`src/schemas/index.ts` previously exported 5 of the defined schemas. After this fix all 9 named schemas are exported (note: the media schema file exports 2 schemas on one line, so the barrel has 7 export lines covering 9 schema names):

```ts
export { RawAuthorSchema } from "./author"
export { RawCategorySchema } from "./category"
export { RawMediaSchema, RawFeaturedMediaSchema } from "./media"
export { RawMenuItemSchema, RawNavigationMenuSchema } from "./navigation"
export { RawPageSchema } from "./page"
export { RawPostSchema } from "./post"
export { RawTagSchema } from "./tag"
```

### D4 — Fix unreachable optional chain in `toMedia`

`RawMedia.description` is typed as `{ rendered: string }` (non-optional). The optional chain and nullish coalescing were both dead code. Fixed `src/adapters/media.ts:24`:

```ts
// Before
alt: raw.description?.rendered ?? '',

// After
alt: raw.description.rendered,
```

---

## Verification Checklist

- [x] `pnpm test` — 63 tests pass (62 original + 1 new)
- [x] `pnpm typecheck` — no TypeScript errors
- [x] `grep "from './adapters'" src/index.ts` — returns nothing
- [x] `menus()` signature accepts `options?: RequestOptions`
- [x] `src/schemas/index.ts` exports all defined schemas
- [x] `src/adapters/media.ts:24` reads `raw.description.rendered` (no `?.` or `?? ''`)

---

## Design Decisions Made

None. All changes were strictly specified in the block prompt and followed the existing `menuItems()` pattern.

---

## Issues Encountered

The block prompt states "exports 5 of 8 schemas" and calls for adding "4 missing exports," but media and navigation schema files each export 2 named schemas, resulting in 9 total schema names across 7 export lines. The acceptance criterion was interpreted as exporting all defined schemas (9), not exactly 8. All tests pass and typecheck is clean.
