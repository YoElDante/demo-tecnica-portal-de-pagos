# Design: Fix CSRF header mismatch — "Ir a Pagar" button

## Technical Approach

Three-file surgical fix: (1) aligning the CSRF middleware with Node.js header-lowercasing behavior, (2) ensuring `/generar-ticket` sends the CSRF token, and (3) extracting `getCsrfToken()` to a shared helper module to remove the implicit cross-script dependency between `index.js` and `deudas.js`. No new routes or dependencies.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Fix middleware to read `csrf-token` instead of `x-csrf-token` | Spec already defines `CSRF-Token`; `X-` prefix deprecated by RFC 6648 | **Chosen**: align implementation with spec |
| Fix frontend to send `x-csrf-token` instead | Contradicts the spec (`csrf-protection`) | Rejected |
| Add both headers as fallback | Adds dead code; no standard requires `x-` prefix | Rejected |

## Data Flow

```
Frontend (index.js / deudas.js)
  fetch() headers: { 'CSRF-Token': getCsrfToken() }
         │
         ▼  Node.js lowercases → req.headers['csrf-token']
         │
  csrf.js middleware (getTokenFromRequest)
    reads req.headers['csrf-token']  ← WAS 'x-csrf-token' (BUG)
         │
         ▼
  validateRequest(req) → 200 or 403
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `middlewares/csrf.js` line 57 | Modify | `req.headers['x-csrf-token']` → `req.headers['csrf-token']` |
| `public/javascripts/deudas.js` line 251 | Modify | Add `'CSRF-Token': getCsrfToken()` to `generarTicket()` fetch headers |
| `public/javascripts/csrf-helper.js` | Create | Extracted `getCsrfToken()` from `index.js` into a shared module |
| `public/javascripts/index.js` lines 79-85 | Modify | Removed `getCsrfToken()` (extracted to `csrf-helper.js`) |
| `views/index.ejs` line 35 | Modify | Added `<script src="/javascripts/csrf-helper.js" defer>` before dependent scripts |
| **No deleted files** | — | — |

## Interfaces / Contracts

No change to API contracts. The CSRF token format, cookie name (`csrf-token`), and injection mechanism (`res.locals.csrfToken` → hidden `<input>`) are unchanged. The only fix is the header key used for lookup.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual (staging) | "Ir a Pagar" redirects to gateway with `SECURITY_CSRF_ENABLED=true` | Click button, verify redirect |
| Manual (staging) | `/generar-ticket` returns 200 with valid CSRF header | POST with header, verify ticket HTML |
| Manual (staging) | POST without CSRF returns 403 | Omit header, verify rejection |
| Regression | Dev mode unchanged (`SECURITY_CSRF_ENABLED=false`) | Existing flow continues working |

## Migration / Rollout

No migration required. Rollback: revert the two-line change. Both changes are in-process only — no DB schema or data migration.

## Open Questions

- [ ] Audit remaining client-side POST endpoints for missing CSRF headers (follow-up, not blocking)
