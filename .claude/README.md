# .claude/ — LLM Skills Toolkit

## What This Directory Is

`.claude/` is a **portable LLM skills toolkit**. It defines the roles, references, and
conventions used when delegating development work to LLMs (Claude, Copilot, etc.).

Install this directory in any new project to bring the full framework with you.
The project-specific sprint history lives in `.sprints/` — that stays behind.

Install via the toolkit server (preferred):

```bash
curl -s https://mcp.zerograde.nl/toolkit/skills.tar.gz | tar xz
```

Or copy `.claude/` manually from the llm-toolkit repo.

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
│   ├── meta/                         ← Meta-layer skills (above the pipeline)
│   │   ├── guardian.md                ← Standards enforcement middleware
│   │   ├── conductor.md              ← Multi-session coordination
│   │   └── retrospector.md           ← Process data extraction & analysis
│   ├── project/                      ← Software development pipeline
│   │   ├── 00-initiator.md
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
    ├── conversation-handoff.md       ← Template for switching conversations
    ├── conversation-checkpoint.md    ← Template for mid-conversation snapshots
    ├── git-workflow.md               ← Branch lifecycle, commit conventions, merge protocol
    ├── block-prompt-template.md      ← How to structure a block prompt
    ├── result-summary-template.md    ← Standardized output template for all skills
    ├── verification-checklist.md     ← Standard verification steps for every block
    └── coverage-tracker-template.md  ← How the coverage tracker works
```

---

## `.claude/` vs `.sprints/` vs `CLAUDE.md`

| Item        | Purpose                                                          | Portable?                      |
| ----------- | ---------------------------------------------------------------- | ------------------------------ |
| `.claude/`  | Skills, templates, conventions — the toolkit                     | ✅ Yes — copy to new projects  |
| `.sprints/` | Project-specific sprint history — assessments, sessions, process | ❌ No — stays with the project |
| `CLAUDE.md` | Persistent project memory — architecture, decisions, state       | ❌ No — project-specific       |

When bootstrapping a new project, install `.claude/` (via curl or copy) and leave `.sprints/` behind.

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
| Orchestrator  | `.sprints/{sprint}/sessions/{NN}-prompt-{name}.md`     |
| Implementer   | `.sprints/{sprint}/sessions/{NN}-result-{name}.md`     |
| Auditor       | `.sprints/{sprint}/sessions/audit-result-{name}.md`    |
| Documenter    | `.sprints/{sprint}/sessions/docs-result-{name}.md`     |

See `references/result-summary-template.md` for the output format.
See `references/git-workflow.md` for commit and merge protocol.

---

## File Naming Conventions

| Output type        | Convention                                              |
| ------------------ | ------------------------------------------------------- |
| Assessment phases  | `NN-{name}.md` (e.g., `01-content-api-gap-analysis.md`) |
| Block prompts      | `{NN}-prompt-{name}.md` or `fix-prompt-{name}.md`       |
| Result summaries   | `{NN}-result-{name}.md` or `fix-result-{name}.md`       |
| Audit reports      | `audit-result-{name}.md`                                |
| Documenter outputs | `docs-result-{name}.md`                                 |
| Coverage tracker   | `coverage-tracker.md` (one per sprint)                  |

---

## Quick Start

### New project

1. Install `.claude/` in the project root:
   ```bash
   cd <project-root>
   curl -s https://mcp.zerograde.nl/toolkit/skills.tar.gz | tar xz
   ```
2. Create `.sprints/{sprint-name}/` for the first sprint
3. Load `skills/assessor.md` and run the five assessment phases
4. Load `skills/planner.md` to sequence the work into blocks
5. Load `skills/orchestrator.md` to write the first block prompts

### Picking up an existing sprint

1. Read `CLAUDE.md` (project root) for project context
2. Read `.sprints/{sprint}/coverage-tracker.md` to see what's done and what's next
3. Load the appropriate skill for the next piece of work
