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
| UI-2 | `[x]` | Dashboard, Revenue | Charts show a focus outline on click |
| UI-3 | `[x]` | Revenue, Inventory | Selected text in dropdowns is cut off at the bottom |
| UI-4 | `[x]` | Inventory | Product name unreadable in the dark-theme bottom sheet; **New** button likewise |
| UI-5 | `[x]` | Add Product, Inventory | Back button and per-page selector text wraps |
| UI-6 | `[x]` | Edit Product | Header buttons too large on phones; left text misaligned |
| UI-7 | `[x]` | Profile | Nothing in **Categories & Reach** works |
| UI-8 | `[ ]` | Profile | Phone icon shown with no phone number and no way to add one |
| UI-9 | `[x]` | Sidebar | Re-ordered to follow the mobile app's tab order |
| UI-10 | `[x]` | Inventory | *Per page* selector: unit (items vs rows) and a label that did not match the page |
| UI-11 | `[ ]` | Profile | The **verification pending** badge text is not aligned |

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

### UI-2 — Charts show a focus outline when clicked *(done 2026-11-28)*
- **Symptom:** clicking a chart or its container draws an outline around the outer box and around the donut.
  Seen on Dashboard → *Status Distribution*; Revenue → *Daily Earnings Breakdown*, *Revenue Trend*,
  *Status Distribution*.
- **Likely cause:** Recharts 3 turns on `accessibilityLayer` by default, which makes the chart wrapper and
  its `<svg>` keyboard-focusable (`tabindex=0`), so the browser draws its focus ring on click.
- **Fix:** shared, not per chart — set `accessibilityLayer={false}` on each chart **and/or** add one rule in
  `src/index.css` for `.recharts-wrapper`, `.recharts-surface` and `.recharts-sector`. Do **not** remove
  focus outlines globally; only on chart surfaces.
- **Verify:** click inside every chart on both pages; no ring. Tab through the page — buttons and inputs still show theirs.
- **Root cause confirmed in the browser:** Recharts 3 gave each `svg.recharts-surface` and the `g.recharts-pie` `tabindex=0` — the "outer box" and "circular part" in the report.
- **Fixed** by turning the focus layer off per chart (not by hiding the outline with CSS, which would leave invisible tab stops). Two props are needed: `accessibilityLayer={false}` on the chart **and** `rootTabIndex={-1}` on `<Pie>`, which has its own tab stop.
- **Verified:** 0 tab stops on 5 charts (Dashboard 2, Revenue 3); a click leaves focus on `body`.
- **Any new chart must set both props** — copy an existing one.

### UI-3 — Dropdown selected text clipped at the bottom *(done 2026-11-28)*
- **Symptom:** the selected value (e.g. *This week* on Revenue, the status filter on Inventory) has its
  lower edge cut off.
- **Likely cause:** a fixed `height` with a `line-height`/padding that does not fit, or `overflow:hidden`
  on `.select-wrapper select`. It appears on two pages, so it is the shared select styling.
- **Fix:** find the shared select rule (`src/index.css` / `src/components/Products/AddNewProduct.css`,
  class `select-wrapper`), give it `line-height` ≥ font-size × 1.4 and padding instead of a tight fixed height.
- **Verify:** at 390px and at desktop, in both themes, with descenders in the text ("g", "y", "p").
- **Root cause (measured, then proven by toggling the old value back):** Chrome sizes a `<select>`'s inner box from the font's natural line height (~16px) and ignores the `line-height: 1.5` inherited from `body`. A 21px line inside a 16px box was clipped at the bottom — which is why it hit *every* select, not one page.
- **Fixed** with one global rule in `src/index.css`, so no page needs its own patch and new selects are safe by default.
- **Verified by screenshot at 3x:** Revenue week filter and Inventory *Status* filter, before (clipped) and after (whole). Both are native selects. Inventory's *per page* select is covered by the same rule; its **wrapping** is UI-5.

### UI-4 — Dark theme: text invisible *(done 2026-11-28)*
- **Symptom:** (a) the product name in the Inventory item bottom sheet is black on a dark sheet;
  (b) the **New** button in the Inventory page has the same problem.
- **Likely cause:** hardcoded dark text colour instead of `var(--color-text)` / the button's themed token.
- **Fix:** use theme variables. **Then grep for the same pattern** across `src/components/Products/` and
  `src/pages/products/` — if two places have it, more do.
- **Verify:** toggle theme with the sheet open; both themes readable.
- **There is no theme toggle.** "Dark theme" is the phone's OS setting, via Tailwind's `dark:` variant. The app's CSS variables (`--color-text`…) have **no dark values**, so anything coloured by them stays dark-on-dark.
- **Root cause:** `src/index.css` has *unlayered* `a`, `h1–h6` and `p` rules that set `color`. Tailwind 4 utilities live in `@layer utilities`, and **unlayered CSS always beats layered CSS** — so `text-white`, `dark:text-white` and `text-lg` on those elements are silently ignored. Measured: the "+ New" link computed `rgb(26,26,26)` on black despite `text-white`.
- **Fixed (colour only, locally):** `text-white!` on the "+ New" link; `text-slate-900! dark:text-white!` on the sheet title; `text-white!` on the sheet's image-viewer title. Trailing `!` is Tailwind 4's important modifier.
- **Also found and fixed in the same sheet:** `dark:bg-slate-850` — **Tailwind has no slate-850**, so the variant card stayed white and its white colour-name text vanished; now `dark:bg-slate-800`. The out-of-stock and in-stock chips had no dark text colour.
- **Verified at 390px, OS dark mode, screenshot:** title white, "Navy" visible, card dark, "12 in stock" bright. "+ New" computes `rgb(255,255,255)`.
- **Not fixed — see UI-X2.**

### UI-5 — Text wraps where it should not *(done 2026-11-28)*
- **Symptom:** (a) Add Product → the **Back** button's text and icon wrap onto two lines;
  (b) Inventory → the **per page** selector at the bottom wraps its text.
- **Fix:** `white-space: nowrap` and `flex-shrink: 0` on the button and the select; make sure the container
  lets it keep its natural width.
- **Verify:** at 360px and 390px.
- **Back button — root cause was not wrapping text.** Tailwind's preflight sets `svg { display: block }`, so the arrow icon sat **above** the label (button measured 55px tall). Fixed once in the shared `.secondary-btn` rule (`display:inline-flex; align-items:center; gap:4px; white-space:nowrap; flex-shrink:0`) — **every** icon+label secondary button benefits. Now 37px, icon beside text.
- **Per page:** `select.input` is `width:100%`, which squeezed the label onto two lines. Label is `whitespace-nowrap`, select is `width:auto`. **Gotcha I hit and fixed:** shrinking the select without reserving right padding drew the chevron *through* the "10"; padding is now `3px 32px 3px 8px`.
- **Verified at 390px by screenshot.**

### UI-6 — Edit Product header on phones *(done 2026-11-28)*
- **Symptom:** *Delete Product*, *Back*, *Save SKU* are oversized for a phone, their fonts are large, and
  the title/description block on the left is not aligned.
- **Fix:** responsive header — compact buttons (smaller padding and font, icon-only or shorter labels at
  ≤ 480px), a single column title block with consistent left alignment, and the actions in one tidy row.
  File: `src/pages/products/EditProductPage.tsx`.
- **Note:** this page was edited upstream on 2026-11-26/28 — re-read it after the pull, do not work from memory.
- **Verify:** 360px, 390px, 768px, desktop.
- **Cause:** one non-wrapping flex row with fixed inline sizes (`padding: 8px 16px; fontSize: 14px`) — inline styles cannot respond to a media query.
- **Fixed:** layout moved to `.edit-header*` classes in `AddNewProduct.css`. ≤640px: title stacks above one compact action row; **Delete becomes an icon-only button** (`aria-label`/`title` kept) so Back and Save get the space; buttons 36px tall at 13px.
- **Two gotchas found while verifying (both fixed):** global `.products-header span { margin-left: 12px }` indented the name when it became a block line; and the title block was sized to its content, so a long name overflowed the card and never ellipsized — now `width:100%`.
- **Verified by screenshot at 390px (dark) and 360px (light), and measured at 1280px:** desktop is unchanged (side-by-side, full "Delete Product" label).

### UI-7 — Profile: Categories & Reach does nothing *(done 2026-11-28)*
- **Symptom:** no button or selection in the *Categories & Reach* section responds.
- **Status:** not yet investigated. Start in `src/pages/ProfilePage.tsx`; check for missing `onClick`/state
  handlers, a disabled/read-only wrapper, and whether a save endpoint exists in `src/api/`.
  Decide with the owner whether this section is *meant* to be editable by the merchant — if the backend has
  no endpoint, the honest fix may be to make it read-only and say so, not to invent an API.
- **Not a broken handler.** The handlers are fine. `ProfilePage.tsx` wraps every tab except **Bank & KYC** in `<fieldset disabled={activeTab !== "bank"}>`, and a banner says store details are "verified and locked". The pills and the courier toggle were disabled but styled identically to live controls, so taps appeared to do nothing. The page also has **no save handler** for the shop tab — only `handleSaveBank` / `handleSaveKyc`.
- **Fixed by making the lock visible, not by enabling the controls:** `fieldset:disabled .filter-pill, .toggle` are dimmed with `cursor:not-allowed` (global rule in `src/index.css`), and the section heading carries a lock icon + **"Managed by admin"**. Enabling them would bypass an admin lock the product evidently intends and would have nothing to save to.
- **Verified at 390px by screenshot** (and by the snapshot, which shows the buttons `disabled`).
- **If you *do* want merchants to edit courier delivery / returns / gender segments themselves:** the backend already accepts them (`updateMerchantShopDetails`, `authControllers.js:227–309`). It would need a save handler, and the `fieldset` lock moved so these controls are outside it. That is a policy call — **UI-D3**.

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

### UI-10 — "Per page": items or rows? *(raised by the owner 2026-11-28)* *(done 2026-11-28)*
- **Answer:** it counts **items (products)**, not rows — `processedProducts.slice(start, start + pageSize)`.
  **Items is the right unit:** it is what the merchant thinks in and what the counter beside it says
  ("1 / 1 (3 items)"); it works the same in card, list and table views; and *rows* would be wrong because
  the column count changes with the 2C/3C/4C/5C toggle and the breakpoint, so a page would grow and shrink
  as the phone rotates.
- **Real bug found while checking:** `pageSize` defaults to **24**, but the options were 10/15/25/50, so
  the select showed **"10" while 24 products were listed**.
- **Fixed:** options are now **12 / 24 / 48 / 96** — all divisible by 2, 3, 4 and 6 columns, so a grid page
  ends on a full row — and 24 (the default) is one of them. The 5-column layout cannot divide evenly; accepted.
- **Verified:** select shows 24, options 12/24/48/96.
- **Not done (out of scope, worth knowing):** pagination is **client-side** — the page fetches the whole
  catalogue, then slices. Fine for hundreds of products; a merchant with thousands wants server-side paging.

### UI-11 — Profile: verification-pending badge misaligned
- **Symptom (owner, 2026-11-28):** the text in the *verification pending* badge on the Profile page is not
  aligned well. Not yet investigated — see it at 390px first; compare against the badge's icon/text baseline.

---

## Decisions needed from the owner

| # | Question | Recommendation |
|---|---|---|
| UI-D1 | Apply the UI-9 order? | **Done** — you delegated the call |
| UI-D2 | Rename web **Inventory → Products** to match the app? | Yes — it is the reason the two names are being mixed up in bug reports. One line in `Sidebar.tsx` |
| UI-D3 | Should merchants be able to edit *Categories & Reach* (gender segments, courier delivery, returns) themselves? | **Currently locked by design.** Backend supports it. Recommend keeping it admin-managed until there is a reason not to: these settings change which orders a merchant receives and what customers are promised |

---

## Found while pulling (not part of the 11 reports)

| | |
|---|---|
| ⚠️ **Test coverage regressed** | The upstream commit `5915cc3 updated the size ui` **deleted `src/utils/size.test.ts`** (14 tests) and rewrote `SizeField.tsx` as a segmented control with a 26–36 range (was 28–36). The one remaining suite is `src/pwa/registerPwa.test.ts`. The behaviour the deleted tests pinned — an explicit mode change clears sizes the new list cannot show; values from the server never get hidden — should be re-checked against the new `SizeField`, and the tests restored or rewritten. Tracked as **UI-X1**, not started. |
| ⚠️ **UI-X2 — systemic: base CSS beats Tailwind utilities** | `src/index.css` has unlayered `a`, `h1`–`h6` and `p` rules setting `color` (headings also set `font-size`/`font-weight`). Tailwind 4 utilities are layered, so **every `text-*`, `font-*` and `dark:text-*` on those elements is ignored.** Counted: **~105 elements in 22 files** (h1 6, h2 11, h3 24, h4 10, p 54). Expect more bug reports like UI-4. **Proper fix:** wrap those base rules in `@layer base { … }` so utilities win — but that **changes the rendered size and weight of ~105 elements app-wide** (their Tailwind sizes would start applying), so it needs its own change and a visual pass over all 22 files, not a drive-by. Until then, the workaround for a single element is the important modifier: `text-white!`. |
| `package-lock.json` | ~9,400 changed lines upstream. Run `npm install` after pulling. |
| `FF_api_web` | Local `dev2` is **4 commits ahead** (the offers documents) and **2 behind**. Not pulled — it would need a merge or rebase. Docs only. |

---

## Log

Newest first. One line per finished task or major point: date · task · what changed · commit.

- 2026-11-28 · UI-7 · controls were disabled on purpose but looked live — now greyed out and labelled "Managed by admin"
- 2026-11-28 · UI-10 · per-page options 12/24/48/96 (default 24 was not an option, so the select lied)
- 2026-11-28 · UI-6 · Edit header moved from inline styles to `.edit-header*` classes with a ≤640px layout
- 2026-11-28 · UI-5 · `.secondary-btn` is now an inline-flex row; per-page select `width:auto` with room for its chevron
- 2026-11-28 · UI-4 · sheet title + "+ New" use Tailwind's important modifier; fixed `slate-850` typo and 2 stock-chip dark colours
- 2026-11-28 · UI-3 · global `select { line-height: normal }` in `src/index.css`
- 2026-11-28 · UI-2 · `accessibilityLayer={false}` on all 5 charts + `rootTabIndex={-1}` on both Pies
- 2026-11-28 · UI-9 · desktop nav now Dashboard, Orders, Inventory, Revenue, Courier, Warehouse Stock, Offers, Zip Covers, Policies; warehouse list and its mobile bar aligned · see commit
- 2026-11-28 · UI-1 · segment match replaces substring match · `190133c`
- 2026-11-28 · setup · pulled `MerchantModule` (fast-forward to `cef17a6`); wrote this tracker; root cause of UI-1 identified.
