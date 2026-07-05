# Apply Progress: fix-ir-a-pagar-button

## Status

Phase 1 implementation complete.

## Completed Tasks

- [x] 1.1 In `middlewares/csrf.js` line 57, change `req.headers['x-csrf-token']` to `req.headers['csrf-token']` so the middleware reads the header Node.js actually produces from the frontend's `CSRF-Token` header.
- [x] 1.2 In `public/javascripts/deudas.js` inside `generarTicket()`, add `'CSRF-Token': getCsrfToken()` to the fetch `headers` object for the `POST /generar-ticket` request.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `middlewares/csrf.js` | Modified | `req.headers['x-csrf-token']` → `req.headers['csrf-token']` in `getTokenFromRequest` |
| `public/javascripts/deudas.js` | Modified | Added `'CSRF-Token': getCsrfToken()` to `generarTicket()` fetch headers |
| `openspec/changes/fix-ir-a-pagar-button/tasks.md` | Modified | Marked tasks 1.1 and 1.2 complete |

## Verification Notes

- Confirmed no remaining `x-csrf-token` references in runtime `.js` files.
- Staging verification tasks 2.1-2.4 require a running server with `SECURITY_CSRF_ENABLED=true` and must be executed after deploy.

## Deviations from Design

None — implementation matches design.

## Issues Found

None.

## Workload / PR Boundary

- Mode: single PR (under 10-line budget)
- Chain strategy: stacked-to-main
