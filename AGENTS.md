# MerchantModule — agent instructions

The FlashFits **merchant web dashboard**. Vite + React 19 + TypeScript.

> **This is the primary merchant surface.** `MerchantApp` (Expo) is a feature *subset* of this app and is a
> candidate for retirement. **Build merchant features here**, not there. Read
> `../FF_api_web/docs/reports/merchant-consolidation.md` before adding anything to either.

**Read before changing anything:**

| | |
|---|---|
| `PRODUCT.md` | what a merchant does, onboarding to payout |
| `DESIGN.md` | how it is built, routing, state, sockets |
| `../FF_api_web/docs/ecosystem/README.md` | cross-repo facts: IST, money, the order lifecycle, vocabulary |
| `../FF_api_web/docs/ecosystem/PRINCIPLES.md` | the ten non-negotiables |
| `../FF_api_web/docs/ecosystem/TESTING.md` | the test stack and what new work must ship with |
| `VERIFY.md` | what to do when you think you are finished |

## Principles

Full statements in `../FF_api_web/docs/ecosystem/PRINCIPLES.md`. The ones that matter here:

1. **The server owns every amount.** Payouts, commission, gross sales, deductions — display what the API
   returned. A merchant comparing the dashboard against their bank statement must find them identical.
2. **A merchant's own offers reduce their own payout.** When a merchant authors an offer, say so plainly in
   the form: *"This discount is deducted from your payout."* Most disputes are about surprise, not
   arithmetic. See `../FF_api_web/docs/reports/coupons-and-offers.md` §7.
3. **A missed order alert costs a sale.** The merchant has 5–10 minutes to accept. The audio alert
   (`src/context/NotificationContext.tsx`, `src/utils/sounds/sirensound.mp3`) is critical-path, and browser
   autoplay policy means the audio context must be unlocked by a user gesture at login — otherwise the first
   alert of the session is silent.
4. **Dates are IST.** Earnings periods come resolved from the server; never compute "this week" in the
   browser.
5. **This runs on a phone browser as often as a desktop.** `src/pages/order/MobileUploadProof.tsx` exists
   because merchants photograph packing proof on their phones. Test every screen at 360px.
6. **Tests ship with the feature**, and **`/verify` before done.**

## Commands

```bash
npm install
npm run dev              # vite
npm run build            # tsc -b && vite build
npm run lint

git config core.hooksPath .githooks   # once per clone
```

**No test runner is configured yet.** Vite is already the build tool, so the chosen stack is **Vitest** +
`@testing-library/react` (shares the Vite config, zero extra setup) with **Playwright** for E2E. See
`../FF_api_web/docs/ecosystem/TESTING.md`.

Deployed via Vercel (`vercel.json` rewrites everything to `index.html` for client-side routing).

## Layout

```
src/
  App.tsx                  all routes. Public → /merchant/login, signup, forgot-password,
                           order/upload-proof, policies. Protected → register, pending-verification,
                           payment, rejected. AppLayout → dashboard, orders, courier-orders,
                           inventory, add-product, bulk-upload, edit/:id, warehouse-*, revenue,
                           offers, zip-covers, profile, policies
  api/                     REST clients per domain (analytics, auth, order, courierOrder,
                           products, offers, warehouseOrder, zipCovers)
  context/                 Auth, Notification, ConfirmDialog
  components/              layout/ (AppLayout, Navbar, Sidebar), Products/, Brand/,
                           ProductPage/, auth/, utils/ (croppers, pickers, dialogs)
  pages/                   screens, grouped: auth/, products/, warehouse/, brands/, order/
  sockets/ utils/          orderListeners, socket, axiosInstance, image/price/sku/date helpers
```

**Where to put things:** a page composes components and calls `api/`. Never call `axios` directly from a
page — use `utils/axiosInstance.ts` through an `api/` module.

## Known debt

1. **Not a PWA.** No manifest, no service worker, no icons — `public/` contains only `vite.svg`, and
   `index.html` references `/src/assets/favicon1.webp` (a dev-server path that will not resolve the same way
   in a build). This is the first thing to fix for the consolidation path.
2. **`StockQuickUpdate` is built but unrouted** — `src/App.tsx` line 118 is commented out, so merchants on
   web cannot use the quick stock screen that `MerchantApp` ships as a primary feature. A real parity gap.
3. **The order alert sound loads from a remote CDN** (`assets.mixkit.co`) in
   `src/context/NotificationContext.tsx`, even though `src/utils/sounds/sirensound.mp3` is bundled. A network
   failure means a silent alert. Use the bundled file.
4. **No notifications page** — only `Navbar/NotificationDropdown.tsx`. `MerchantApp` has a full screen.
5. **Socket identity travels in the handshake query** (`src/utils/socket.ts`). When the backend adds socket
   authentication (`../FF_api_web/docs/security-findings.md` S1) this client must pass the JWT in `auth`.
6. **No repo documentation** until now — `README.md` is the Vite scaffold.
7. **`.env` is committed to this repo.** Check it for secrets and remove it from history if it holds any;
   the pre-commit hook now blocks future ones.

## If the Capacitor migration is approved

`../FF_api_web/docs/reports/merchant-consolidation.md` has the full plan. In short: this repo gains a PWA
manifest and service worker, then Capacitor with `appId: 'com.shubhamexpo7.FlashFitsMerchantApp'` (the
existing Android/iOS identifier — **do not change it**, it is what the store listings are keyed to), web
assets bundled locally rather than served from a URL, and Capacitor plugins replacing the Expo native calls.
Export the EAS Android keystore **before** starting.

## Documentation

Docs mirror the code tree: `docs/src/pages/README.md` documents `src/pages/`. Update the doc in the same
commit as the code.

## When you are finished

Run `VERIFY.md`. For this app, always check: **the order alert fires with sound on a fresh session**
(autoplay policy), **every screen at 360px width**, and **the revenue figures against the admin panel for the
same order**.

Three failed fix attempts on one problem → stop, revert, record it in `docs/KNOWN-ISSUES.md`, tell the human.

## Git

Commit explicit paths, never `git add -A`. `type(scope): description`. Branch `main` is latest.
