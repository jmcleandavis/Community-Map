# MapView Selection State

Three overlapping selection-related variables control marker appearance in `MapView.jsx`.

## Variables

| Variable | Type | Source | Reactive? |
|----------|------|--------|-----------|
| `selectedSaleIds` | `string[]` | `localStorage` via `useMemo(fn, [])` | No — frozen at mount |
| `selectedSales` | `Set<string>` | `SelectionContext` | Yes — updates on every toggle |
| `showOnlySelected` | `boolean` | `DisplayContext` | Yes — updates on filter toggle |

## Why selectedSaleIds is frozen

`selectedSaleIds` intentionally has an empty `useMemo` dep array so it never changes after mount. If it were reactive, `createMarkers` (which depends on it) would re-run on every selection toggle — recreating all markers and closing any open InfoWindow.

## Which effect handles what

| Concern | Mechanism | Deps |
|---------|-----------|------|
| Marker creation and initial colors | `createMarkers` callback | `[garageSales, selectedSaleIds, showOnlySelected, ...]` |
| Live color updates (green/red) | `useEffect` on `markerElementsRef` | `[selectedSales, showOnlySelected]` |
| Marker visibility in filtered mode | Same `useEffect` as above | `[selectedSales, showOnlySelected]` |

## showOnlySelected filter

`createMarkers` filters `salesToShow` by `selectedSaleIds` when `showOnlySelected` is true — this covers initial render and data-load.

After mount, if the user deselects a sale, `selectedSaleIds` doesn't update (frozen), so `createMarkers` won't re-run. The color/visibility `useEffect` compensates: it sets `el.style.display = 'none'` on deselected markers immediately, and restores all markers when the filter is toggled off.

See [InfoWindow](./integrations/infowindow.md) for the full markerElementsRef pattern.
