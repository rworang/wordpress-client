# .claude/ — LLM Skills Toolkit

## What This Directory Is

`.claude/` is a **portable LLM skills toolkit**. It defines the roles, references, and
conventions used when delegating development work to LLMs (Claude, Copilot, etc.).

Copy this directory to any new project to bring the full framework with you. The
project-specific sprint history lives in `.sprints/` — that stays behind. test

---

## How the Skill Pipeline Works

Skills are loaded by prepending a skill file to the LLM's prompt context. Each skill
defines a role the LLM assumes for that session. The pipeline flows:

```
assessor → advisor → planner → orchestrator → implementer
                                    ↕               ↕
                              auditor (cross-cutting health checks)
                              documenter (cross-cutting doc updates)
```

| Skill            | Role              | When to Load                                            |
| ---------------- | ----------------- | ------------------------------------------------------- |
| **Assessor**     | Discovery analyst | Starting a new project or major initiative              |
| **Advisor**      | Trade-off analyst | Decision points before planning or implementation       |
| **Planner**      | Block sequencer   | Decomposing work into ordered, dependency-mapped blocks |
| **Orchestrator** | Prompt author     | Writing block prompts for the implementer to execute    |
| **Implementer**  | Code producer     | Executing a scoped block prompt on a branch             |
| **Auditor**      | Health checker    | Mid-build checks; post-block integrity verification     |
| **Documenter**   | Technical writer  | Updating docs to reflect current codebase state         |

---

## How to Load a Skill

Prepend the skill file to your prompt context before giving the LLM its task:

1. Open `skills/<skill-name>.md`
2. Paste its contents at the top of your prompt (or attach as context)
3. Then give the task

Example:

```
[paste contents of .claude/skills/implementer.md]

---

Now execute this block prompt:
[paste block prompt]
```

---

## Directory Layout

```
.claude/
├── README.md                         ← You are here
├── skills/
│   ├── assessor.md
│   ├── advisor.md
│   ├── planner.md
│   ├── orchestrator.md
│   ├── implementer.md
│   ├── auditor.md
│   └── documenter.md
└── references/
    ├── git-workflow.md               ← Branch lifecycle, commit conventions, merge protocol
    ├── block-prompt-template.md      ← How to structure a block prompt
    ├── result-summary-template.md    ← Standardized output template for all skills
    ├── verification-checklist.md     ← Standard verification steps for every block
    └── coverage-tracker-template.md  ← How the coverage tracker works
```

---

## `.claude/` vs `.sprints/`

| Directory   | Purpose                                                         | Portable?                      |
| ----------- | --------------------------------------------------------------- | ------------------------------ |
| `.claude/`  | Skills, templates, conventions — the toolkit                    | ✅ Yes — copy to new projects  |
| `.sprints/` | Project-specific sprint history — assessments, prompts, results | ❌ No — stays with the project |

When bootstrapping a new project, copy `.claude/` and leave `.sprints/` behind.

---

## Where Skill Outputs Go

All skill outputs MUST be written to `.sprints/{sprint-name}/` in the project root.

| Skill        | Output path                                      |
| ------------ | ------------------------------------------------ |
| Assessor     | `.sprints/{sprint}/assessment/`                  |
| Advisor      | `.sprints/{sprint}/assessment/`                  |
| Planner      | `.sprints/{sprint}/planner-checkpoint-{name}.md` |
| Orchestrator | `.sprints/{sprint}/prompts/`                     |
| Implementer  | `.sprints/{sprint}/results/`                     |
| Auditor      | `.sprints/{sprint}/results/audit-{name}.md`      |
| Documenter   | `.sprints/{sprint}/results/docs-{name}.md`       |

See `references/result-summary-template.md` for the output format.
See `references/git-workflow.md` for commit and merge protocol.

---

## File Naming Conventions

| Output type        | Convention                                              |
| ------------------ | ------------------------------------------------------- |
| Assessment phases  | `NN-{name}.md` (e.g., `01-content-api-gap-analysis.md`) |
| Block prompts      | `block-NN-{name}.md` or `fix-{name}.md`                 |
| Result summaries   | `block-NN-{name}.md` or `fix-{name}.md`                 |
| Audit reports      | `audit-{name}.md`                                       |
| Documenter outputs | `docs-{name}.md`                                        |
| Coverage tracker   | `coverage-tracker.md` (one per sprint)                  |

---

## Quick Start

### New project

1. Copy `.claude/` to the new project root
2. Create `.sprints/{sprint-name}/` for the first sprint
3. Load `skills/assessor.md` and run the five assessment phases
4. Load `skills/planner.md` to sequence the work into blocks
5. Load `skills/orchestrator.md` to write the first block prompts

### Picking up an existing sprint

1. Read `CLAUDE.md` (project root) for project context
2. Read `.sprints/{sprint}/coverage-tracker.md` to see what's done and what's next
3. Load the appropriate skill for the next piece of work
