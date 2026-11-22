# FlashFits merchant dashboard: what it is

_Last Updated: 2026-11-21_

The console partner stores and FlashFits warehouse operators run their FlashFits business from. They list
products, accept orders within minutes, pack them into sealed zip covers, hand them to riders, inspect what
comes back, run their own store offers, and see what they will be paid.

This is the **primary merchant surface**. [`../MerchantApp`](../MerchantApp) is an Expo app covering a
subset of the same ground and is a retirement candidate —
[../FF_api_web/docs/reports/merchant-consolidation.md](../FF_api_web/docs/reports/merchant-consolidation.md).

See [../FF_api_web/PRODUCT.md](../FF_api_web/PRODUCT.md) for the platform as a whole.

## Who uses it

- **Boutique owners and their staff** — usually one or two people, often on a phone behind a counter, who
  also have a shop to run. They did not ask for software.
- **FlashFits warehouse operators** — same login, `accountType: warehouse`, with their own screens for
  managing FlashFits-held stock.

Both care about the same two things: **not missing an order**, and **being paid the right amount**.

## The journeys

### Getting set up

Sign up → KYC (PAN, GST, trade licence), bank details and a shop photo → pin the shop on a map → pay the
registration fee → wait for FlashFits approval → go live. Rejection comes with a reason.

### Selling

List products with variants — sizes, colours, images, prices — one at a time or by **CSV bulk upload**. Keep
stock accurate with quick in/low/out toggles. Set the shop online or offline, and business hours.

### Fulfilling an order — the time-critical part

1. **An order arrives** with a chime and a popup. There are **5–10 minutes** to accept or decline.
2. **Pack** the items into a FlashFits **zip cover** and record the security seal ID.
3. **Hand over to the rider**, who quotes the last 4 digits of the order; the merchant gives the pickup OTP.
4. **Later, the returns come back.** Inspect tags, confirm condition, approve the return handshake.

Courier orders are simpler: pack and ship, no rider, no trial.

### Getting paid

Payouts settle **weekly**. The dashboard shows gross sales, the FlashFits commission, deductions, and the net
amount, with the bank reference (UTR) once paid.

### Promoting

Create store offers and store coupons — a flat or percentage discount, a minimum order, free delivery.
**A merchant's own discount comes out of their own payout**, which the UI should say plainly.

## The main ideas

| Idea | In plain words |
|---|---|
| **Accept window** | The few minutes to take an order before it is offered elsewhere. |
| **Zip cover** | The sealed bag items travel in. Its seal ID is recorded at packing. |
| **Pickup OTP** | What the merchant gives the rider to release the order. |
| **Return verification** | Inspecting what the customer did not keep, before accepting it back. |
| **Offer** | A discount that applies automatically to qualifying carts. |
| **Coupon** | A discount a customer applies with a code. |
| **Commission** | FlashFits' cut of a sale, by category. |
| **Weekly payout** | Gross sales − commission − deductions = what reaches the bank. |
| **Warehouse account** | A merchant login that manages FlashFits-held stock instead of a shop's. |

## What makes it awkward to build

- **A missed alert is a lost sale.** On the web this means fighting browser autoplay policy: audio will not
  play until the user has interacted with the page, so the first alert of a session can be silent unless the
  audio context is unlocked at login. This is the highest-cost bug class in this app.
- **Merchants use this on phones** as much as on a desktop. `MobileUploadProof` exists precisely because
  packing proof is photographed on a phone.
- **Payout figures must match the bank exactly.** A merchant comparing the dashboard against their statement
  and finding a difference is a trust problem, not a display bug.
- **Try & Buy means a sale is provisional.** What the merchant is paid depends on what the customer kept
  after the trial, which is settled later.

## What it does today

Registration with KYC, bank, map location and fee payment; approval states; dashboard metrics; product
management with variants and a cropper; CSV bulk upload; inventory and quick stock updates; live order
management with socket alerts; courier orders; zip-cover recording; return verification; store offers; a
four-screen warehouse module; a revenue screen with a week selector, payout log, UTR copy and gross/
commission split; profile with shop, location, hours and bank tabs; brand management; product matching
against the FlashFits catalogue; and policies.

## Status

Live on Vercel, branch `main`.

Not a PWA yet (no manifest, no service worker). `StockQuickUpdate` is built but its route is commented out,
so merchants on web cannot use it. The order alert loads its sound from a remote CDN despite a bundled copy
existing. No tests. See [DESIGN.md](DESIGN.md) §6.

## Later (named, not built)

Custom date-range earnings with per-order breakdown, commission provenance, the impact of the merchant's own
offers, and CSV export; PWA installability plus a Capacitor build to replace the Expo app. Reports in
[../FF_api_web/docs/reports/](../FF_api_web/docs/reports/); none approved.
