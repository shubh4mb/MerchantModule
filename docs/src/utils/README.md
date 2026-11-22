# src/utils/

| File | What |
|---|---|
| `axiosInstance.ts` | the shared axios instance: base URL, JWT interceptor, error normalisation |
| `socket.ts` | the socket.io client — see [../sockets/README.md](../sockets/README.md) |
| `dateUtils.ts` | date formatting for display |
| `price.ts` | price formatting and arithmetic helpers |
| `colors.ts` | the colour name/hex map used by variant pickers |
| `productTypes.ts` | shared product/variant types |
| `skuUtils.ts` | SKU generation and parsing |
| `imageCompressor.ts` | client-side compression before upload |
| `imageDownloader.ts` | downloading product images |
| `sounds/sirensound.mp3` | **the bundled order alert sound** |

## Gotchas

- **`sounds/sirensound.mp3` is bundled but unused** — `context/NotificationContext.tsx` fetches a sound from
  a remote CDN instead. Switching to this file is part of the alert fix
  ([../context/README.md](../context/README.md)).
- **`price.ts` formats; it does not decide.** Amounts come from the server as integer rupees. Nothing here
  should compute a payout, commission or order total.
- **`dateUtils.ts` is for display only.** Period boundaries are the server's job — the business runs on IST
  and the server owns that arithmetic. Do not compute "this week" here.
- `imageCompressor.ts` runs before upload; Cloudinary also transforms server-side, so check whether the
  compression is still needed before adding more of it.
