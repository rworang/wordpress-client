# F-04 Result Summary: Reconcile Design Doc Naming

## Changes Made

### 1. `WordpressClientConfig` → `WordpressClientOptions` (2 replacements)

Replaced all 2 occurrences in `.sprints/sprint-1/design/01-wordpress-client.md`:

| Line | Context                                                                                      |
| ---- | -------------------------------------------------------------------------------------------- |
| 133  | `constructor(config: WordpressClientOptions) {` (Block 0 client dedup ownership code sample) |
| 396  | `export type { WordpressClientOptions } from './client'` (Section 6 public API surface)      |

Confirmed against `src/client.ts:44`: `export interface WordpressClientOptions`

### 2. `NavigationItem` → `MenuItem` (6 replacements)

Replaced all 6 occurrences in `.sprints/sprint-1/design/01-wordpress-client.md`:

| Line (approx.) | Context                                                                    |
| -------------- | -------------------------------------------------------------------------- |
| 79             | Module layout comment: `domain.ts # + Page, Tag, NavigationMenu, MenuItem` |
| 268            | Type definition: `interface MenuItem {`                                    |
| 275            | Self-reference in parent comment: `(ID of parent MenuItem)`                |
| 276            | Self-reference in children field: `children: MenuItem[]`                   |
| 283            | `NavigationMenu.items` field: `items: MenuItem[]`                          |
| 399            | Public API exports: `... NavigationMenu, MenuItem } from './types/domain'` |

Confirmed against `src/types/domain.ts:153`: `export interface MenuItem`

---

## Verification

```
$ grep "WordpressClientConfig" .sprints/sprint-1/design/01-wordpress-client.md
(no output — exit code 1)

$ grep "NavigationItem" .sprints/sprint-1/design/01-wordpress-client.md
(no output — exit code 1)

$ grep -c "WordpressClientOptions" .sprints/sprint-1/design/01-wordpress-client.md
2

$ grep -c "MenuItem" .sprints/sprint-1/design/01-wordpress-client.md
6
```

---

## Other Divergences Observed (Not Fixed — Schedule for Future Docs Pass)

The following divergences were found during inspection. They are **not fixed in this block** per scope constraints.

### 1. `NavigationMenu` structure diverged

Design doc (Section 4 — Block 4):

```typescript
interface NavigationMenu {
	id: number
	slug: string
	title: string // design uses `title`
	items: MenuItem[] // design has `items` array
}
```

Actual `src/types/domain.ts`:

```typescript
interface NavigationMenu {
	id: number
	name: string // implementation uses `name`, not `title`
	slug: string
	description: string // implementation has `description`, not `items`
	// no `items` field
}
```

### 2. `MenuItem` structure diverged

Design doc shows `MenuItem` with `target: '_blank' | ''`, `order: number`, and `children: MenuItem[]`.

Actual `src/types/domain.ts:153` has `menus`, `menuOrder`, `objectType`, `object`, `objectId`, `target: string` — and **no `children` field**.

### 3. Client navigation method names diverged

Design doc (Section 4 — Block 4) specifies:

```typescript
navigationMenus(): Promise<NavigationMenu[]>
navigationMenu(slug: string): Promise<NavigationMenu | null>
```

The actual implementation uses `menus()` and/or different method names (per block 5 commit messages). Needs verification against `src/client.ts`.

### 4. `WordpressNetworkError` in public API surface

Design doc Section 6 exports `WordpressNetworkError` from `./errors`. The actual `src/index.ts` does not export `WordpressNetworkError` (it exports `WordpressError`, `WordpressNotFoundError`, `WordpressAuthError`, `WordpressValidationError`, `WordpressSchemaError`).

### 5. Target module layout — `toNavigation()` adapter name

Design doc module layout comment shows:

```
└── navigation.ts     # toNavigation()   [NEW — Block 4]
```

Actual `dist/adapters/navigation.js` exports `toMenuItem` and `toNavigationMenu`, not `toNavigation()`.

### 6. Public API surface — `RequestOptions` not listed

Design doc Section 6 does not list `RequestOptions` as an exported type, but `src/index.ts` exports `type { WordpressClientOptions, RequestOptions } from './client'`.
