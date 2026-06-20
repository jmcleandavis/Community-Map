# MapView Auth & Selection Lifecycle

How `MapView.jsx` handles server-fetched selections across login/logout cycles.

## markersVersion pattern

**Problem**: `createMarkers` colors markers from `selectedSaleIds` (frozen at `[]`). If the server fetch populates `selectedSales` before `createMarkers` runs, the color-update effect has already fired against an empty `markerElementsRef` — so no markers turn green. `selectedSales` hasn't changed again, so the effect won't re-fire.

**Solution**: `createMarkers` increments `markersVersion` at the end of each run. The color-update effect lists `markersVersion` as a dep, forcing it to re-apply green/red after every marker recreation — without re-creating markers on each selection toggle.

```js
setMarkersVersion(v => v + 1);  // at end of createMarkers
}, [selectedSales, showOnlySelected, markersVersion]);  // color-update effect
```

## Auth lifecycle for selections

Server selections are **per-community** — one list per user per `communityId`.

| Stage | What happens |
|-------|-------------|
| Login | `MapView` calls `api.getUserAddressList(userId)`. Returns IDs for all communities; `useUserAddressList` filters by current `communityId` client-side. |
| Active session | Selection changes persist via `api.createUpdateUserAddressList(userId, ids, communityId)`. |
| Logout | Logout handler removes `selectedSaleIds` from `localStorage`. |
| Re-login | Full page reload; server fetch re-runs, restoring green markers. |

## userSelectionsLoadedRef

Prevents the server fetch from running twice within one mount. Resets to `false` when `isAuthenticated` becomes `false`, so re-login always triggers a fresh fetch — even if the `window.location.reload()` on logout is removed in future.
