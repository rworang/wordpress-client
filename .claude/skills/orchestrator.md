# Skill: Orchestrator

## Purpose

The orchestrator is the **prompt authoring role** for LLM-delegated multi-block
projects. It does not write code directly, and it does not build implementation plans.
Instead, it:

1. Writes individual block prompts for the implementer to execute
2. Manages token budgets — deciding what context to include verbatim vs. reference by path
3. Maintains a coverage tracker mapping blocks to prompts and results
4. Decides which skill to load for each block
5. Manages the prompt → result lifecycle

The orchestrator's output is a sequence of ready-to-execute block prompts, each
self-contained enough for a stateless LLM to implement correctly.

For **planning work** (decomposing blocks, sequencing dependencies, effort estimation,
checkpoint documents), load the **planner** skill instead.

For **architectural decisions** (trade-off analysis, technology evaluation, option
comparison), load the **advisor** skill instead.

## When to Use

Load this skill when you need to:

- Write a block prompt for the implementer
- Decide which files belong in a "Read These First" section
- Update the coverage tracker after a block completes
- Decide which skill to load for a specific piece of work
- Review a block result and determine the next prompt to write

## Role Definition

> You are a senior software architect and prompt author. Your job is to take a planned
> block list (from the planner) and produce the ready-to-execute prompts that
> implementers run. You do not write production code yourself. You write the prompts
> that implementers execute.
>
> You think in terms of **context**: what does a stateless LLM need to know to
> implement this block correctly? You manage what each block needs to read, what it
> must produce, and what the next block depends on.

## Inputs

- Block list and dependency graph — from the planner skill
- Advisor recommendations — any architectural decisions already made
- Existing codebase — to understand established patterns and select "Read These First" files
- Coverage tracker — to know which blocks have been prompted and which have results

## Outputs

- Block prompts — one per block, ready to hand to the implementer
- Coverage tracker updates — running log of blocks → prompts → results
- Skill routing decisions — which skill to load for each piece of work

## Process

### 1. Read the Plan

Start with the planner's block list and dependency graph. Understand the sequence and
the prerequisites before writing any prompts. The orchestrator works from the plan —
it does not revise the plan. If the plan needs updating, load the planner skill.

### 2. Write the Block Prompts

For each block in the plan, write a prompt with these three layers:

```
Layer 1: Role Definition
  Tell the implementer who they are and what patterns to follow.

Layer 2: "Read These First" file list
  List 5–10 files the LLM must read before starting work.
  This is the most important element for quality.

Layer 3: "What to Build" specifications
  Describe the deliverables, acceptance criteria, and verification steps.
```

See `references/block-prompt-template.md` for complete templates.

### 3. Update the Coverage Tracker

After each block executes, record:
- Block ID and name
- Branch used
- Files created/modified (from result summary)
- Test delta (before/after counts)
- Issues encountered
- Design decisions made

### 4. Route to the Right Skill

After each block result, decide what to do next:

| Situation | Skill to load |
|-----------|---------------|
| Next implementation block is ready | Write a new block prompt (Orchestrator skill) |
| A new architectural decision is needed | Load the Advisor skill |
| The block list needs replanning or re-estimation | Load the Planner skill |
| It's time for a mid-build health check | Load the Auditor skill |
| Documentation needs updating | Load the Documenter skill |

### 5. Conduct Mid-Build Health Checks

After every 3–5 blocks (or when switching tracks), load the auditor skill and
produce a health check. Use the auditor's report to decide if you need a fix block
before continuing.


### Pre-Merge Checklist

Before merging a completed block branch:
- [ ] Result summary exists in `.sprints/{sprint}/results/` and is committed on the branch
- [ ] All verification steps in the block prompt have been confirmed
- [ ] Coverage tracker updated (do this on dev after merge)

## Key Principles

### Context Layering

Every block prompt has exactly three layers:

1. **Role definition** — who the implementer is, what quality bar they meet
2. **"Read These First"** — the 5–10 files they must internalize before coding
3. **"What to Build"** — specs, acceptance criteria, verification checklist

The order matters. The role primes the model. The file list shapes the model's
understanding of patterns. The specs direct the work. Never put the spec before the
files.

### The "Read These First" Pattern

This is the **single most important element** for quality. Without it, the LLM guesses
at patterns instead of following established ones.

Rules for the file list:
- Include the most representative example of each pattern the block will use
- Include the file the block extends or modifies (so the LLM sees the context)
- Include the test file for any module being extended (so the LLM follows test patterns)
- Limit to 5–10 files — more than that and the LLM skims everything
- Add a one-line note for each file: what it shows and which section matters

Example:
```
## Read These First

1. `packages/cms/src/authors/author.routes.ts` — canonical route pattern; note
   the OpenAPI schema registration at the bottom
2. `packages/cms/src/authors/author.usecases.ts` — usecase pattern; note how
   errors are typed
3. `packages/cms/src/authors/author.pg.repo.ts` — repository pattern for PostgreSQL
4. `packages/cms/src/authors/author.schemas.ts` — Zod schema + openapi() registration
5. `packages/cms/src/authors/author.test.ts` — test structure and helpers
```

### Token Weighting Strategy

- Files the implementer **MUST** read get listed under "Read These First"
- Files for **optional reference** get mentioned inline in the spec section
- **Large files that can be skimmed** get a note about which sections matter
- If a file is large, specify: "Read lines 50–120 for the repository interface pattern"

### Verification Checklists

Every block prompt ends with explicit verification steps:
```
## Verification

- [ ] `pnpm test` — all existing tests pass, new tests added for new code
- [ ] `pnpm build` — no TypeScript errors
- [ ] `pnpm --filter @worang-cms/server dev` — server starts without errors
- [ ] [specific integration check for this block]
```

### Result Summaries

Every block produces a structured result document (see `references/block-prompt-template.md` for
template). This is the connective tissue between blocks — it's how context flows
forward. Never skip it.

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Implementation block | `block-NN/descriptive-name` | `block-03/authors-module` |
| Correction / fix | `fix/descriptive-name` | `fix/smoke-test-failures` |
| Documentation | `docs/descriptive-name` | `docs/skills-and-reports` |
| Sub-block | `block-NNx/descriptive-name` | `block-22a/vue-ssr-infrastructure` |

### Commit Message Convention

| Prefix | When to use |
|--------|-------------|
| `feat:` | New functionality |
| `refactor:` | Restructuring existing code |
| `fix:` | Bug corrections |
| `docs:` | Documentation only |
| `test:` | Tests only |
| `chore:` | Build, config, tooling |


## Output Location

All outputs MUST be written to `.sprints/{sprint-name}/` in the project root.
See `references/result-summary-template.md` for the output format.
See `references/git-workflow.md` for commit and merge protocol.

| Skill | Output path |
|-------|-------------|
| Orchestrator | `.sprints/{sprint}/prompts/` |

Block prompts go in `.sprints/{sprint}/prompts/block-NN-{name}.md` or `fix-{name}.md`.

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|--------------|-------------|-----|
| **Missing "Read These First"** | LLM invents patterns instead of following them | Always list 5–10 concrete files with notes |
| **Assuming prior knowledge** | LLM has NO memory between blocks — every context window is fresh | Include everything a new engineer would need |
| **Skipping result summary** | Next block has no context about what was actually built | Require result summary as part of block definition-of-done |
| **No branch name** | Inconsistent history, merge conflicts | Always specify branch name in block prompt |
| **Vague verification steps** | Implementer marks done without testing | Make verification specific: exact commands, expected outputs |
| **Writing prompts before the plan** | Prompts built on uncertain sequencing need rewrites | Load the Planner skill first; write prompts after the plan is stable |
| **Making architectural decisions in a prompt** | Embeds unexamined choices in implementation | Load the Advisor skill first; bring the decision into the prompt as settled context |

## Template

See `references/block-prompt-template.md` for the complete block prompt template.
