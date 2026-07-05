# Tasks: Fix CSRF Header Mismatch — "Ir a Pagar" Button

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Changed files | 2 |
| Estimated changed lines | <10 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | force-chained (not needed — under budget) |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

## Phase 1: Implementation

- [x] 1.1 In `middlewares/csrf.js` line 57, change `req.headers['x-csrf-token']` to `req.headers['csrf-token']` so the middleware reads the header Node.js actually produces from the frontend's `CSRF-Token` header.
- [x] 1.2 In `public/javascripts/deudas.js` inside `generarTicket()`, add `'CSRF-Token': getCsrfToken()` to the fetch `headers` object for the `POST /generar-ticket` request.

## Phase 2: Verification

- [ ] 2.1 Start dev server with `SECURITY_CSRF_ENABLED=true`. Click "Ir a Pagar" — verify redirect to payment gateway (spec scenario: fetch POST with CSRF header accepted).
- [ ] 2.2 With `SECURITY_CSRF_ENABLED=true`, trigger `/generar-ticket` — verify 200 response with ticket HTML (spec scenario: POST /generar-ticket with CSRF accepted).
- [ ] 2.3 With `SECURITY_CSRF_ENABLED=true`, send `POST /pago/iniciar` without CSRF header — verify 403 response (spec scenario: POST without CSRF rejected).
- [ ] 2.4 Restart with `SECURITY_CSRF_ENABLED=false` (default dev) — verify both flows still work without CSRF checks (regression).
