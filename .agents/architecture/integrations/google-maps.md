# Google Maps JavaScript API Integration

`@react-google-maps/api` wraps the Google Maps JS SDK. `LoadScript` in `App.jsx`; `<GoogleMap>` and all controls in `MapView.jsx`.

## Compact vs desktop layout (isCompactView)

`isCompactView = width < 1045` (`useWindowSize` in `MapView.jsx`).

| Breakpoint | Toggle position | UI mode |
|---|---|---|
| ≥ 1045px | `TOP_RIGHT` (default) | Full UI |
| < 1045px | `LEFT_BOTTOM` (set in `onLoad`) | `disableDefaultUI: true` + map type re-enabled |

Use `map.setOptions(...)` in `onLoad` to reposition controls — **not** the `<GoogleMap options>` prop. Google Maps ignores `mapTypeControlOptions.position` when set via the constructor with `disableDefaultUI: true`.

## Z-index: you cannot fix it from inside `.gm-style`

`.gm-style` creates its own CSS stacking context. Any app element outside `.gm-style` with `z-index ≥ 1` paints above everything inside `.gm-style`, regardless of child z-indexes.

| Element | z-index | File |
|---|---|---|
| Hamburger menu | 1000 | `HamburgerMenu.css` |
| Community title | 1 (inline) | `MapView.jsx` `titleStyle` |
| `.gm-style-mtc`, children | 1001 `!important` | `App.css` — harmless, does not escape `.gm-style` context |

Raising z-index on map controls has no effect when an app overlay has any positive z-index. Fix: reposition the overlay, or hide controls until they've moved out of the overlap zone.

## Mobile toggle: intentional hide-until-loaded

`map-type-hidden` class on `.map-container` hides `.gm-style-mtc-bbw` until `isLoaded = true`:

```css
.map-type-hidden .gm-style-mtc-bbw { visibility: hidden !important; }
```

Before `onLoad`, the toggle appears at its default top-left position, overlapping the title. Once `onLoad` repositions it to `LEFT_BOTTOM` and sets `isLoaded(true)`, the class is removed. The brief invisible period is **intentional**.
