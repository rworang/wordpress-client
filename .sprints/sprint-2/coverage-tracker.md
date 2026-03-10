# Coverage Tracker — Sprint 2

**Sprint:** sprint-2
**Started:** 2026-03-10
**Last updated:** 2026-03-10 (block-04 complete)

---

## Block Status

| Block ID | Block Name             | Prompt                                        | Result                                         | Branch                          | Status | Test Δ     |
| -------- | ---------------------- | --------------------------------------------- | ---------------------------------------------- | ------------------------------- | ------ | ---------- |
| block-01 | Bug Fixes              | [✍](prompts/block-01-bug-fixes.md)            | [✅](results/block-01-bug-fixes.md)            | `block-01/bug-fixes`            | ✅     | +2 (63→65) |
| block-02 | Content Completeness   | [✍](prompts/block-02-content-completeness.md) | [✅](results/block-02-content-completeness.md) | `block-02/content-completeness` | ✅     | +2 (65→67) |
| block-03 | DX and Quality         | [✍](prompts/block-03-dx-and-quality.md)       | [✅](results/block-03-dx-and-quality.md)       | `block-03/dx-and-quality`       | ✅     | 0 (67→67)  |
| block-04 | Tooling (lint/format)  | [✍](prompts/block-04-tooling.md)              | [✅](results/block-04-tooling.md)              | `block-04/tooling`              | ✅     | 0 (67→67)  |
| block-05 | Optional Features      | [✍](prompts/block-05-optional-features.md)    | —                                              | `block-05/optional-features`    | ⬜     | —          |
| block-06 | Advisor-Gated Features | — (blocked: A-01, A-02)                       | —                                              | —                               | ⬜     | —          |

**Status legend:**

- ✅ Complete — branch merged, result summary committed
- 🔄 In progress — branch exists, not yet merged
- ⬜ Not started — block defined but not yet prompted

---

## Notes

- P1-02 (`sticky` param) removed from Block 02 scope — already implemented in `src/types/params.ts:48`
- Block 06 blocked on advisor decisions A-01, A-02 (A-03 closed by Block 02 design)
- v1.0 definition of done requires blocks 01, 02, 03 only; 04 is quality gate; 05/06 are post-v1.0
- P0 bugs (alt text + AuthError status code) appear already fixed in commit `18ed177` — block-01 implementer should verify and add missing test coverage

---

## Skill Feedback

**Skill:** orchestrator
**Session:** 2026-03-10

### Issues Observed

| Issue                                                                                                                                        | Location                                                      | Suggested Fix                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Skill says to use `git checkout dev` in branch lifecycle but this project's main branch is `main` — prompts must use the correct branch name | orchestrator.md §Branch Lifecycle (defers to git-workflow.md) | git-workflow.md §Branch Lifecycle should note that `dev` is a placeholder; implementers should substitute the actual integration branch name                       |
| No guidance on what to do when a block's bugs are already fixed before the prompt is executed (hotfix scenario)                              | orchestrator.md §Process                                      | Add a note: "Include an explicit 'verify current state first' step in bug-fix block prompts so the implementer doesn't re-apply changes that are already in place" |

### What Worked Well

- The three-layer prompt structure (role / read-these-first / what-to-build) produced focused, self-contained prompts
- Having the planner's exact file paths and line references made the "Read These First" sections precise and actionable
