# InfoWindow: Auth-Gating and Selection

`<InfoWindow position={lat/lng}>` — positioned by coordinates, not a marker anchor. Survives marker recreation.

## Auth-gating

Show Select checkbox only when `isAuthenticated`; hide silently — no `LoginRequiredModal` from the InfoWindow.

`onChange` snapshots `selectedSales` (avoids async-setState race), computes the toggle, calls `handleCheckboxChange(id)` (local/localStorage) + `api.createUpdateUserAddressList` (server sync), then `setSelectedSale(null)`.

## Placing Select on the same line as the native × button

The × button lives in `.gm-style-iw-c` outside the scrollable content div. CSS `!important` on padding-top loses to Google's inline style — JS wins.

**Pattern** (`MapView.jsx`): `useEffect([selectedSale, isAuthenticated])` with a 50ms `setTimeout` injects Select `<label>` into `.gm-style-iw-c` as a DOM sibling to the ×, and clears inline `paddingTop` via JS. Cleanup removes the element and cancels the timer.

`selectedSales`/`handleCheckboxChange` excluded from deps — snapshotted in the handler; no selection changes possible while InfoWindow is open.

**CSS** (`.info-window-portal-select`): `position: absolute; top: Npx; left: Npx`. Adjust to reposition.

**Content offset**: InfoWindow content gets `paddingTop: '30px'` when `isAuthenticated` so address clears the Select/× row.

## markerElementsRef: prevent InfoWindow close on selection toggle

Without this, selection toggle → `selectedSaleIds` change → `createMarkers` re-runs → all markers recreated → InfoWindow closes.

**Fix**: store each `pinElement` DOM div in `markerElementsRef` (`useRef(new Map())`) keyed by `sale.id`. A separate `useEffect([selectedSales])` updates `.style.backgroundColor` directly — no marker recreation, no InfoWindow close.

`selectedSaleIds` (used by `createMarkers` for initial colors) has an empty `useMemo` dep array intentionally, to prevent triggering `createMarkers` on every toggle.
