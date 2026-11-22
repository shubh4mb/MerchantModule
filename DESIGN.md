# MerchantModule: design

_Last Updated: 2026-11-21 (first design document; describes `main` as it is)_

Read [PRODUCT.md](PRODUCT.md) first, and
[../FF_api_web/docs/ecosystem/README.md](../FF_api_web/docs/ecosystem/README.md) for cross-repo facts.

## 1. Architecture

```
 ┌──────────── MerchantModule (Vite 7 + React 19 + TS) ────────────┐
 │  main.tsx → App.tsx                                            │
 │    AuthProvider → NotificationProvider → ConfirmDialogProvider  │
 │      └─ react-router-dom 7                                     │
 │           Public      → login, signup, forgot-password,         │
 │                         order/upload-proof, policies            │
 │           Protected   → register, pending-verification,         │
 │                         payment, rejected                       │
 │           AppLayout   → dashboard, orders, inventory, revenue,  │
 │                         offers, warehouse-*, profile, …         │
 │                                                                 │
 │  api/<domain>.ts ──► utils/axiosInstance.ts ──► REST /api/*     │
 │  utils/socket.ts + sockets/orderListeners.ts ──► merchant:{id}  │
 │  localStorage ──► JWT                                           │
 └─────────────────────────────────────────────────────────────────┘
                              ▼ Vercel (SPA rewrites)
```

**Stack:** Vite 7, React 19, TypeScript 5.8, React Router 7, MUI 7 + Emotion, Tailwind 4, `framer-motion`,
`recharts`, `react-leaflet`, `react-dropzone`, `react-easy-crop`, `papaparse` (CSV), `react-window`
(virtualisation), `lodash.debounce`, `mitt`, `jwt-decode`, `@react-oauth/google`, socket.io-client.

## 2. Routing and gating

All routes are declared in `src/App.tsx`. Three tiers:

| Tier | Wrapper | Screens |
|---|---|---|
| Public | `PublicRoute` | `/merchant/login`, `/signup`, `/forgot-password`, `/merchant/order/upload-proof`, `/policies` |
| Protected, pre-approval | `ProtectedRoute` | `/merchant/register`, `/pending-verification`, `/payment`, `/rejected` |
| Protected, in-app | `ProtectedRoute` + `AppLayout` | `dashboard`, `orders`, `courier-orders`, `inventory`, `add-product`, `bulk-upload`, `edit/:id`, `warehouse-dashboard`, `warehouse-orders`, `warehouse-stock`, `revenue`, `offers`, `zip-covers`, `profile`, `policies` |

`/merchant/order/upload-proof` is **deliberately public** — a rider or merchant opens it from a phone to
upload packing proof without signing in.

The onboarding state machine (register → pending → payment → rejected → live) is driven by the merchant's
status from `AuthContext`.

## 3. State

Three contexts, no store library:

| Context | Holds |
|---|---|
| `AuthContext` | the merchant, JWT in `localStorage`, approval status |
| `NotificationContext` | socket notifications, the unread list, **the order alert sound** |
| `ConfirmDialogContext` | an imperative confirm dialog (`ConfirmDialog`) |

Server data is fetched per screen; there is no shared cache. `react-window` is used where lists get long.

## 4. Server access and real-time

`src/api/`: `analytics`, `auth`, `courierOrder`, `offers`, `order`, `products`, `warehouseOrder`,
`zipCovers`. `utils/axiosInstance.ts` holds the axios instance and the JWT interceptor.

**Rule: a page never calls axios directly.** It calls an `api/` function.

`utils/socket.ts` connects with the merchant id **in the handshake query**;
`sockets/orderListeners.ts` registers the handlers. Server-side this is currently unauthenticated
([../FF_api_web/docs/security-findings.md](../FF_api_web/docs/security-findings.md) S1) — when handshake auth
lands, pass the JWT in `auth`.

**The server owns every amount.** `Revenue.tsx` displays what the API returned; it must not recompute a
payout.

## 5. The order alert

`NotificationContext.tsx` plays a sound when an order arrives. Two problems with the current
implementation:

1. **It loads from a remote CDN** (`assets.mixkit.co`) even though `src/utils/sounds/sirensound.mp3` is
   bundled. A network failure means a silent alert.
2. **Browser autoplay policy** blocks `new Audio().play()` until the user has interacted with the page. The
   first alert of a session can therefore be silent.

**The fix for both:** use the bundled file, and create + prime the `Audio` element on a user gesture at
login so the audio context is unlocked before the first alert. Verify in a **fresh incognito window**, not a
tab you have been clicking in — that is the only way to reproduce the real-world case.

## 6. Known debt

1. **Not a PWA.** No manifest, no service worker, no icon set; `public/` holds only `vite.svg`, and
   `index.html` references `/src/assets/favicon1.webp` — a dev-server path. This is the first thing to fix on
   the consolidation path.
2. **`StockQuickUpdate` is built but unrouted** — `src/App.tsx` line 118 is commented out. `MerchantApp`
   ships this as a primary screen, so this is a real parity gap blocking that app's retirement.
3. **The order alert fetches its sound remotely** and does not unlock the audio context (§5).
4. **No notifications page** — only `Navbar/NotificationDropdown.tsx`. `MerchantApp` has a full screen.
5. **No tests, no runner.** Vitest would share the existing Vite config.
   [ecosystem/TESTING.md](../FF_api_web/docs/ecosystem/TESTING.md).
6. **Socket identity in the handshake query** (§4).
7. **`.env` is committed.** Check it for secrets; the pre-commit hook blocks future ones.
8. **MUI and Tailwind are both in use**, plus `framer-motion` and per-component `.css` files. Four styling
   systems. Match the surrounding file rather than adding a fifth.
9. **Duplicate cropper implementations** — `components/utils/croping/cropImage.js`,
   `pages/auth/LogoCrop/utils/cropImage.ts`, `CropperModal`, `CropperAddVarient`, plus the `useImageCropper`
   hook in the admin panel. One cropper would do.
10. **`AddVarient` / `components/Products/AddVarient/`** — a misspelling of "variant" baked into paths.

## 7. If the Capacitor migration is approved

Full plan in
[../FF_api_web/docs/reports/merchant-consolidation.md](../FF_api_web/docs/reports/merchant-consolidation.md).
The shape of it:

- Add a PWA manifest, service worker and icons. Ship as an installable web app first — zero store risk.
- Add Capacitor 7 with `appId: 'com.shubhamexpo7.FlashFitsMerchantApp'` — **the existing identifier**,
  which is what the store listings are keyed to.
- **Bundle the web assets locally.** Do not point `server.url` at production: Apple 2.5.2 prohibits it.
- Replace Expo native calls with Capacitor plugins: `@capacitor/push-notifications` (FCM/APNs),
  `@capacitor/haptics`, `@capacitor-community/native-audio`, `@capacitor/local-notifications`,
  `@capacitor/preferences`, `@capacitor/filesystem` + `share`, `@capacitor/camera`.
- Push tokens become FCM/APNs, so the backend needs a provider branch (report §5).
- **Export the EAS Android keystore before starting** — without the upload key the Play listing cannot be
  updated.

## 8. Open points

- Whether the Capacitor migration happens at all.
- Whether to adopt a server-data cache.
- Which styling system wins (§6.8).
- Whether the merchant alert needs a desktop OS-level notification as a backstop to the in-page sound.
