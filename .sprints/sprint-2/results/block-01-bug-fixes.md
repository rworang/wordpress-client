# Implementer Result Summary: Block 01 — Bug Fixes

**Skill:** Implementer
**Block / Task ID:** block-01
**Date:** 2026-03-10
**Branch:** `block-01/bug-fixes`
**Status:** ✅ Complete

---

## Files Created

_None._

## Files Modified

| File                     | Change summary                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `tests/adapters.test.ts` | Added dedicated test asserting `toMedia(rawMedia).alt === rawMedia.alt_text` and verifying it is not `description.rendered` |
| `tests/client.test.ts`   | Added dedicated test for 403 statusCode preservation via `postById` endpoint                                                |

## Test Results

| Metric      | Before | After |
| ----------- | ------ | ----- |
| Total tests | 63     | 65    |
| Passing     | 63     | 65    |
| Failing     | 0      | 0     |

### New Tests Added

- `tests/adapters.test.ts` — `toMedia › reads alt from alt_text not description.rendered`: asserts `result.alt === rawMedia.alt_text` and `result.alt !== rawMedia.description.rendered`
- `tests/client.test.ts` — `WordpressClient › error handling › preserves HTTP status code 403 in WordpressAuthError`: makes a request to `postById(1)` with an MSW 403 handler and asserts `error.statusCode === 403`

### Pre-existing Failures (carry-forward, not introduced by this block)

_None._

---

## Which bugs were already fixed vs. newly fixed

Both bugs were **already fixed** in commit `18ed177` ("fix: correct media alt text source and AuthError status code") prior to this block:

| Bug                                            | Status at block start                                                           | What was done in this block                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `toMedia().alt` reading `description.rendered` | Already fixed (now reads `alt_text`)                                            | Skipped code change per block note; added dedicated test |
| `WordpressAuthError.statusCode` always 401     | Already fixed (constructor accepts `statusCode`, `handleError` passes `status`) | Skipped code change per block note; added dedicated test |

The previous fix commit also enhanced existing tests with inline assertions (not new `it()` blocks):

- Added `expect(result.alt).toBe('Test image alt')` to the existing `toMedia` transform test
- Extended the existing "throws WordpressAuthError for 403" test to also assert `.statusCode === 403`

This block added new, dedicated `it()` blocks for both requirements to reach the target test count of 65.

---

## Design Decisions Made

| Decision                                                                                     | Rationale                                                                                                                                               | Alternatives considered                      |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Used `postById(1)` for the second 403 test instead of `posts()`                              | Avoids exact duplication of the pre-existing 403 test which already uses `posts()`; exercises the same `handleError` path through a different method    | Using `posts()` (identical to existing test) |
| Combined `toBe(rawMedia.alt_text)` and `not.toBe(rawMedia.description.rendered)` in one test | Two assertions in a single `it()` cleanly documents _both_ what the value should be and what it should not be, making the fixture distinctness explicit | Two separate `it()` blocks                   |

## Issues Encountered

| Issue                                                        | Resolution                                                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Both bugs and partial test assertions were already committed | Per block prompt notes, code changes skipped; added dedicated `it()` blocks to meet the target count of 65 |

---

## Notes for Next Block

- Both bugs (media alt_text, AuthError statusCode) are confirmed fixed and tested.
- Test count is 65 (all passing). No pre-existing failures.
- `rawMedia` fixture has distinct `alt_text: 'Test image alt'` vs `description.rendered: 'A test image caption'`, making the alt_text tests meaningful.

---

## Skill Feedback

**Skill:** implementer
**Observation:** The "Read These First" list is comprehensive and sufficient. One minor ambiguity: the block notes say "skip code changes and proceed to test coverage step" when bugs are pre-fixed, but the test coverage step itself may _also_ be partially complete (as was the case here with inline assertions added by a prior commit). Guidance on what to do when test assertions exist but not as dedicated `it()` blocks would help.
**Location:** "What to Build" > Deliverable notes
**Suggested fix:** Add a note: "If test assertions already exist within an existing `it()` block, add a new dedicated `it()` block anyway to reach the required test count."
