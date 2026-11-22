# src/sockets/ and src/utils/socket.ts

| File | What |
|---|---|
| `utils/socket.ts` | the socket.io client |
| `sockets/orderListeners.ts` | registers the handlers — new orders, status changes, cancellations |

Room joined: `merchant:{merchantId}`, plus `warehouse:{warehouseId}` for warehouse accounts.

## Gotchas

- **Identity travels in the handshake query** (`role=merchant`, `merchantId`). Server-side this is
  **unauthenticated** — anyone can connect with any merchant id and read that merchant's order stream. See
  [security-findings.md](../../../../FF_api_web/docs/security-findings.md) S1. When the backend adds
  handshake auth, pass the JWT in `auth`. That change lands in all five clients together.
- **A socket event drives the order alert**, so a listener that throws can silence the alert without any
  visible error. Keep the handler defensive and the sound call outside anything that can throw before it.
- **The backend runs a single instance** and `@socket.io/redis-adapter` is not wired, so during a redeploy
  every client reconnects at once and events sent mid-deploy are lost. The orders screen should reconcile
  from a fetch on reconnect rather than trusting it received everything.
- Leave rooms and remove listeners on unmount, or a long session accumulates duplicate handlers — which
  shows up as the alert firing several times for one order.
