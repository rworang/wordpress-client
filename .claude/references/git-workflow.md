# Git Workflow Reference

## Branch Naming

| Type                 | Pattern                      | Example                            |
| -------------------- | ---------------------------- | ---------------------------------- |
| Implementation block | `block-NN/descriptive-name`  | `block-03/authors-module`          |
| Sub-block            | `block-NNx/descriptive-name` | `block-22a/vue-ssr-infrastructure` |
| Bug fix              | `fix/descriptive-name`       | `fix/smoke-test-failures`          |
| Documentation        | `docs/descriptive-name`      | `docs/skills-and-reports`          |

---

## Commit Message Conventions

| Prefix      | When to use                                         |
| ----------- | --------------------------------------------------- |
| `feat:`     | New functionality                                   |
| `refactor:` | Restructuring existing code without behavior change |
| `fix:`      | Bug corrections                                     |
| `docs:`     | Documentation only                                  |
| `test:`     | Tests only                                          |
| `chore:`    | Build, config, tooling                              |

Examples:

```
feat: add AuthorsModule routes and repository
test: add AuthorsModule integration tests
docs: add block 03 result summary
fix: resolve category slug uniqueness constraint
chore: update pnpm lockfile
```

---

## Branch Lifecycle

```
1. Create branch
   git checkout dev && git pull
   git checkout -b block-NN/descriptive-name

2. Implement
   - Write code following "Read These First" patterns
   - Small, focused commits as you go

3. Write tests
   - Add tests for all new code
   - Run pnpm test; fix all failures

4. Complete verification checklist
   - See references/verification-checklist.md

5. Write result summary
   - Write to .sprints/{sprint}/sessions/{NN}-result-{name}.md
   - See references/result-summary-template.md

6. Commit result summary (LAST commit on the branch)
   git add .sprints/{sprint}/sessions/{NN}-result-{name}.md
   git commit -m "docs: add block NN result summary"

7. Push
   git push -u origin block-NN/descriptive-name

8. Request merge
   - Report completion to the orchestrator
   - The branch is NOT ready for merge until the result summary is committed
```

---

## Critical Rule: Result Summary Before Merge

> **The result summary MUST be committed on the feature branch BEFORE requesting
> merge. The branch is not ready for merge until the result summary is committed.
> This is the last commit on the branch.**

This rule exists because:

- Result summaries committed after merge go directly to `dev` (dirty history)
- Forgotten result summaries deprive the next block of context
- The orchestrator verifies this before merging

---

## Merge Protocol (Orchestrator)

Before merging a completed block branch, the orchestrator verifies:

1. Result summary exists at `.sprints/{sprint}/sessions/{NN}-result-{name}.md`
2. Result summary is committed on the branch (not a pending uncommitted file)
3. All verification steps from the block prompt have been confirmed
4. No merge conflicts with `dev` (rebase if needed — see below)

Then merge:

```bash
git checkout dev
git merge --no-ff block-NN/descriptive-name -m "feat: merge block NN (descriptive name)"
git push
```

After merge, update the coverage tracker on `dev`:

```bash
# Edit .sprints/{sprint}/coverage-tracker.md
git add .sprints/{sprint}/coverage-tracker.md
git commit -m "chore: update coverage tracker after block NN"
git push
```

---

## Conflict Resolution

If the branch has conflicts with `dev`, rebase before requesting merge:

```bash
git fetch origin
git rebase origin/dev
# Resolve conflicts, then:
git rebase --continue
git push --force-with-lease
```

Do not merge `dev` into the branch — always rebase.
