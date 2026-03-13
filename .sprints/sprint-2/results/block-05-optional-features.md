# Implementer Result Summary: Block 05 — Optional Features (Users)

**Skill:** Implementer
**Block / Task ID:** block-05
**Date:** 2026-03-10
**Branch:** `block-05/optional-features`
**Status:** ✅ Complete

---

## Files Created

None. All changes were additions to existing files.

## Files Modified

| File                   | Change summary                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/params.ts`  | Added `UsersQueryParams` interface with 8 optional fields                                                                                                                 |
| `src/client.ts`        | Added `RawAuthor` and `Author` type imports, `UsersQueryParams` import, `toAuthor` adapter import, and `users()` / `user()` methods in a new `// ---- Users ----` section |
| `src/index.ts`         | Added `UsersQueryParams` to the params re-export block                                                                                                                    |
| `tests/handlers.ts`    | Added `rawAuthor` import and two MSW handlers: `GET /wp/v2/users` (with `slug=not-found` filtering) and `GET /wp/v2/users/:id`                                            |
| `tests/client.test.ts` | Added `users` describe block with 4 tests                                                                                                                                 |
| `README.md`            | Added `fetchAll(fn)` subsection within Section 8 (Pagination)                                                                                                             |

## Test Results

| Metric      | Before | After |
| ----------- | ------ | ----- |
| Total tests | 67     | 71    |
| Passing     | 67     | 71    |
| Failing     | 0      | 0     |

### New Tests Added

- `tests/client.test.ts` — `users > fetches paginated users`
- `tests/client.test.ts` — `users > passes per_page param in request`
- `tests/client.test.ts` — `users > returns user by slug`
- `tests/client.test.ts` — `users > returns null for non-existent user slug`

### Pre-existing Failures (carry-forward, not introduced by this block)

None.

## Design Decisions Made

| Decision                                                           | Rationale                                                                                            | Alternatives considered                                                                             |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Placed `users()` / `user()` between Tags and Media sections        | Block prompt suggested "near categories/tags"; Tags is the nearest adjacent section                  | Could have placed after Media, but Tags is a closer semantic match (both are simple flat resources) |
| `user(slug)` passes `slug` as a query param (not URL path segment) | Matches `post(slug)`, `category(slug)`, `tag(slug)` pattern exactly — `/users?slug=x` not `/users/x` | `/users/:id` is for numeric ID lookup; slug filtering uses the list endpoint                        |
| No deviation from `posts()` / `post()` pattern                     | Block prompt explicitly called this out as the model to follow                                       | None needed                                                                                         |

## Issues Encountered

| Issue                                                                                             | Resolution                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RawAuthor` has no `slug` field                                                                   | Not a problem — `user(slug)` passes `slug` as a query param to the API, which filters server-side. The fixture returns correctly for any non-`not-found` slug. |
| README Limitations section lists "Users" and "Tags" as unsupported despite both being implemented | Out of scope for this block; noted here for a future cleanup pass                                                                                              |

## Verification Checklist

- [x] `pnpm test` — 71/71 passing (4 new tests added)
- [x] `pnpm typecheck` — no TypeScript errors
- [x] `client.users()` returns `PaginatedResponse<Author>` (verified in tests)
- [x] `client.users({ per_page: 5 })` sends `per_page=5` (asserted in test via MSW handler override)
- [x] `client.user('jane-doe')` returns the author (verified in tests)
- [x] `client.user('not-found')` returns null (verified in tests)
- [x] `UsersQueryParams` exported from package root
- [x] README has `fetchAll` section

## Notes for Next Block

- `toAuthor` and `RawAuthor` are reused as-is — no changes to adapters or schemas were needed.
- `Author` was already exported from `src/index.ts` (confirmed before starting).
- The Limitations section in README is stale (claims Users and Tags are unsupported). A future docs block should update it.

---

## Skill Feedback

**Skill:** implementer
**Observation:** No issues observed. Skill instructions were clear and sufficient. The "Read These First" file list matched exactly what was needed to understand the patterns. The step-by-step process (read context → understand deliverables → implement → test → verify → result summary) is well-structured.
**Location:** N/A
**Suggested fix:** No changes needed.
