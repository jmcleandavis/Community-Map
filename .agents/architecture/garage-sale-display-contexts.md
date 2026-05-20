# Garage Sale Display Contexts

Four contexts render garage sale data. Each shows a different subset of fields.

## Field Matrix

| Field | Public Listing Card (`GarageSales.jsx`) | Detail Modal (`GarageSales.jsx` Dialog) | Detail View (`SingleGarageSales.jsx`) | Admin Card (`GarageSalesAdmin.jsx`) |
|---|---|---|---|---|
| Address | ✅ truncated | ✅ full | ✅ full | ✅ |
| Name | ✅ | ✅ (subtitle) | ✅ | ✅ |
| Description | ✅ truncated | ✅ full | ✅ full | ✅ |
| Highlighted Items | ✅ truncated | ✅ full | ✅ full | ✅ |
| Images | ✅ 80×80, with captions | ✅ 200×200 thumbnails, clickable → lightbox | ✅ 80×80, with captions | ✅ 60×60, no captions |
| Payment Types | ✅ | ✅ | ✅ | ✅ |
| Social/Web Links | ✅ (icon buttons) | ✅ (icon buttons) | ✅ (icon buttons) | ❌ |
| Edit / Delete buttons | ❌ | ❌ | ❌ | ✅ |
| Start/End Times | ❌ | ❌ | ✅ | ❌ |

## Rule

New fields: update **all four contexts** unless deliberately excluded. Public listing card and modal are most likely to be missed — verify both.

## Interaction Model (Public Listing Page)

Two click zones on `/sales` cards:
- **Checkbox (top-left)**: toggles selection — requires auth
- **Card body**: opens detail modal — public, no auth required

## Image Display

Images render only when `sale.images?.length > 0` — no empty placeholder. Captions (`img.description`) render below each thumbnail when present.

In the **detail modal**, thumbnails are clickable: clicking opens a lightbox (`Dialog`, `zIndex: modal + 1`) at up to `90vw × 80vh`. Multi-image sales show prev/next arrows with wraparound. Closing (X, Esc, or outside click) leaves the card modal open.

## Detail Modal Sizing

`maxWidth="lg" fullWidth`, `minHeight: '70vh'` (via `PaperProps`). Typography uses CSS `clamp()` for fluid scaling: address `clamp(1.25rem, 3vw, 2.125rem)`, headers/subtitle `clamp(0.875rem, 1.8vw, 1.25rem)`, body `clamp(0.8rem, 1.5vw, 1rem)`.
