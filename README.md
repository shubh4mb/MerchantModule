# MerchantModule

The FlashFits **merchant web dashboard** — onboarding, catalogue, live order fulfilment, warehouse stock,
offers, and payouts. Vite + React 19 + TypeScript.

> **This is the primary merchant surface.** [`MerchantApp`](../MerchantApp) (Expo) is a feature subset and a
> retirement candidate. Build merchant features here. See
> [../FF_api_web/docs/reports/merchant-consolidation.md](../FF_api_web/docs/reports/merchant-consolidation.md).

## Setup

```bash
git config core.hooksPath .githooks     # once per clone
npm install
npm run dev                             # vite
```

## Commands

| | |
|---|---|
| `npm run dev` | vite dev server |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | eslint |
| `npm test` | vitest (single run); `npm run test:watch` to iterate |
| `bash .githooks/test-hooks.sh` | self-check the git hooks |

**Vitest is configured** (`npm test`) and shares the Vite config. `@testing-library/react` is not installed
yet — add it with the first component test; **Playwright** is the choice for E2E. See
[../FF_api_web/docs/ecosystem/TESTING.md](../FF_api_web/docs/ecosystem/TESTING.md).

Deployed on Vercel; `vercel.json` rewrites all paths to `index.html` for client-side routing.

## Where things are

```
src/App.tsx          every route. Public: login, signup, forgot-password, order/upload-proof, policies.
                     Protected: register, pending-verification, payment, rejected.
                     In AppLayout: dashboard, orders, courier-orders, inventory, add-product,
                     bulk-upload, edit/:id, warehouse-*, revenue, offers, zip-covers, profile
src/api/             REST clients per domain
src/context/         Auth, Notification, ConfirmDialog
src/pages/           screens, grouped: auth/ products/ warehouse/ brands/ order/
src/components/      layout/ Products/ Brand/ ProductPage/ auth/ utils/
src/sockets/ utils/  orderListeners, socket, axiosInstance, image/price/sku/date helpers
```

## Known gaps

- **Not a PWA** — no manifest, no service worker, no icons. First thing to fix on the consolidation path.
- **`StockQuickUpdate` is built but its route is commented out** (`src/App.tsx` line 118), so merchants on
  web cannot use it. A real parity gap against `MerchantApp`.
- **The order alert loads its sound from a remote CDN** even though `src/utils/sounds/sirensound.mp3` is
  bundled — a network failure means a silent alert.

## Documentation

| | |
|---|---|
| [PRODUCT.md](PRODUCT.md) | what a merchant does, onboarding to payout |
| [DESIGN.md](DESIGN.md) | routing, state, sockets, known debt |
| [AGENTS.md](AGENTS.md) | rules for AI coding agents |
| [VERIFY.md](VERIFY.md) | post-build verification flows |
| [../FF_api_web/docs/ecosystem/README.md](../FF_api_web/docs/ecosystem/README.md) | cross-repo facts |

Branch `main` is latest.
