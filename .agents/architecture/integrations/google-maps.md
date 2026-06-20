# Google Maps JavaScript API Integration

`@react-google-maps/api` wraps the Google Maps JS SDK. `LoadScript` in `App.jsx`; `<GoogleMap>` and all controls in `MapView.jsx`.

## Compact vs desktop layout (isCompactView)

`isCompactView = width < 1045` (`useWindowSize` in `MapView.jsx`).

| Breakpoint | Toggle position | UI mode |
|---|---|---|
| ≥ 1045px | `TOP_RIGHT` (default) | Full UI |
| < 1045px | `LEFT_BOTTOM` (set in `onLoad`) | `disableDefaultUI: true` + map type re-enabled |

Use `map.setOptions(...)` in `onLoad`, not `<GoogleMap options>` — constructor ignores `mapTypeControlOptions.position` with `disableDefaultUI: true`.

## Z-index: you cannot fix it from inside `.gm-style`

`.gm-style` creates its own stacking context. Any app element with `z-index ≥ 1` paints above everything inside it, regardless of child z-indexes.

| Element | z-index | File |
|---|---|---|
| Hamburger menu | 1000 | `HamburgerMenu.css` |
| Community title | 1 (inline) | `MapView.jsx` `titleStyle` |
| `.gm-style-mtc`, children | 1001 `!important` | `App.css` — harmless, does not escape `.gm-style` context |

Raising z-index on map controls has no effect when an app overlay has any positive z-index. Fix: reposition the overlay or hide controls until clear.

## AdvancedMarkerElement: `display` override

Forces `display: block` on its `content` element at mount — inline `display: flex` is overridden, flex centering breaks. Center children with `position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%)` (parent needs `position: relative`).

## Mobile toggle: intentional hide-until-loaded

`map-type-hidden` class on `.map-container` hides `.gm-style-mtc-bbw` until `isLoaded = true`:

```css
.map-type-hidden .gm-style-mtc-bbw { visibility: hidden !important; }
```

Without it, the toggle flashes at top-left before `onLoad` repositions it. The brief invisible period is **intentional**.
