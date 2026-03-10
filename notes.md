# Skill Improvement Notes

Working notes from testing the project skill pipeline (assessor → advisor → designer → planner).
These are observations from sprint-2, not finalised suggestions.

---

## The Pipeline Is Implicit — It Should Be Explicit

The role sequence (assessor → advisor → designer → planner → implementer) is implied by
cross-references in individual skill files but never stated anywhere as a whole. Someone
loading a single skill file has no map of where they are in the pipeline.

**Suggestion:** Add a `00-pipeline.md` or `README.md` to `.claude/skills/project/` that
diagrams the full pipeline, states each role's inputs and outputs in one place, and shows
when to skip roles (e.g., bug fixes that go assessor → planner directly).

---

## Assessor Skill (`01-assessor.md`)

### Phase names assume a migration context

The phase names (especially Phase 3: "Migration Path" and Phase 4: "Retirement Scorecard")
are written for source-to-target migrations. Sprint-2 was a library quality audit — not a
migration. The assessor adapted by renaming:

- Phase 3 → "Documentation & Safety Analysis"
- Phase 4 → "Production Readiness Scorecard"

This worked fine in practice, but the skill file gives no indication this adaptation is
allowed. A reader following the skill literally would produce a "migration runbook" for a
library that has nothing to migrate.

**Suggestion:** Add a note that phase names and framing are adaptable to the project type.
Provide at least two named variants: `migration` and `quality-audit`. Or make the phase
questions (not the names) the canonical part, since the questions hold up in both contexts:
"What exists vs. what's expected?" works for a migration and a quality audit equally.

### No trigger for advisor handoff

The assessor produces a prioritized backlog. Some P2/P3 items are architectural decisions
with multiple valid approaches. The assessor skill doesn't say "these items should trigger
the advisor." In sprint-2, the assessor correctly deferred them to P3 but framed them as
"future work" rather than "advisor inputs."

**Suggestion:** Add a step in Phase 4 or 5: "Flag any backlog item where there are multiple
viable implementation approaches or the decision is hard to reverse. These are advisor
inputs, not planner inputs."

---

## Advisor Skill (`02-advisor.md`)

### No reference to the assessor as a trigger

The "When to Use" list covers explicit "should we X or Y?" questions but doesn't mention
the assessor handoff. In practice, the advisor is often needed _after_ the assessor
surfaces a decision — not because someone asked "should we X or Y?" explicitly.

**Suggestion:** Add to "When to Use": "When an assessor's P2/P3 backlog contains an item
where two or more viable approaches exist and the choice is not obvious" — and reference
that these items should be escalated rather than deferred silently.

### Pipeline position not stated

The skill says the advisor is "the brainstormer" and that "the planner takes your
recommendation." It doesn't mention the designer sits between them for structural decisions.

**Suggestion:** Update the role definition to: "The advisor recommends. The designer shapes
the recommendation into structure. The planner sequences the structure into blocks."

---

## Designer Skill (`03-designer.md`)

### No "When NOT to Use" section

The designer requires four artifacts: module layout, interface definitions, data flow
diagram, and dependency map. Many assessment findings don't need any of these — a bug fix,
a doc update, a config change. Without a "when not to use" section, there's risk of
over-designing routine work.

**Suggestion:** Add a "When NOT to use" section covering: bug fixes with no boundary
changes, additive field additions that follow an established pattern, documentation-only
changes, and config/tooling changes. These go assessor → planner directly.

### Doesn't acknowledge "lightweight" design

Not every structural change needs all four outputs. Adding `parent: number` to `Category`
doesn't need a data flow diagram. Adding a new interface that follows an existing pattern
doesn't need a full dependency map.

**Suggestion:** Define two modes: **full design** (new subsystem, new boundary, new
dependency direction — all four outputs required) and **lightweight design** (interface
contract only — when the decision is clear and the only missing artifact is the type
signature the implementer needs).

### Assessor not listed as a valid input

The "Inputs" section lists: advisor recommendation, existing codebase, constraints. The
assessor is not listed. In practice, some design work flows directly from an obvious
assessor finding without needing a separate advisor document (the decision is clear, only
the structural shape is undefined).

**Suggestion:** Add assessor output as a valid input source, with a note: "If the decision
is already clear from the assessor's analysis and no trade-off analysis is needed, the
advisor step can be skipped. The designer still produces structural artifacts."

### No output location for the pipeline gap analysis case

The sprint-2 assessment has no `design/` directory. For blocks D, F, and H, the designer
should have produced interface contracts. The skill file correctly specifies
`.sprints/{sprint}/design/` but nothing in the assessor or advisor skill prompts the
creation of that directory.

**Suggestion:** In the pipeline README (see first item), explicitly note that if an
assessor's Phase 5 implementation plan contains blocks with undefined interface contracts,
a designer pass should be run before the planner sequences those blocks.

---

## Missing Skill: Planner (`04-planner.md`)

All three existing skills reference the planner as the downstream consumer. The planner
is responsible for turning design artifacts and backlog items into sequenced, sized work
blocks. There is no planner skill file.

This means the planner role is done ad-hoc, with no defined inputs, outputs, or
anti-patterns. The assessor's Phase 5 output partially fills this gap, but the assessor
skill is for discovery — it shouldn't be responsible for the final block sequencing when
design artifacts from the advisor and designer also need to be incorporated.

**Suggestion:** Write `04-planner.md`. Key things to define:

- Inputs: assessor Phase 4 backlog + any advisor decisions + any designer structural artifacts
- Output: ordered block list with prerequisites, effort, and the artifact each block depends on
- Anti-patterns: sequencing blocks before advisor decisions are resolved; sequencing
  structural blocks without designer interface contracts; creating blocks that span multiple
  independent concerns

---

## General

### Skill trigger conditions use loaded-skill framing

Each skill's `description` field (used by the LLM to decide when to load it) is written
from the skill's own perspective. This works when a human is choosing a skill. It's less
useful as machine-readable trigger logic because the conditions overlap.

For example, both the assessor and the advisor can be triggered by "starting a new project"
— but the assessor comes first and the advisor comes second. The ordering relationship isn't
in either file.

**Suggestion:** Either add explicit "comes after" / "comes before" references to each
skill's trigger conditions, or centralise the trigger logic in the pipeline README so the
ordering is unambiguous.
