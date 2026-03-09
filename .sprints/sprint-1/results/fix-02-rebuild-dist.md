# F-02 Result Summary: Rebuild dist

## Build Command Output

```
$ pnpm clean
> rm -rf dist

$ pnpm build
> tsc -p tsconfig.build.json
(no output — exit code 0, no TypeScript errors)
```

Build completed cleanly. No TypeScript errors.

## Pre-Build State

After `git pull`, origin/main was already at commit `f22d060 chore: update dist [skip ci]`,
which was produced by the CI auto-build workflow after F-01 merged. The freshly rebuilt
dist matched the committed state exactly — no diff after `pnpm clean && pnpm build`.

## New Files in dist/ (vs. stale block-0 dist)

Previously missing from stale dist, now present:

- `dist/adapters/navigation.js` + `.d.ts` + `.map` files
- `dist/adapters/page.js` + `.d.ts` + `.map` files
- `dist/adapters/tag.js` + `.d.ts` + `.map` files
- `dist/utils/pagination.js` + `.d.ts` + `.map` files
- `dist/schemas/index.js` (schema barrel from blocks 1–5)

## Verification Grep Outputs

### dist/adapters/ contents
```
author.js, category.js, index.js, media.js, navigation.js, page.js, post.js, tag.js
(plus matching .d.ts and .js.map files for each)
```

### fetchAll export in dist/utils/pagination.js
```
 * import { fetchAll } from '@worang/wordpress-client'
 * const allPosts = await fetchAll((page) => client.posts({ page, per_page: 100 }))
export async function fetchAll(fn) {
```

### Key symbols in dist/index.js
```
export { WordpressClient } from './client';
export { fetchAll } from './utils/pagination';
```

### Adapter functions NOT in dist/index.js
```
grep "toPost\|toPage\|toMedia" dist/index.js
(no output — exit code 1)
```

### dist/index.d.ts
```
-rw-r--r-- 1 amnezia amnezia 1060 Mar  9 23:14 dist/index.d.ts
19 dist/index.d.ts
```

## Acceptance Criteria

- [x] `pnpm build` exits with code 0 (no errors)
- [x] `dist/adapters/navigation.js` exists (was missing from stale dist)
- [x] `dist/adapters/page.js` exists (was missing from stale dist)
- [x] `dist/adapters/tag.js` exists (was missing from stale dist)
- [x] `dist/utils/pagination.js` contains `fetchAll`
- [x] `dist/index.js` does not contain `toPost` or any adapter exports
- [x] Commit exists on `main` with message `chore: update dist [skip ci]` (CI-produced; dist is current)
- [x] Result summary written and committed on this branch

## Notes

The CI auto-build workflow (`build.yml`) ran successfully after F-01 merged and produced
commit `f22d060`. The manual rebuild confirmed the dist is identical to the CI output,
validating the CI artifact. F-03 investigation into why CI did not run for blocks 1–4
remains open, but for the current state the dist is correct and complete.
