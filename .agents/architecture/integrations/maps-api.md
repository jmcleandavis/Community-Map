# Maps Management API

Backend service owning sale records. Cloud Run host: `br-maps-mgt-api-dev001` (dev).

## Client setup

Axios instance `mapsApi` in `client/src/utils/api.js`. Base URL: `VITE_MAPS_API_URL`, falling back to `/maps-api`. Dev proxy in `vite.config.js` rewrites `/maps-api/*` to Cloud Run (real backend). All requests need `sessionId` + `app-key` + `app-name` headers.

## PATCH /v1/updateAddress/{id}

Accepts same field names as create: `address`, `description`, `highlightedItems`, `paymentTypes`, `socialAndWeb`, `dateTime`. Partial and full payloads accepted. `GarageSalesAdmin.jsx` diffs the form against the loaded sale and only sends changed fields; no-op saves skip the call.

## PATCH /v1/communitySales/update/{id}

Same merge semantics: omitted keys keep previous value. To clear a field, send `null` — do not omit:

```js
// ✅ clears removed URLs
socialAndWeb: { fb: val || null, instagram: val || null, website: val || null }
// ❌ omitting keeps old value
```

> **Open (CSE-119)**: Does `{ fb: null }` delete the key or store `null`?

## POST /v1/createAddress

Creates a sale in a community. `community` field values:
- **UUID** — a neighbourhood event (admin-managed)
- **`GENPUB`** — standalone individual sale (public `/register-garage-sale`); not part of any event; find user's sale by matching `userId`

**Duplicate detection (community-scoped):** same address in same community → `HTTP 400 { code: "ERR_MAPS001", errorMsg: "Existing Address" }`. `api.js` converts this to `new Error('A garage sale already exists at this address')`, which both forms display. Same address is allowed in different communities.

**Status (CSE-125/CSE-128):** Backend currently accepts duplicates silently. Frontend mitigation (2026-06-17): `GarageSalesAdmin.jsx` pre-checks the loaded sales list before the API call; `RegisterGarageSale.jsx` fixed a nested try-catch that swallowed the specific error. Jamie to add community+address unique constraint returning ERR_MAPS001.
