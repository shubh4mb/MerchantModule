# src/context/

Three contexts, no store library. Server data is fetched per screen; there is no shared cache.

| Context | Holds |
|---|---|
| `AuthContext` | the merchant, the JWT in `localStorage`, the approval status that drives the onboarding state machine |
| `NotificationContext` | socket notifications, the unread list, and **the order alert sound** |
| `ConfirmDialogContext` | an imperative confirm dialog, rendered by `components/utils/popup/ConfirmDialog` |

## `NotificationContext` — the order alert

This is the most business-critical code in the app: a missed alert is a lost sale, and the merchant has only
minutes to accept.

Two known problems:

1. **It loads the sound from a remote CDN** (`assets.mixkit.co`) even though
   `src/utils/sounds/sirensound.mp3` is bundled. A network failure means a silent alert.
2. **Browser autoplay policy blocks `new Audio().play()`** until the user has interacted with the page, so
   the **first alert of a session can be silent**.

**The fix for both:** use the bundled file, and create + prime the `Audio` element on a user gesture at login
so the audio context is unlocked before any alert fires.

**Verify in a fresh incognito window**, not a tab you have been clicking in — that is the only way to
reproduce the real-world case. A tab you have interacted with will always play, which is why this bug
survives casual testing.

## Gotchas

- `AuthContext` gates routing, so a change to how status is derived changes which screen a merchant lands on
  after login. Walk all of M1 in [../../VERIFY.md](../../../VERIFY.md) after touching it.
- There is no server-data cache; two screens showing the same order each fetch it.
