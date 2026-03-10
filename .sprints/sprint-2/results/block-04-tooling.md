# Implementer Result Summary: Block 04 — Tooling (lint/format)

**Skill:** Implementer
**Block / Task ID:** block-04
**Date:** 2026-03-10
**Branch:** `block-04/tooling`
**Status:** ✅ Complete

---

## Files Created

| File | Description |
|------|-------------|
| `eslint.config.js` | ESLint 9 flat config — TS parser, `@typescript-eslint/recommended` rules for `src/` + `tests/`, `no-console: error` for `src/` only |
| `.prettierrc` | Prettier config — `semi: false`, `singleQuote: true`, `tabWidth: 2`, `trailingComma: 'all'`, `printWidth: 120` |

## Files Modified

| File | Change summary |
|------|---------------|
| `package.json` | Added `lint`, `format`, `format:check` scripts; added `eslint ^9.0.0`, `@typescript-eslint/eslint-plugin ^8.0.0`, `@typescript-eslint/parser ^8.0.0`, `prettier ^3.0.0` to devDependencies |
| `pnpm-lock.yaml` | Updated after `pnpm install` (+96 packages) |
| `src/client.ts` | Prettier formatting — long import lines broken/re-joined to fit 120-char print width |
| `src/errors.ts` | Prettier formatting |
| `src/index.ts` | Prettier formatting — domain type imports collapsed to single line |
| `src/schemas/media.ts` | Prettier formatting |
| `src/schemas/page.ts` | Prettier formatting |
| `src/schemas/post.ts` | Prettier formatting |
| `src/utils/dedup.ts` | Prettier formatting |
| `src/utils/pagination.ts` | Prettier formatting |
| `tests/adapters.test.ts` | Prettier formatting + 6 targeted `eslint-disable-next-line` comments (see below) |
| `tests/client.test.ts` | Prettier formatting |
| `tests/dedup.test.ts` | Prettier formatting |
| `tests/fixtures/raw.ts` | Prettier formatting |
| `tests/handlers.ts` | Prettier formatting |

## Test Results

| Metric | Before | After |
|--------|--------|-------|
| Total tests | 67 | 67 |
| Passing | 67 | 67 |
| Failing | 0 | 0 |

### New Tests Added

_None — this block adds no production code._

### Pre-existing Failures

_None._

## ESLint Violations Found and Fixed

All 6 violations were in `tests/adapters.test.ts`. None in `src/`.

| Violation | Location | Fix applied |
|-----------|----------|-------------|
| `@typescript-eslint/no-explicit-any` | line 21 — `toAuthor({ id: 'bad' } as any)` | `// eslint-disable-next-line` |
| `@typescript-eslint/no-explicit-any` | line 38 — `toCategory({ id: 'bad' } as any)` | `// eslint-disable-next-line` |
| `@typescript-eslint/no-explicit-any` | line 62 — `toMedia({ id: 'bad' } as any)` | `// eslint-disable-next-line` |
| `@typescript-eslint/no-explicit-any` | line 90 — `toMediaFromFeatured({...} as any)` | `// eslint-disable-next-line` |
| `@typescript-eslint/no-unused-vars` | line 116 — `const { _embedded, ...postWithoutEmbedded }` | `// eslint-disable-next-line` |
| `@typescript-eslint/no-explicit-any` | line 125 — `toPost({ id: 'bad' } as any)` | `// eslint-disable-next-line` |

**Rationale:** All `as any` casts test runtime schema validation — passing intentionally malformed objects to verify `WordpressSchemaError` is thrown. The `_embedded` destructure is an idiomatic way to strip the key from the object (use of rest spread); the variable itself is not needed. Global disable would hide real issues; targeted comments are appropriate.

## `pnpm lint` output (after fixes)

```
> @worang/wordpress-client@0.1.0 lint /home/amnezia/projects/wordpress-client
> eslint src tests

(no output — exit code 0)
```

## `pnpm format:check` output

```
> @worang/wordpress-client@0.1.0 format:check /home/amnezia/projects/wordpress-client
> prettier --check src tests

Checking formatting...
All matched files use Prettier code style!
```

## Design Decisions Made

| Decision | Rationale | Alternatives considered |
|----------|-----------|------------------------|
| `no-console` applied only to `src/` via a second config block | Tests legitimately use `console.error` for debugging; block prompt explicitly allows this | Could use `warn` in tests — but `error` in src and silence in tests is cleaner |
| Targeted `// eslint-disable-next-line` per-line (not `/* eslint-disable */` block) | Block prompt explicitly requires this approach | File-level or block-level disable would mask real future issues |
| No `parserOptions.project` in `eslint.config.js` | Type-checked rules are not enabled (`recommended` without `-type-checked`) so the TypeScript project reference is not needed | Could add `parserOptions.project: './tsconfig.json'` for type-aware rules, but that's out of scope |

## Issues Encountered

| Issue | Resolution |
|-------|-----------|
| `@typescript-eslint/eslint-plugin` v8 exports `configs.recommended` as a legacy object with `.rules` property | Used `...tsPlugin.configs.recommended.rules` — worked correctly with v8.57.0 |

## Notes for Next Block

- ESLint and Prettier are now configured and all files comply. Future code must pass `pnpm lint` and `pnpm format:check` before merging.
- No `console.log`/`console.error` exist in `src/` — enforced by `no-console: 'error'` rule.
- The `eslint.config.js` uses CJS-style default export (flat config ESM array) — compatible with the project's `"type": "module"` package.json.

---

## Skill Feedback

**Skill:** implementer
**Observation:** No issues observed. Skill instructions were clear and sufficient.
