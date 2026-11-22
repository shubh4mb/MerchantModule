# VERIFY — MerchantModule (merchant web dashboard)

**The protocol is defined once, for every repo and every agent, in
[../FF_api_web/docs/ecosystem/VERIFY.md](../FF_api_web/docs/ecosystem/VERIFY.md). Read it.**
This file lists the flows *this* repo participates in, and the checks specific to it.

> A green test suite proves the code does what the test says. It does not prove the feature works.
> Run this after a feature build, **even when all tests pass**.

## The short version

0. **Preconditions** — lint clean, typecheck clean, all tests green, the feature's own tests genuinely fail
   when the feature is reverted, docs updated in the same commit.
1. **Name the flows** the change touches — including the ones you did *not* change but which share code
   (`grep` the callers; that is where regressions live).
2. **Walk each one as the user** — fresh account, real UI, real device, small screen, whole journey.
3. **Run the standing checklist** from the hub file: empty states, first-time user, boundaries, offline,
   backgrounding, double-tap, back button, API 500, money formatting, IST dates, cross-role consistency,
   access control.
4. **Capture evidence** — a screenshot or a response body per flow. "It should work" is not evidence.
5. **Verdict** — PASS (record it in `verify/<date>-<feature>.md`), FAIL (fix, re-run from step 0), or
   BLOCKED (see below).

## Flows owned by this repo

| # | Flow |
|---|---|
| M1 | Register → KYC + bank + GSTIN → map location → registration fee → pending → approved |
| M2 | Add a product with variants, sizes, colours, images |
| M3 | Bulk upload a product CSV, **including a malformed row** |
| M4 | Quick stock update: in / low / out |
| M5 | **Order alert:** chime + popup → accept within the window → pack → zip-cover seal |
| M6 | Decline an order, **and** let one time out |
| M7 | Hand over to the rider: last-4 match → share pickup OTP |
| M8 | Verify a returned item → approve the return handshake |
| M9 | Create a store offer, and a store coupon → confirm both appear for customers |
| M10 | Earnings: current week → custom range → per-order breakdown → UTR → CSV |
| M11 | Toggle store online/offline, and set business hours |
| M12 | Warehouse operator: dashboard → inventory → fulfil a warehouse order |

The full catalogue, including the cross-role flows, is in the hub file. **X1 — the whole Try & Buy journey
across all four roles — is run before any release.**

## Checks specific to this repo

- [ ] **The order alert fires with sound on a fresh browser session.** Autoplay policy blocks audio until a
      user gesture unlocks the context — a silent first alert is the highest-cost bug in this app. Test in a
      new incognito window, not a tab you have been clicking in.
- [ ] **Alert with the tab backgrounded** and with the browser minimised.
- [ ] **Every screen at 360px.** Merchants use this on phones; `MobileUploadProof` exists for that reason.
- [ ] **Revenue figures match the admin panel** for the same order, and match the bank transfer for a settled
      week. Open both side by side.
- [ ] **A merchant's own offer is shown as deducted from their payout** at authoring time, not discovered
      at settlement.
- [ ] **Bulk upload with a malformed row** → a useful per-row error, not a silent partial import.
- [ ] **Double-tap "Accept order"** → one acceptance.
- [ ] **Hard refresh mid-flow** → state recovers from the server, not from memory.

## When something will not fix

Three genuine fix attempts on one specific failure and no further. Then: **stop**, revert the attempts,
record it in `docs/KNOWN-ISSUES.md` in the documented format, and tell the human the one decision or
credential that would unblock it.

A fourth attempt built on a wrong model of the problem is the one that breaks something adjacent.

## For non-Claude agents

Nothing here is Claude-specific. Claude Code has `/verify`; every other agent reads this file and the hub
file and executes the steps. If you have no device or browser, run what you can and report
**PARTIAL — manual device verification outstanding**, naming the flows a human must walk. Never report PASS
for a flow you could not execute.
