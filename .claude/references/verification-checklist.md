# Verification Checklist

Standard verification steps that every block must complete before requesting merge.

---

## Standard Steps (All Blocks)

- [ ] `pnpm test` — all existing tests pass
  - Note the count before and after (e.g., "617 → 624 tests")
  - No regressions introduced
- [ ] New tests added for all new code
- [ ] `pnpm build` — no TypeScript errors
  - `pnpm --filter @worang-cms/cms build` exits 0
  - `pnpm --filter @worang-cms/server build` exits 0
- [ ] Server starts without errors: `pnpm --filter @worang-cms/server dev`
- [ ] Result summary written at `.sprints/{sprint}/results/block-NN-name.md`
- [ ] Result summary committed on this branch (last commit)

---

## Adding Block-Specific Steps

Every block prompt should extend this checklist with steps specific to what was built.
Examples:

```markdown
## Verification

Complete all of these before marking the block done:

- [ ] `pnpm test` — all existing tests pass (note count before/after)
- [ ] New tests added for all new code
- [ ] `pnpm build` — no TypeScript errors
- [ ] `pnpm --filter @worang-cms/server dev` — server starts without errors
- [ ] `GET /api/admin/authors` returns 200 with pagination envelope
- [ ] `POST /api/admin/authors` creates author and returns 201
- [ ] Author routes require `X-Site-Id` header (returns 400 without it)
- [ ] Result summary written and committed on branch
```

---

## Specificity Rule

Keep the verification section to 5–8 items. More than 8 items usually means the block
is too large.

Make each item specific enough that the implementer cannot mark it done without
actually running the check. Vague items like "test everything" are not verification
steps.

---

## Pre-existing Failures

If there are pre-existing test failures unrelated to the block:

1. Document them in the result summary under "Pre-existing Failures"
2. Do **not** fix them unless they are explicitly in scope
3. Carry them forward as known issues

This keeps the verification step honest — "all existing tests pass" means the tests
that were passing before the block still pass, not that the entire suite is green.
