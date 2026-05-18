# Maps Management API

Backend service that owns garage sale and community sale records. Hosted on Cloud Run (`br-maps-mgt-api-dev001` for dev).

## How the client talks to it

- Axios instance: `mapsApi` in `client/src/utils/api.js`. Base URL comes from `VITE_MAPS_API_URL`, falling back to `/maps-api` in dev.
- Dev proxy: `vite.config.js` rewrites `/maps-api/*` to the Cloud Run dev host, so `npm run dev` exercises the real dev backend (no mocks).
- All requests must carry a `sessionId` header (fetched via `getSessionId()`) plus the `app-key` and `app-name` headers configured on the axios instance.

## Update payloads

`PATCH /v1/updateAddress/{id}` accepts the same field names as the create endpoint: `address`, `description`, `highlightedItems`, `paymentTypes`, `socialAndWeb`, `dateTime`, etc. Both partial and full payloads are accepted.

`GarageSalesAdmin.jsx` builds the PATCH body by diffing the form against the loaded sale and only sending fields the user changed. This is preferred — it keeps payloads small and skips the API call entirely on a no-op save — but the backend will accept full payloads too.

## Community Sales update payloads

`PATCH /v1/communitySales/update/{id}` has the same merge semantics: omitted keys keep their previous value. To clear a field, send `null` explicitly — do not omit the key:

```js
// ✅ clears removed URLs
socialAndWeb: { fb: submissionData.fb || null, instagram: submissionData.instagram || null, website: submissionData.website || null }

// ❌ omitting the key leaves the old value in the DB
socialAndWeb: { ...(submissionData.fb ? { fb: submissionData.fb } : {}) }
```

> **Open (CSE-119)**: Confirm with backend dev whether `{ fb: null }` deletes the key or stores `null` (the latter would require a backend cleanup step too).
