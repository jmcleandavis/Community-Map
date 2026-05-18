# Garage Sale Display Contexts

Four contexts render garage sale data. Each shows a different subset of fields.

## Field Matrix

| Field | Public Listing Card (`GarageSales.jsx`) | Detail Modal (`GarageSales.jsx` Dialog) | Detail View (`SingleGarageSales.jsx`) | Admin Card (`GarageSalesAdmin.jsx`) |
|---|---|---|---|---|
| Address | ✅ truncated | ✅ full | ✅ full | ✅ |
| Name | ✅ | ✅ (subtitle) | ✅ | ✅ |
| Description | ✅ truncated | ✅ full | ✅ full | ✅ |
| Highlighted Items | ✅ truncated | ✅ full | ✅ full | ✅ |
| Images | ✅ 80×80, with captions | ✅ 200×200, with captions | ✅ 80×80, with captions | ✅ 60×60, no captions |
| Payment Types | ✅ | ✅ | ✅ | ✅ |
| Social/Web Links | ✅ (icon buttons) | ✅ (icon buttons) | ✅ (icon buttons) | ❌ |
| Edit / Delete buttons | ❌ | ❌ | ❌ | ✅ |
| Start/End Times | ❌ | ❌ | ✅ | ❌ |

## Rule

When adding a new field to the garage sale data model, update **all four contexts** unless there is a deliberate reason to exclude one. The public listing card and modal are the most likely to be missed — verify both explicitly.

## Interaction Model (Public Listing Page)

On the `/sales` page, the card has two distinct click zones:
- **Checkbox (top-left corner)**: toggles selection — requires authentication
- **Card body (everywhere else)**: opens the detail modal — no authentication required

Viewing details is public. Selecting sales (for route planning) requires login.

## Image Display

Images render only when `sale.images?.length > 0`. The section is entirely absent for sales with no images (no empty placeholder). Captions (`img.description`) render below the thumbnail when present.

## Detail Modal Sizing

`maxWidth="lg" fullWidth`, `minHeight: '70vh'` (via `PaperProps`). Typography uses CSS `clamp()` for fluid scaling: address `clamp(1.25rem, 3vw, 2.125rem)`, headers/subtitle `clamp(0.875rem, 1.8vw, 1.25rem)`, body `clamp(0.8rem, 1.5vw, 1rem)`.
