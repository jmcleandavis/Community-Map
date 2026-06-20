# MapView Selection State

Three overlapping selection-related variables control marker appearance in `MapView.jsx`.

## Variables

| Variable | Type | Source | Reactive? |
|----------|------|--------|-----------|
| `selectedSaleIds` | `string[]` | `localStorage` via `useMemo(fn, [])` | No — frozen at mount |
| `selectedSales` | `Set<string>` | `SelectionContext` | Yes — updates on every toggle |
| `showOnlySelected` | `boolean` | `DisplayContext` | Yes — updates on filter toggle |
| `markersVersion` | `number` | `useState(0)` | Yes — incremented after `createMarkers` |

## Why selectedSaleIds is frozen

Empty `useMemo` dep array prevents `createMarkers` from re-running on every selection toggle, which would close any open InfoWindow.

## Which effect handles what

| Concern | Mechanism | Deps |
|---------|-----------|------|
| Marker creation + initial colors | `createMarkers` | `[garageSales, selectedSaleIds, cleanupMarkers, showOptimizedRoute, optimizedRouteData, setMarkersVersion]` |
| Live color + visibility updates | visibility `useEffect` | `[selectedSales, showOnlySelected, markersVersion]` |

## showOnlySelected filter

`createMarkers` always creates markers for ALL garage sales — it does NOT filter by `showOnlySelected`. Visibility in filtered mode is handled entirely by the visibility `useEffect`, which sets `el.style.display = 'none'` on non-selected markers.

This separation prevents CSE-134: when `createMarkers` ran on `showOnlySelected` changes, the frozen `selectedSaleIds` returned 0 matches and wiped all markers from the DOM.

See [InfoWindow](./integrations/infowindow.md) — markerElementsRef pattern.
See [MapView Auth Selections](./map-view-auth.md) — markersVersion and auth lifecycle.
