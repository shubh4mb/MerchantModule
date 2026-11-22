# MerchantModule documentation index

Docs mirror the code tree. **Update the doc in the same commit as the code.**

## Start here

| | |
|---|---|
| [../PRODUCT.md](../PRODUCT.md) | what a merchant does, onboarding to payout |
| [../DESIGN.md](../DESIGN.md) | routing, state, sockets, §6 known debt, §7 the Capacitor plan |
| [../AGENTS.md](../AGENTS.md) | rules for AI coding agents |
| [../VERIFY.md](../VERIFY.md) | post-build verification flows |
| [../../FF_api_web/docs/reports/merchant-consolidation.md](../../FF_api_web/docs/reports/merchant-consolidation.md) | **why this repo is the one to build in** |

## Code map

| Path | What | Doc |
|---|---|---|
| `src/` | routing, state, the stack | [src/README.md](src/README.md) |
| `src/pages/` | screens | [src/pages/README.md](src/pages/README.md) |
| `src/api/` | REST clients | [src/api/README.md](src/api/README.md) |
| `src/context/` | Auth, Notification, ConfirmDialog | [src/context/README.md](src/context/README.md) |
| `src/components/` | shared UI | [src/components/README.md](src/components/README.md) |
| `src/sockets/`, `src/utils/socket.ts` | real-time | [src/sockets/README.md](src/sockets/README.md) |
| `src/utils/` | helpers | [src/utils/README.md](src/utils/README.md) |

## Cross-repo

| | |
|---|---|
| [../../FF_api_web/docs/ecosystem/README.md](../../FF_api_web/docs/ecosystem/README.md) | IST, money, identity, the order lifecycle |
| [../../FF_api_web/docs/ecosystem/PRINCIPLES.md](../../FF_api_web/docs/ecosystem/PRINCIPLES.md) | the ten non-negotiables, git hooks, the 3-strike rule |
| [../../FF_api_web/docs/ecosystem/TESTING.md](../../FF_api_web/docs/ecosystem/TESTING.md) | Vitest + Testing Library + Playwright |
| [../../FF_api_web/docs/security-findings.md](../../FF_api_web/docs/security-findings.md) | **read first** |
| [KNOWN-ISSUES.md](KNOWN-ISSUES.md) | problems that resisted three fix attempts |
