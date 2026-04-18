# GitHub Copilot — Project Operating Instructions

## 1. Project at a glance

**worang.nl** is a personal portfolio single-page application. It is a Vue 3 +
Vite SPA that consumes a WordPress REST API as a **read-only headless CMS** via
the `@worang/wordpress-client` package. There is no SSR, no pre-rendering, no
authentication — the WordPress endpoint is public and read-only.

- **Framework:** Vue 3.5 (Composition API, `<script setup>`, strict TS)
- **Build:** Vite 7 (`@` alias → `src/`, vendor chunk splits `vue`, `vue-router`, `pinia`, `axios`)
- **Routing:** `vue-router` 4 in history mode
- **State:** Pinia 3 with `pinia-plugin-persistedstate` (localStorage)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite`; design tokens live in `src/styles/tokens/`
- **Head:** `@unhead/vue`
- **Telemetry:** optional `@logscan/telemetry-client` plugin, vendored under `vendor/telemetry-client`, wired only when `VITE_TELEMETRY_ENDPOINT` is set
- **Package manager:** pnpm 10.28.1 (pinned in `packageManager`)

Authoritative reference: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md). Read it
before making non-trivial changes — it documents intentional trade-offs (for
example, the store-owned lazy singleton `WordpressClient` vs. the unused DI
plugin in `src/app/plugins/wordpress.ts`).

## 2. Repository layout

```
src/
  app/          App.vue, router.ts, plugins/     ← bootstrapping
  features/     blog/  docs/  photos/  portfolio/ ← vertical slices
  shared/       components/ composables/ stores/ utils/
  styles/       tokens + Tailwind layer
  views/        top-level routes (Main, Contact, Styleguide, NotFound)
  main.ts
docs/           ARCHITECTURE.md, REFERENCE.md, RESPONSIVE_GUIDE.md, planning.md
infra/          deploy.sh, vps-setup.sh, vps-audit.sh
bin/            generate-symbol-index.ts
vendor/         vendored packages (telemetry-client)
.claude/        toolkit assets (skills, agents, references)
```

Each feature under `src/features/*` owns its full slice — routes, views,
components, store, widgets, types. **Features may import from `shared/` but
never from each other.** Shared code must stay feature-agnostic.

## 3. Architectural guardrails

These are non-negotiable unless explicitly revisited with the user:

1. **SPA-only.** No SSR / SSG / prerender. SEO is not a goal.
2. **WordPress is a content backend, nothing else.** No auth, no writes, no server logic in the app.
3. **Store-driven data flow.** Components never call the API directly. Views
   call Pinia store methods; presentational components receive props.
4. **Feature isolation.** A change in one feature must not require edits in
   another. Promote reusable pieces into `shared/` instead of cross-importing.
5. **Token-driven styling.** Reference CSS custom properties from
   `src/styles/tokens/` (or the Tailwind utilities that bridge to them). Do not
   hardcode colors, spacing, typography, shadows, or motion values.
6. **Lazy singleton client.** The blog store owns `WordpressClient` lifecycle
   via a module-level `getClient()`. The `wordpressPlugin` exists but is
   deliberately unused; switch only if a second feature needs its own client
   or tests demand DI.

## 4. Commands

```sh
pnpm install
pnpm dev           # Vite dev server (includes vue-devtools in dev)
pnpm build         # vue-tsc -b && vite build
pnpm preview       # preview the production build
pnpm type-check    # vue-tsc --noEmit
pnpm lint          # eslint . --fix
pnpm format        # prettier --write src/
```

Prefer `pnpm` over `npm`/`yarn` — the lockfile and `packageManager` field assume it.

## 5. Verification before claiming done

- Run `pnpm type-check` for any TS/Vue change.
- Run `pnpm lint` before finishing.
- For UI work, start `pnpm dev` and exercise the feature in a browser — type
  checks and lint do not verify behavior. If you cannot run the browser, say so
  explicitly instead of claiming success.
- Do not report completion without fresh evidence.

## 6. Toolkit workflow (`.claude/`)

This repo carries the raven-toolkit under `.claude/` (skills, agents,
references). For substantial work:

1. Skim `.claude/README.md` for the pipeline and output rules.
2. Use the pipeline in order when it applies: `scout → assessor → advisor →
   designer → planner → orchestrator → implementer`, with `auditor` /
   `documenter` as cross-cutting checks. Do not skip to implementation if the
   task is really an assessment or planning problem.
3. Keep sprint artifacts under `.sprints/{NN}-{name}/`, curated docs under
   `docs/`, and portable toolkit assets under `.claude/`. Do not mix them.

Note: there is currently no `CLAUDE.md` and no `.sprints/` directory — create
them only if the work warrants durable project memory or a tracked sprint.

## 7. Infra, SSH, deploy

Before VPS / SSH / deploy operations:

- Read `.claude/references/ssh-access.md` and check `.claude/env.yaml`.
- Use `infra/deploy.sh`, `infra/vps-setup.sh`, and `infra/vps-audit.sh` as the
  canonical flows — do not rediscover credentials or steps.
- Anything visible to others (push, PR, deploy, message) needs explicit user
  confirmation.

## 8. Editing conventions

- TypeScript is strict; do not loosen it locally to silence errors.
- Prefer editing existing files over creating new ones; do not add README or
  docs files unless requested.
- No emojis in source or commits unless the user asks.
- Default to no comments; add one only when the *why* is non-obvious.
- Don't introduce abstractions, feature flags, or backwards-compat shims beyond
  what the task requires.

## 9. When in doubt

1. Load context from `docs/ARCHITECTURE.md` and the relevant feature folder.
2. Pick the correct toolkit phase instead of jumping to code.
3. Verify with `pnpm type-check`, `pnpm lint`, and a browser check before
   closing the task.
