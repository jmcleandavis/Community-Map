# Maps Management API

Backend service that owns garage sale and community sale records. Hosted on Cloud Run (`br-maps-mgt-api-dev001` for dev). The client talks to it via the `mapsApi` axios instance in `client/src/utils/api.js`, which is proxied through `/maps-api` by `vite.config.js` in development.

## Update payloads — only send changed fields

`PATCH /v1/updateAddress/{id}` enforces a server-side allow-list and rejects unknown fields with HTTP 400:

```
Invalid fields detected: <fieldA>, <fieldB>. These fields cannot be updated
```

Currently rejected on update (but accepted on create): `paymentTypes`, `socialAndWeb`.

The client must build update payloads by **diffing the form against the loaded sale** and only including keys the user actually changed. Sending the full create-shaped object on every save will trip the allow-list whenever the form holds a value the backend doesn't recognize for updates.

## Where this matters

- `GarageSalesAdmin.jsx` (`handleSubmit`, edit branch) — diffs each field against `editingSale` and skips the API call entirely if nothing changed.
- `RegisterGarageSale.jsx` (`handleSubmit`, edit branch) — strips `socialAndWeb` from the shared `saleData` payload unless its sub-keys differ from `existingSale.socialAndWeb`.

## What to watch out for

- Do **not** revert to "send the full payload on every update." That assumption (introduced in commit `0384fcf` and reverted in CSE-112) is wrong for this backend.
- When adding a new field to a sale, verify the backend's update allow-list permits it before wiring it into the PATCH payload. If it doesn't, either guard it with a change-detection diff or file a backend ticket to expand the allow-list before shipping the client field.
- The error message normalizes casing (`socialAndWeb` is reported as `SocialandWeb`). The client must still send the correct camelCase key — the casing in the error is cosmetic.
