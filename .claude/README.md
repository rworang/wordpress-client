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
assessor → advisor → designer → planner → orchestrator → implementer
                                               ↕               ↕
                                         auditor (cross-cutting health checks)
                                         documenter (cross-cutting doc updates)
```

| #   | Skill            | Role              | When to Load                                             |
| --- | ---------------- | ----------------- | -------------------------------------------------------- |
| 1   | **Assessor**     | Discovery analyst | Starting a new project or major initiative               |
| 2   | **Advisor**      | Trade-off analyst | Decision points before planning or implementation        |
| 3   | **Designer**     | Structure author  | Translating decisions into module layouts and interfaces |
| 4   | **Planner**      | Block sequencer   | Decomposing work into ordered, dependency-mapped blocks  |
| 5   | **Orchestrator** | Prompt author     | Writing block prompts for the implementer to execute     |
| 6   | **Implementer**  | Code producer     | Executing a scoped block prompt on a branch              |
| 7   | **Auditor**      | Health checker    | Mid-build checks; post-block integrity verification      |
| 8   | **Documenter**   | Technical writer  | Updating docs to reflect current codebase state          |

---

## How to Load a Skill

Prepend the skill file to your prompt context before giving the LLM its task:

1. Open `skills/project/<skill-name>.md` or `skills/ops/<skill-name>.md`
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
├── .mcp.json.example                 ← MCP server connection template (copy + fill in)
├── skills/
│   ├── project/                      ← Software development pipeline
│   │   ├── 01-assessor.md
│   │   ├── 02-advisor.md
│   │   ├── 03-designer.md
│   │   ├── 04-planner.md
│   │   ├── 05-orchestrator.md
│   │   ├── 06-implementer.md
│   │   ├── 07-auditor.md
│   │   └── 08-documenter.md
│   └── ops/                          ← VPS and infrastructure management
│       ├── 01-vps-auditor.md
│       ├── 02-vps-hardening.md
│       └── 03-vps-deploy.md
└── references/
    ├── claude-directory-standard.md  ← Canonical .claude/ structure specification
    ├── context-protocol.md           ← Session start/end context management contract
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

| Skill         | Output path                                            |
| ------------- | ------------------------------------------------------ |
| Assessor      | `.sprints/{sprint}/assessment/`                        |
| Advisor       | `.sprints/{sprint}/assessment/`                        |
| Designer      | `.sprints/{sprint}/design/`                            |
| Planner       | `.sprints/{sprint}/planner-checkpoint-{name}.md`       |
| VPS Auditor   | `.sprints/{sprint}/ops/vps-audit-{host}-{date}.md`     |
| VPS Hardening | `.sprints/{sprint}/ops/vps-hardening-{host}-{date}.md` |
| VPS Deploy    | `.sprints/{sprint}/ops/vps-deploy-{service}-{date}.md` |
| Orchestrator  | `.sprints/{sprint}/prompts/`                           |
| Implementer   | `.sprints/{sprint}/results/`                           |
| Auditor       | `.sprints/{sprint}/results/audit-{name}.md`            |
| Documenter    | `.sprints/{sprint}/results/docs-{name}.md`             |

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
