## Exploration: fix-ir-a-pagar-button — "Ir a Pagar" button unresponsive

### Current State

The "Ir a Pagar" button appears in `views/index.ejs` in two positions: a top button (line 271, always visible when deudas are present) and a bottom button (line 286, inside `#ticket-actions-bottom`, shown after ticket generation). Both call `onclick="iniciarPago()"`.

The `iniciarPago()` function lives in `public/javascripts/index.js` (line 164). It:
1. Reads selected debt concept IDs from checkboxes
2. Reads the total amount from the `#total-final` element
3. Reads `contribuyenteData` (loaded asynchronously)
4. Disables the buttons and shows a loading state
5. Makes a **POST fetch to `/pago/iniciar`** with JSON body and a `CSRF-Token` header
6. On success, redirects to `data.redirect_url`

The backend route `POST /pago/iniciar` is implemented in `controllers/payment.controller.js` (line 214), mounted via `routes/payment.routes.js` at `['/pago', '/pagos']`. The controller creates a ticket in the database, calls the payment gateway to create a payment, and returns `{ success: true, redirect_url: resultado.payment_url }`.

### Root Cause Analysis

**Primary cause: CSRF header name mismatch between frontend and backend.**

| Layer | Header name sent/expected | After Node.js lowercasing |
|-------|--------------------------|---------------------------|
| **Frontend** (`index.js:206`) | Sends `'CSRF-Token': <value>` | `req.headers['csrf-token']` |
| **Backend** (`csrf.js:57`) | Checks `req.headers['x-csrf-token']` | `req.headers['x-csrf-token']` |

Node.js/Express automatically lowercases all HTTP header names in `req.headers`. The frontend sends `CSRF-Token` (as specified in `openspec/specs/csrf-protection/spec.md`, acceptance criterion #6), which becomes `req.headers['csrf-token']`. But the middleware's `getTokenFromRequest` checks `req.headers['x-csrf-token']` — a **different header name**.

The fallback check for `req.body._csrf` also fails because the request body is JSON with payment data and does not include a `_csrf` field.

**Environment-dependent impact:**

| Environment | `SECURITY_CSRF_ENABLED` | Behavior |
|------------|------------------------|----------|
| **Production** (`NODE_ENV=production`, no `SECURITY_CSRF_ENABLED` set) | `true` (default) | CSRF validation fails → 403 response → frontend shows alert, no redirect |
| **Development** (no `NODE_ENV`, no `SECURITY_CSRF_ENABLED`) | `false` | CSRF skipped → button works normally |

The OpenSpec spec (`openspec/specs/csrf-protection/spec.md`) correctly specifies `CSRF-Token` as the header name. The implementation has a bug: it should read `req.headers['csrf-token']` instead of `req.headers['x-csrf-token']`.

**Secondary issue: missing CSRF on `/generar-ticket` endpoint** — the `generarTicket()` function in `deudas.js` (line 247) sends a POST to `/generar-ticket` with **no CSRF token at all**. In production, ticket generation would also fail with a 403.

### Files Investigated

| File | Key Findings |
|------|-------------|
| `public/javascripts/index.js` | `iniciarPago()` (line 164) sends `CSRF-Token` header (line 206). `getCsrfToken()` (line 82) reads from `input[name="_csrf"]`. Async `contribuyenteData` fetch (line 26) also uses `CSRF-Token` header but is a GET (CSRF-exempt). |
| `views/index.ejs` | Two "Ir a Pagar" buttons (lines 271, 286) with `onclick="iniciarPago()"`. Only one `input[name="_csrf"]` in the search form (line 116). |
| `middlewares/csrf.js` | `getTokenFromRequest` (line 55-66) checks `req.headers['x-csrf-token']`, then `req.body._csrf`, then `req.query._csrf`. **Does NOT check `csrf-token` (without X- prefix).** |
| `middlewares/helmet.config.js` | CSP allows `'unsafe-inline'` in scriptSrc, so inline `onclick` handlers work. `connect-src` includes `'self'` (same-origin fetch OK). No CSP-related blocking. |
| `routes/payment.routes.js` | Route `POST /iniciar` mounted at `['/pago', '/pagos']`. Matches frontend fetch to `/pago/iniciar`. |
| `controllers/payment.controller.js` | `iniciarPago` (line 214) creates ticket, calls gateway, returns `{ success, redirect_url }`. Logic looks correct. |
| `public/javascripts/deudas.js` | `generarTicket()` (line 223) sends POST to `/generar-ticket` with **no CSRF token**. |
| `routes/index.js` | `POST /generar-ticket` route (line 64). |
| `controllers/web.controller.js` | `buscarPorDni` (line 65) sets `contribuyenteDataInline` when `COOKIE_SECRET` is not configured. |
| `controllers/web.ticket.controller.js` | `generarTicket` renders partial and returns HTML. No CSRF-related logic. |
| `app.js` | Middleware order: Helmet → body parsers → sanitization → cookieParser → **CSRF** → static → logger → routes. Correct order. |
| `openspec/specs/csrf-protection/spec.md` | Spec says header should be `CSRF-Token` (lines 77, 81). Acceptance criterion #6 confirms. Implementation does not match spec. |

### Approaches

1. **Fix the header name in `csrf.js` (recommended)** — Change `req.headers['x-csrf-token']` to `req.headers['csrf-token']` in the middleware's `getTokenFromRequest`.
   - Pros: Minimal change (2 lines), fixes the root cause exactly where it lives, matches the spec
   - Cons: None
   - Effort: Low

2. **Fix the frontend to send `x-csrf-token` instead** — Change `'CSRF-Token'` to `'X-CSRF-Token'` in `index.js` lines 28 and 206.
   - Pros: Also minimal
   - Cons: Contradicts the spec (spec says `CSRF-Token`), the `X-` prefix convention is deprecated
   - Effort: Low

3. **Send token in request body instead of header** — Add `_csrf: getCsrfToken()` to the JSON body sent to `/pago/iniciar`.
   - Pros: Works with the body fallback in `getTokenFromRequest`
   - Cons: Changes the POST body contract, the header approach is cleaner for AJAX/JSON APIs
   - Effort: Low

4. **Also fix `/generar-ticket` to include CSRF** — Add `'CSRF-Token': getCsrfToken()` header to the fetch in `deudas.js` line 247-251.
   - Pros: Fixes a parallel CSRF issue
   - Cons: Additional change beyond the immediate bug
   - Effort: Low

### Recommendation

**Approach #1 + #4**: Fix `middlewares/csrf.js` to check `req.headers['csrf-token']` instead of `req.headers['x-csrf-token']` (line 57-58). This aligns the implementation with the spec and fixes the "Ir a Pagar" button in production.

Additionally, fix `public/javascripts/deudas.js` to include the CSRF token in the `/generar-ticket` POST fetch to prevent the same issue when CSRF is enabled.

The token is already correctly injected via `res.locals.csrfToken` into the EJS template as `<input name="_csrf" value="<%= csrfToken %>">`, and `getCsrfToken()` correctly reads it from the DOM. The only gap is the middleware reading the wrong header name.

### Risks

- In development environments (where `SECURITY_CSRF_ENABLED` defaults to `false`), this bug does not manifest. Developers may not catch the issue locally.
- The `/generar-ticket` endpoint also lacks CSRF protection in production — a secondary issue that needs fixing.
- No tests cover the CSRF validation flow. No automated regression detection for this class of bug.

### Ready for Proposal

Yes. The root cause is identified with high confidence — a two-character fix in `middlewares/csrf.js` (lines 57-58) to remove the `x-` prefix from the header name lookup. The exploration is complete and ready for proposal and spec/design phases.
