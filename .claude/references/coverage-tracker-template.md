# Coverage Tracker Template

The coverage tracker is a living document that the orchestrator maintains in
`.sprints/{sprint}/coverage-tracker.md`. It maps every planned block to its prompt,
result, and status.

---

## Template

```markdown
# Coverage Tracker — {Sprint Name}

**Sprint:** {sprint-name}
**Started:** YYYY-MM-DD
**Last updated:** YYYY-MM-DD

---

## Block Status

| Block ID | Block Name | Prompt                       | Result                       | Branch          | Status | Test Δ |
| -------- | ---------- | ---------------------------- | ---------------------------- | --------------- | ------ | ------ |
| block-01 | [Name]     | [sessions/01-prompt-name.md] | [sessions/01-result-name.md] | `block-01/name` | ✅     | +7     |
| block-02 | [Name]     | [sessions/02-prompt-name.md] | —                            | `block-02/name` | 🔄     | —      |
| block-03 | [Name]     | —                            | —                            | —               | ⬜     | —      |

**Status legend:**

- ✅ Complete — branch merged, result summary committed
- 🔄 In progress — branch exists, not yet merged
- ⬜ Not started — block defined but not yet prompted

---

## Notes

[Any sprint-level notes, decisions, or carry-forward issues]
```

---

## When and How to Update

The **orchestrator** is responsible for keeping this file current.

### After writing a block prompt

1. Add a row for the block with the prompt path
2. Set status to ⬜ (not started) or 🔄 if the implementer is already working

### After a block is merged

1. Set status to ✅
2. Fill in the result path
3. Fill in the test delta (from the result summary)
4. Commit the update on `dev`:
   ```bash
   git add .sprints/{sprint}/coverage-tracker.md
   git commit -m "chore: update coverage tracker after block NN"
   git push
   ```

### Columns

| Column     | Description                                                          |
| ---------- | -------------------------------------------------------------------- |
| Block ID   | Identifier matching the branch prefix (e.g., `block-03`, `fix-slug`) |
| Block Name | Short human-readable name                                            |
| Prompt     | Path to the block prompt file in `.sprints/{sprint}/sessions/`       |
| Result     | Path to the result summary in `.sprints/{sprint}/sessions/`          |
| Branch     | Git branch name                                                      |
| Status     | ✅ / 🔄 / ⬜ (see legend)                                            |
| Test Δ     | Net change in test count (e.g., `+7`, `-2`, `0`)                     |
