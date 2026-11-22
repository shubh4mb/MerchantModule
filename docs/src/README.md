# src/

## Routing

Everything is declared in `App.tsx`. Three tiers:

| Tier | Wrapper | Screens |
|---|---|---|
| Public | `PublicRoute` | `/merchant/login`, `/signup`, `/forgot-password`, `/merchant/order/upload-proof`, `/policies` |
| Protected, pre-approval | `ProtectedRoute` | `register`, `pending-verification`, `payment`, `rejected` |
| Protected, in-app | `ProtectedRoute` + `AppLayout` | `dashboard`, `orders`, `courier-orders`, `inventory`, `add-product`, `bulk-upload`, `edit/:id`, `warehouse-*`, `revenue`, `offers`, `zip-covers`, `profile`, `policies` |

`/merchant/order/upload-proof` is **deliberately public** — opened on a phone to upload packing proof without
signing in.

The onboarding state machine (register → pending → payment → rejected → live) is driven by the merchant's
status from `AuthContext`.

**`StockQuickUpdate` is built but its route is commented out at `App.tsx:118`** — a real parity gap against
`MerchantApp`, which ships it as a primary screen.

## Where to put things

| | |
|---|---|
| A screen | `pages/<Name>.tsx` (or a subfolder), registered in `App.tsx` and `components/layout/Sidebar.tsx` |
| A server call | `api/<domain>.ts` — **never** axios directly in a page |
| Shared UI | `components/` |
| Real-time | `sockets/orderListeners.ts` + `utils/socket.ts` |

## Stack notes

**Four styling systems are in use:** MUI 7 + Emotion, Tailwind 4, `framer-motion`, and per-component `.css`
files. Match the surrounding file rather than adding a fifth. Consolidating is worth doing but is not a
mid-feature job.

`recharts` for charts, `react-leaflet` for the shop-location map, `papaparse` for CSV, `react-window` for
long lists, `react-easy-crop` for image cropping, `react-dropzone` for uploads.

## Gotchas

- **Target 360px.** Merchants use this on phones as much as on desktops.
- **TypeScript** here, unlike the admin panel's JavaScript — `npm run build` runs `tsc -b`, and the
  pre-commit hook runs `tsc --noEmit`.
- **Not a PWA yet** — no manifest, no service worker, and `index.html` references
  `/src/assets/favicon1.webp`, a dev-server path. First thing to fix on the consolidation path.
