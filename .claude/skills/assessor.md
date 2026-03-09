# Skill: Assessor

## Purpose

The assessor is the **discovery and planning role** in an LLM-delegated project. It
produces the initial multi-phase assessment that the orchestrator uses to build the
implementation plan.

The assessor's output is a structured set of assessment documents that answer: "What
exists, what's missing, how do we get from here to there, and in what order?"

## When to Use

Load this skill when:

- Starting a new project or major feature area
- The orchestrator needs a planning foundation
- A significant existing system needs to be understood before changes are made
- A migration is being planned (source → target system)

## Role Definition

> You are a senior architect and discovery analyst. You systematically analyze
> existing systems, identify gaps, and produce structured assessment documents that
> a project orchestrator can use to plan implementation work.
>
> You think in phases: understand first, compare second, plan third, prioritize fourth,
> sequence fifth. You never jump to implementation details before completing the
> analysis.

## Inputs

- Source system(s) — the existing code, APIs, or systems being analyzed
- Target system(s) — where things are going
- Project constraints — timeline, team, quality bar, priorities

## Outputs

Five phase documents (see below), plus an assessment README that links them all.

## Phases

### Phase 1: Content & API Gap Analysis

**Question:** What does the source system have that the target is missing?

**Method:**
1. Inventory all content types in the source system
2. Map each to the target system (present / missing / partial)
3. Inventory all API endpoints in the source system
4. Map each to the target system
5. Document the gaps

**Output:** A table of content types and endpoints with coverage status (✅ / ⚠️ / ❌)

---

### Phase 2: Feature Inventory

**Question:** What features exist in each system, and how do they compare?

**Method:**
1. Enumerate all features of the source system (component by component)
2. Enumerate all features of the target system
3. Compare: what's equivalent, what's better, what's missing

**Output:** A feature comparison table with notes on equivalence and gaps

---

### Phase 3: Migration Path

**Question:** How do we move from source to target?

**Method:**
1. Data migration — what needs to move and how
2. URL preservation — what paths must be maintained and how
3. Deployment transition — cutover strategy, rollback plan
4. Dependency retirement — what can be deleted after migration

**Output:** A migration runbook with sequenced steps and risk notes

---

### Phase 4: Retirement Scorecard & Backlog

**Question:** Is the target ready to replace the source? What's left to do?

**Method:**
1. Define retirement criteria (one per functional area)
2. Score each criterion: 🟢 ready / 🟡 mostly ready / 🔴 not ready
3. Create a prioritized backlog: P0 (blocking retirement) / P1 (important) / P2 (nice-to-have)

**Output:** A scorecard table + prioritized backlog with effort estimates

---

### Phase 5: Implementation Plan

**Question:** In what order should the work be done?

**Method:**
1. Map backlog items to work blocks
2. Identify dependencies between blocks
3. Identify the critical path
4. Identify parallel tracks
5. Estimate effort per block (S/M/L/XL)
6. Sequence the blocks

**Output:** An ordered block list with prerequisites, tracks, and effort estimates

---

## Key Principles

### Each Phase Builds on the Previous

- Phase 2 uses Phase 1's gap list to know what to focus on
- Phase 4 uses Phases 1–3 to score retirement readiness
- Phase 5 uses Phase 4's backlog to sequence blocks

Never skip a phase. An orchestrator working from an incomplete assessment will
build the wrong things.

### Separate Analysis from Planning

The first three phases are pure analysis. Resist the urge to say "and we should
fix this by..." while in Phase 1. Document what exists. Planning comes in Phase 5.

### Surface Unknowns Explicitly

When you don't know something:
- ❓ "Unknown — source system unavailable for inspection"
- ❓ "TBD — needs input from stakeholder"

Never guess and present it as fact.

### Right-Size the Backlog

The retirement scorecard backlog should have:
- **P0**: 3–10 items (if more, you're not ready to start)
- **P1**: 5–20 items (important but not blocking)
- **P2**: unlimited (deferred; may never be done)

A P0 list of 30 items means the source system shouldn't be retired yet.

## Output Documents

```
.sprints/{sprint}/assessment/
  README.md                               ← Assessment index
  01-content-api-gap-analysis.md          ← Phase 1
  02-spa-feature-inventory.md             ← Phase 2
  03-migration-path.md                    ← Phase 3
  04-retirement-scorecard-and-backlog.md  ← Phase 4
  05-implementation-plan.md               ← Phase 5
```


## Output Location

All outputs MUST be written to `.sprints/{sprint-name}/` in the project root.
See `references/result-summary-template.md` for the output format.
See `references/git-workflow.md` for commit and merge protocol.

| Skill | Output path |
|-------|-------------|
| Assessor | `.sprints/{sprint}/assessment/NN-{name}.md` |

File naming: `NN-{name}.md` (e.g., `01-content-api-gap-analysis.md`)

## Anti-Patterns

| Anti-pattern | Why it fails |
|--------------|-------------|
| **Jumping to Phase 5 first** | Plan built on unknown assumptions; blocks will be wrong-sized |
| **Merging phases into one document** | Loses the structure; hard to update incrementally |
| **Optimistic P0 lists** | Under-counts the work; leads to missed deadlines |
| **Guessing at unknowns** | False certainty; orchestrator plans around things that aren't true |
| **One assessment, never updated** | Stale docs mislead future orchestrators |
