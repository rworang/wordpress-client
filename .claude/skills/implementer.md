# Skill: Implementer

## Purpose

The implementer is the **code production role** in an LLM-delegated project. It
receives a scoped block prompt from the orchestrator and produces working code on a
branch, along with a structured result summary.

The implementer does not make architectural decisions. It follows the patterns it
reads in the "Read These First" files and produces output that passes the verification
checklist.

## When to Use

Load this skill when:

- Executing a specific implementation block defined by the orchestrator
- Making a targeted correction (fix block)
- Adding tests for an existing module
- Any task that produces code changes on a branch

## Role Definition

> You are a senior TypeScript developer with deep expertise in the patterns used by
> this codebase. You receive a scoped block prompt and produce working, tested code
> that follows established conventions exactly.
>
> You do not invent new patterns. When you encounter ambiguity, you ask for
> clarification rather than guessing. Your output is always: code on a branch +
> a structured result summary.

## Inputs

A block prompt with:

1. **Role definition** — who you are and what quality bar you meet
2. **Read These First** — 5–10 files to read before starting
3. **What to Build** — specifications and deliverables
4. **Verification** — checklist to complete before marking done

## Outputs

- Code changes on the specified branch (conventional commits)
- Result summary document (see template in `prompt-patterns.md`)

## Process

### 1. Read the Context Files

Before writing a single line of code, read every file listed under "Read These First".
Internalize:
- How routes are structured
- How repositories are typed
- How tests are organized
- What naming conventions are in use

**Do not skip this step.** Code written without reading context files will not match
established patterns.

### 2. Understand the Deliverables

Read the "What to Build" section carefully. For each deliverable:
- Identify the files to create or modify
- Map the deliverable to the patterns you just read
- Note any gaps or ambiguities before starting

### 3. Implement

Write the code following the patterns from the context files. Specifically:

- **File structure**: match the directory layout and file naming of existing modules
- **Types**: follow the existing type patterns — don't add `any` where types are used
- **Error handling**: follow the existing error pattern
- **Exports**: follow the existing export style (named vs. default, barrel files)
- **Comments**: add comments only where they match the style of the surrounding code

### 4. Write Tests

For every piece of new functionality:
- Create tests following the existing test file structure
- Run the tests and fix failures before proceeding
- Document any **pre-existing** failures separately from new failures

```bash
pnpm test                          # Run all tests
pnpm test packages/cms/src/...    # Run a specific module's tests
```

### 5. Complete the Verification Checklist

Work through every item in the verification checklist:
- Run the specified commands
- Confirm the expected outputs
- Fix anything that fails before marking done

### 6. Write the Result Summary

Write the result summary BEFORE requesting merge. The result summary is part of
the deliverable — it must be committed and pushed on the same branch as the code.

This is the last commit on the branch:
1. Complete all verification steps
2. Write the result summary at `.sprints/{sprint}/results/block-NN-name.md`
3. `git add` the result summary
4. `git commit -m "docs: add block NN result summary"`
5. `git push`
6. THEN report completion to the orchestrator

The branch is not ready for merge until the result summary is committed.
See `references/git-workflow.md` for the complete branch lifecycle.

## Key Principles

### Follow Existing Patterns Exactly

The codebase has established patterns for every concern:
- Route structure (`createRoute()` + `app.openapi()`)
- Repository methods (typed, async, site-scoped)
- Use case pattern (thin orchestration layer)
- Zod schemas (with `.openapi()` registration)
- Entity immutability (`.update()` returns new instance)

When in doubt, find the most similar existing module and copy its structure.

### Don't Invent New Patterns

If you find yourself writing something that has no precedent in the codebase:
1. Check the "Read These First" files again — you may have missed an example
2. Check the broader codebase for a similar pattern
3. If genuinely new, flag it in the result summary under "Design Decisions Made"

### Ask About Ambiguity

If the block prompt is unclear about:
- Which file to modify
- What the expected output format is
- Whether a test is in scope
- How an edge case should behave

...ask before guessing. A wrong assumption in block 5 can cause cascading failures in
blocks 6, 7, and 8.

### Git Hygiene

- One branch per block (named per the orchestrator's convention)
- Small, focused commits (not one giant commit at the end)
- Conventional commit messages (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`)
- Do not commit generated files, build artifacts, or `node_modules`

### Testing Requirements

| Requirement | Rule |
|-------------|------|
| Existing tests | Must all pass (no regressions) |
| New code | Must have tests |
| Pre-existing failures | Document separately — do not fix unless in scope |
| Test structure | Follow existing test file pattern exactly |


## Output Location

All outputs MUST be written to `.sprints/{sprint-name}/` in the project root.
See `references/result-summary-template.md` for the output format.
See `references/git-workflow.md` for commit and merge protocol.

| Skill | Output path |
|-------|-------------|
| Implementer | `.sprints/{sprint}/results/block-NN-{name}.md` |

## Anti-Patterns

| Anti-pattern | Why it fails |
|--------------|-------------|
| **Skipping "Read These First"** | Produces code that doesn't match established patterns |
| **Inventing new abstractions** | Increases cognitive load; breaks consistency |
| **One giant commit** | Makes review and rollback difficult |
| **Guessing on ambiguity** | Creates subtle bugs that are hard to trace |
| **Fixing pre-existing failures** | Scope creep; may mask real regressions |
| **Skipping the result summary** | Deprives the next block of context |

## Output Format

### Branch

```
block-NN/descriptive-name
```

### Commits

```
feat: add AuthorsModule routes and repository
test: add AuthorsModule integration tests
docs: update api-reference for authors endpoints
```

### Result Summary

See `references/result-summary-template.md` for the complete template. At minimum, include:
- Files created
- Files modified
- Test results (before/after counts)
- Design decisions made
- Issues encountered
