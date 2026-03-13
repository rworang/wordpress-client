# Result Summary Template

Every completed skill output produces a result summary. This is the connective tissue
between blocks — it's how context flows forward to the next implementer.

This template is used by ALL skills, not just the implementer.

---

## Template

```markdown
# [Skill] Result Summary: [Block/Task Name]

**Skill:** Implementer / Auditor / Documenter / Assessor / Planner
**Block / Task ID:** block-NN / fix-name / audit-name / docs-name
**Date:** YYYY-MM-DD
**Branch:** `block-NN/descriptive-name`
**Status:** ✅ Complete / ⚠️ Complete with issues / ❌ Incomplete

---

## Files Created

| File              | Description    |
| ----------------- | -------------- |
| `path/to/file.ts` | [what it does] |

## Files Modified

| File              | Change summary             |
| ----------------- | -------------------------- |
| `path/to/file.ts` | [what was changed and why] |

## Test Results

| Metric      | Before | After |
| ----------- | ------ | ----- |
| Total tests | NNN    | NNN   |
| Passing     | NNN    | NNN   |
| Failing     | N      | N     |

### New Tests Added

- `path/to/test.ts` — [what it tests]

### Pre-existing Failures (carry-forward, not introduced by this block)

- [test name] — [root cause if known]

## Design Decisions Made

| Decision   | Rationale | Alternatives considered |
| ---------- | --------- | ----------------------- |
| [decision] | [why]     | [alternatives]          |

## Issues Encountered

| Issue   | Resolution                        |
| ------- | --------------------------------- |
| [issue] | [how it was resolved or deferred] |

## Specific Values Changed

_For documenter/auditor outputs: list specific claims updated, sections revised,
or findings reported._

| Item   | Before   | After / Finding |
| ------ | -------- | --------------- |
| [item] | [before] | [after]         |

## Notes for Next Block

[Anything the next implementer needs to know that isn't captured in the files]
```

---

## Git Instruction

> **This file MUST be committed on the feature branch before requesting merge.**
> It is the last commit on the branch:
>
> ```bash
> git add .sprints/{sprint}/sessions/{NN}-result-{name}.md
> git commit -m "docs: add block NN result summary"
> git push
> ```
>
> The branch is not ready for merge until the result summary is committed and pushed.

See `.claude/references/git-workflow.md` for the complete branch lifecycle.

---

## Skill-Specific Output Locations

| Skill       | Output path                     | File name convention           |
| ----------- | ------------------------------- | ------------------------------ |
| Implementer | `.sprints/{sprint}/sessions/`   | `{NN}-result-{name}.md`        |
| Auditor     | `.sprints/{sprint}/sessions/`   | `audit-result-{name}.md`       |
| Documenter  | `.sprints/{sprint}/sessions/`   | `docs-result-{name}.md`        |
| Assessor    | `.sprints/{sprint}/assessment/` | `NN-{name}.md`                 |
| Planner     | `.sprints/{sprint}/`            | `planner-checkpoint-{name}.md` |
