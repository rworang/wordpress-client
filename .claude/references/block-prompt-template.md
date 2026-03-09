# Block Prompt Template

Use this template when writing a block prompt for the implementer. Fill in every
section — empty sections signal an incomplete prompt.

---

```markdown
# Block NN: [Block Name]

**Branch:** `block-NN/descriptive-name`
**Track:** Backend / Frontend / Infra / Docs
**Prerequisites:** Block NN-1, Block NN-2 (or "None")
**Estimated effort:** S / M / L / XL

---

## Role

You are a senior TypeScript developer working on the Worang CMS project. You follow
established patterns exactly and produce code that integrates seamlessly with the
existing codebase.

[Add any block-specific role notes here, e.g.: "You have deep expertise in Hono's
OpenAPI integration and Zod schema design."]

---

## Repository

Repository: `rworang/worang-cms`

The project is a pnpm monorepo with:
- `packages/platform` — auth, users, sites, memberships
- `packages/cms` — pages, assets, posts, authors, categories, navigation, generator
- `packages/apps/server` — thin HTTP entry point
- `packages/theme` — Vue 3 design system (source-only)
- `packages/apps/admin-ui` — CMS dashboard
- `packages/apps/platform-ui` — platform dashboard

---

## Read These First

Before writing any code, read these files in order:

1. `[file path]` — [what it shows; which section matters]
2. `[file path]` — [what it shows; which section matters]
3. `[file path]` — [what it shows; which section matters]
4. `[file path]` — [what it shows; which section matters]
5. `[file path]` — [what it shows; which section matters]

**Rules for this section:**
- 5–10 files maximum — more than 10 and the LLM skims everything
- Ordered by importance — most critical patterns first
- One-line annotation per file — what it shows and which section matters
- Include the test file — so the LLM follows test patterns
- Include what the block extends — so the LLM sees the context it's modifying

---

## What to Build

### Deliverable 1: [Name]

[Description of what to build]

**Files to create:**
- `[path]` — [what it does]
- `[path]` — [what it does]

**Files to modify:**
- `[path]` — [what to change]

**Acceptance criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### Deliverable 2: [Name]

[Repeat for each deliverable]

---

## Implementation Notes

[Specific guidance, gotchas, or constraints for this block]

---

## Verification

Complete all of these before marking the block done:

- [ ] `pnpm test` — all existing tests pass
- [ ] New tests added for all new code
- [ ] `pnpm build` — no TypeScript errors
- [ ] `pnpm --filter @worang-cms/server dev` — server starts without errors
- [ ] [Block-specific verification step]
- [ ] [Block-specific verification step]
- [ ] Result summary written and committed on this branch

---

## Result Summary

Write the result summary BEFORE requesting merge. The result summary is part of
the deliverable — it must be committed and pushed on the same branch as the code.

This is the last commit on the branch:
1. Complete all verification steps above
2. Write the result summary at `.sprints/{sprint}/results/block-NN-name.md`
3. `git add` the result summary
4. `git commit -m "docs: add block NN result summary"`
5. `git push`
6. THEN report completion to the orchestrator

The branch is not mergeable without the committed result summary.

See `.claude/references/git-workflow.md` for the complete branch lifecycle.
See `.claude/references/result-summary-template.md` for the result summary format.
```

---

## The "Read These First" Pattern

The single most important element in a block prompt. Without explicit file references,
the LLM guesses at patterns instead of following established ones.

### Good Example

```markdown
## Read These First

1. `packages/cms/src/authors/author.routes.ts` — canonical route pattern for this
   codebase; pay attention to the `createRoute()` + `app.openapi()` structure at
   the bottom and how the middleware chain is assembled
2. `packages/cms/src/authors/author.usecases.ts` — thin usecase pattern; note how
   errors are typed as domain errors, not generic exceptions
3. `packages/cms/src/authors/author.pg.repo.ts` — PostgreSQL repository pattern;
   note the `sql` tagged template usage and how rows are mapped to domain entities
4. `packages/cms/src/authors/author.schemas.ts` — Zod schema registration with
   `.openapi()` — every schema used in routes must be registered this way
5. `packages/cms/src/authors/author.test.ts` — test structure: note the
   `createTestApp()` helper, the database setup/teardown, and assertion patterns
```

### Bad Example (Anti-pattern)

```markdown
## Context

The codebase uses a ports-and-adapters architecture with Hono routes and PostgreSQL.
Follow the existing patterns.
```

This is vague and useless. The LLM has no idea which file to open to understand "the
existing patterns".

---

## Token Budget

A block prompt budget of ~100K tokens breaks down roughly as:

| Component | Token estimate | Notes |
|-----------|---------------|-------|
| Block prompt (instructions) | ~2K | Keep it focused |
| "Read These First" files (5–10 files) | ~30–50K | ~3–5K per file |
| LLM output (code + result summary) | ~20–30K | |
| Safety margin | ~15–30K | For reasoning, tool calls |
| **Total** | ~70–110K | |

### Splitting Heuristics

Split a block when:
- It touches more than 15 files
- It spans both backend and frontend
- It requires understanding two different subsystems
- The result summary from a previous block would be too large to include in context
