# Merchant web — UI bug sweep (2026-11-28)

**Last Updated:** 2026-11-28
**Repo:** `MerchantModule` · **Branch:** `main`
**Why this file exists:** the work below was started with a limited AI-usage budget. Every task has a
status and notes so **any other agent or developer can pick it up from the first unchecked box** without
re-reading the conversation. Update the status and the *Log* section **in the same commit as the fix.**

> **Scope decision (2026-11-28):** the other developer has set up PWA for the merchant app, so effort goes
> **only into this web app**. `MerchantApp` (Expo) is not touched by this sweep.

---

## For the next agent: read this first

**Rules** (full versions in [../AGENTS.md](../AGENTS.md) and
[../../FF_api_web/docs/ecosystem/PRINCIPLES.md](../../FF_api_web/docs/ecosystem/PRINCIPLES.md)):

- Commit **explicit paths**, never `git add -A`. Commit message `type(scope): description`
  (`fix`, `refactor`, `docs`…), ≥ 3 characters after the colon.
- **One commit per task**, message names the task id (e.g. `fix(ui): UI-3 …`).
- Verify in a **real browser at a phone width (390×844) and at desktop**, in **both light and dark theme**.
  A green `tsc` does not prove a CSS fix.
- Do **not** push. The owner pushes.
- Fix the **shared** cause, not one page. Several of these bugs repeat across pages (UI-2, UI-3, UI-4);
  fixing one page and leaving its twin is how they came back.

**Stack facts that matter here**

- Charts are **Recharts 3** (`recharts`), not ECharts. Used in `src/pages/Dashboard.tsx`, `src/pages/Revenue.tsx`.
- Four styling systems coexist (Tailwind 4, MUI 7, hand-written CSS, inline styles — see
  [../DESIGN.md](../DESIGN.md) §6). Prefer the CSS variables (`var(--color-text)`, `var(--color-surface)`…)
  in `src/index.css`; hardcoded colours are what break dark theme.
- The page called **"Inventory"** in the web sidebar is called **"Products"** in the mobile app. It is one
  page: `src/pages/products/InventoryPage.tsx`. The reports below say "products page" and "inventory page"
  interchangeably.

**Running it locally with real data** (never point at the production Atlas URI in `Backend/.env`)

```bash
# 1. throwaway mongo
mongod --dbpath /tmp/mongo-ui --port 27018 --bind_ip 127.0.0.1 &
# 2. backend, overriding the DB — from FF_api_web/Backend
MONGODB_URI='mongodb://127.0.0.1:27018/ff_ui' PORT=5055 NODE_ENV=development \
  ENABLE_WHATSAPP_ALERTS=false node index.js
# 3. frontend — from MerchantModule
VITE_BACKEND_URL=http://localhost:5055 npm run dev
```

You need a seeded merchant with `status: 'active'`, `isActive: true`, a bcrypt `password`, and a category
with a `slug`. Product rows need an `images[0].url` or the Add Product form refuses to submit.
The previous session's seed script is described in
[../../FF_api_web/docs/reports/numeric-size-variants-bug.md](../../FF_api_web/docs/reports/numeric-size-variants-bug.md) §8.3.

---

## Task list

Status: `[ ]` not started · `[~]` in progress · `[x]` done and verified · `[!]` blocked / needs a decision.
**Order is deliberate:** shared root causes first, then single-page fixes, then the two that need a decision.

| ID | Status | Area | Bug |
|---|---|---|---|
| UI-1 | `[x]` | Sidebar | Clicking **Courier** also highlights **Orders** |
| UI-2 | `[ ]` | Dashboard, Revenue | Charts show a focus outline on click |
| UI-3 | `[ ]` | Revenue, Inventory | Selected text in dropdowns is cut off at the bottom |
| UI-4 | `[ ]` | Inventory | Product name unreadable in the dark-theme bottom sheet; **New** button likewise |
| UI-5 | `[ ]` | Add Product, Inventory | Back button and per-page selector text wraps |
| UI-6 | `[ ]` | Edit Product | Header buttons too large on phones; left text misaligned |
| UI-7 | `[ ]` | Profile | Nothing in **Categories & Reach** works |
| UI-8 | `[ ]` | Profile | Phone icon shown with no phone number and no way to add one |
| UI-9 | `[x]` | Sidebar | Re-ordered to follow the mobile app's tab order |

### UI-1 — Sidebar: Courier also highlights Orders *(done 2026-11-28)*
- **Symptom:** clicking *Courier* (`/merchant/courier-orders`) shows both *Courier* and *Orders* selected.
- **Root cause (confirmed by reading):** `src/components/layout/Sidebar.tsx` computes
  `location.pathname.includes(item.path)`. `"/merchant/courier-orders"` **contains** `"orders"`, so both match.
  The "keys might be the same" guess was close — it is the substring match, not duplicate keys.
- **Same flaw also affects:** `warehouse-orders`, and any future path containing another item's path.
  Also, `edit/:id` and `add-product` highlight **nothing**, though they belong under Inventory.
- **Fix:** match on path *segments* — exact, or the item's path followed by `/` — and map the child routes
  (`edit/*`, `add-product`, `bulk-upload`) to Inventory. Applies to both the desktop and the mobile bar
  in the same file.
- **Fixed:** `isNavActive()` in `src/utils/nav.ts` (5 tests), used at all 4 sites in `Sidebar.tsx`.
- **Verified in browser:** Courier → only Courier; Orders → only Orders; `edit/*` and `add-product` → Inventory.

### UI-2 — Charts show a focus outline when clicked
- **Symptom:** clicking a chart or its container draws an outline around the outer box and around the donut.
  Seen on Dashboard → *Status Distribution*; Revenue → *Daily Earnings Breakdown*, *Revenue Trend*,
  *Status Distribution*.
- **Likely cause:** Recharts 3 turns on `accessibilityLayer` by default, which makes the chart wrapper and
  its `<svg>` keyboard-focusable (`tabindex=0`), so the browser draws its focus ring on click.
- **Fix:** shared, not per chart — set `accessibilityLayer={false}` on each chart **and/or** add one rule in
  `src/index.css` for `.recharts-wrapper`, `.recharts-surface` and `.recharts-sector`. Do **not** remove
  focus outlines globally; only on chart surfaces.
- **Verify:** click inside every chart on both pages; no ring. Tab through the page — buttons and inputs still show theirs.

### UI-3 — Dropdown selected text clipped at the bottom
- **Symptom:** the selected value (e.g. *This week* on Revenue, the status filter on Inventory) has its
  lower edge cut off.
- **Likely cause:** a fixed `height` with a `line-height`/padding that does not fit, or `overflow:hidden`
  on `.select-wrapper select`. It appears on two pages, so it is the shared select styling.
- **Fix:** find the shared select rule (`src/index.css` / `src/components/Products/AddNewProduct.css`,
  class `select-wrapper`), give it `line-height` ≥ font-size × 1.4 and padding instead of a tight fixed height.
- **Verify:** at 390px and at desktop, in both themes, with descenders in the text ("g", "y", "p").

### UI-4 — Dark theme: text invisible
- **Symptom:** (a) the product name in the Inventory item bottom sheet is black on a dark sheet;
  (b) the **New** button in the Inventory page has the same problem.
- **Likely cause:** hardcoded dark text colour instead of `var(--color-text)` / the button's themed token.
- **Fix:** use theme variables. **Then grep for the same pattern** across `src/components/Products/` and
  `src/pages/products/` — if two places have it, more do.
- **Verify:** toggle theme with the sheet open; both themes readable.

### UI-5 — Text wraps where it should not
- **Symptom:** (a) Add Product → the **Back** button's text and icon wrap onto two lines;
  (b) Inventory → the **per page** selector at the bottom wraps its text.
- **Fix:** `white-space: nowrap` and `flex-shrink: 0` on the button and the select; make sure the container
  lets it keep its natural width.
- **Verify:** at 360px and 390px.

### UI-6 — Edit Product header on phones
- **Symptom:** *Delete Product*, *Back*, *Save SKU* are oversized for a phone, their fonts are large, and
  the title/description block on the left is not aligned.
- **Fix:** responsive header — compact buttons (smaller padding and font, icon-only or shorter labels at
  ≤ 480px), a single column title block with consistent left alignment, and the actions in one tidy row.
  File: `src/pages/products/EditProductPage.tsx`.
- **Note:** this page was edited upstream on 2026-11-26/28 — re-read it after the pull, do not work from memory.
- **Verify:** 360px, 390px, 768px, desktop.

### UI-7 — Profile: Categories & Reach does nothing
- **Symptom:** no button or selection in the *Categories & Reach* section responds.
- **Status:** not yet investigated. Start in `src/pages/ProfilePage.tsx`; check for missing `onClick`/state
  handlers, a disabled/read-only wrapper, and whether a save endpoint exists in `src/api/`.
  Decide with the owner whether this section is *meant* to be editable by the merchant — if the backend has
  no endpoint, the honest fix may be to make it read-only and say so, not to invent an API.

### UI-8 — Profile: phone icon with no phone
- **Symptom:** the Contact info section shows a phone icon even when there is no phone number, and offers
  no way to add one.
- **Recommendation:** show the row only when a number exists; otherwise show a muted
  "Add phone number" action **if** an update endpoint exists, otherwise hide the row. Same decision as UI-7.

### UI-9 — Sidebar order *(done 2026-11-28)*
- The mobile app's tab order is **Dashboard · Orders · Products · Revenue · Settings**. The web sidebar is
  Dashboard · Inventory · Warehouse Stock · Orders · Courier · Revenue · Offers · Zip Covers · Policies.
- **Recommended web order:** Dashboard · **Orders** · **Inventory** · **Revenue** (the app's four, same order),
  then Courier · Warehouse Stock · Offers · Zip Covers · Policies & Terms. *Profile/Settings* is already in
  the top bar. Rationale: a merchant who uses the app and the web sees one muscle-memory order; the
  daily-use screen (Orders) moves up; Courier sits beside the thing it belongs to.
- **Applied** to both the full and the warehouse lists. The mobile bottom bar already used this order, so
  all three surfaces now agree.
- **Open label question:** the app calls it *Products*, the web calls it *Inventory*. **Not changed** — see UI-D2.

---

## Decisions needed from the owner

| # | Question | Recommendation |
|---|---|---|
| UI-D1 | Apply the UI-9 order? | **Done** — you delegated the call |
| UI-D2 | Rename web **Inventory → Products** to match the app? | Yes — it is the reason the two names are being mixed up in bug reports. One line in `Sidebar.tsx` |
| UI-D3 | Is *Categories & Reach* meant to be merchant-editable? | Depends on whether the backend has the endpoint — see UI-7 |

---

## Found while pulling (not part of the 11 reports)

| | |
|---|---|
| ⚠️ **Test coverage regressed** | The upstream commit `5915cc3 updated the size ui` **deleted `src/utils/size.test.ts`** (14 tests) and rewrote `SizeField.tsx` as a segmented control with a 26–36 range (was 28–36). The one remaining suite is `src/pwa/registerPwa.test.ts`. The behaviour the deleted tests pinned — an explicit mode change clears sizes the new list cannot show; values from the server never get hidden — should be re-checked against the new `SizeField`, and the tests restored or rewritten. Tracked as **UI-X1**, not started. |
| `package-lock.json` | ~9,400 changed lines upstream. Run `npm install` after pulling. |
| `FF_api_web` | Local `dev2` is **4 commits ahead** (the offers documents) and **2 behind**. Not pulled — it would need a merge or rebase. Docs only. |

---

## Log

Newest first. One line per finished task or major point: date · task · what changed · commit.

- 2026-11-28 · UI-9 · desktop nav now Dashboard, Orders, Inventory, Revenue, Courier, Warehouse Stock, Offers, Zip Covers, Policies; warehouse list and its mobile bar aligned · see commit
- 2026-11-28 · UI-1 · segment match replaces substring match · `190133c`
- 2026-11-28 · setup · pulled `MerchantModule` (fast-forward to `cef17a6`); wrote this tracker; root cause of UI-1 identified.
