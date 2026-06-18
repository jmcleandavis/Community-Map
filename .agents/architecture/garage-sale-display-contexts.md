# Garage Sale Display Contexts

Five contexts render garage sale data. Each shows a different subset of fields.

## Field Matrix

| Field | Card | Detail Modal | Detail View | Admin | Map InfoWindow |
|---|---|---|---|---|---|
| Address | ✅ truncated | ✅ full | ✅ full | ✅ | ✅ full |
| Name | ✅ | ✅ subtitle | ✅ | ✅ | ❌ |
| Description | ✅ truncated | ✅ full | ✅ full | ✅ | ✅ full |
| Highlighted Items | ✅ truncated | ✅ full | ✅ full | ✅ | ❌ |
| Images | ✅ 80×80 | ✅ 200×200 lightbox | ✅ 80×80 | ✅ 60×60 | ❌ |
| Payment Types | ✅ | ✅ | ✅ | ✅ | ❌ |
| Social/Web Links | ✅ icons | ✅ icons | ✅ icons | ❌ | ❌ |
| Edit / Delete | ❌ | ❌ | ❌ | ✅ | ❌ |
| Start/End Times | ❌ | ❌ | ✅ | ❌ | ❌ |
| Select (auth-gated) | ✅ | ✅ | ✅ | ❌ | ✅ closes window |

## Rule

New fields: update **all five contexts** unless deliberate. Map InfoWindow is minimal (address, description, selection). Most likely to miss: card and modal.

## Interaction Model (Public Listing Page)

- **Checkbox (top-left)**: toggles selection — auth required
- **Card body**: opens detail modal — public

## Interaction Model (Map InfoWindow)

- **Pin click**: opens InfoWindow
- **Select**: toggles and closes window ("done, next pin")
- **Navigate here**: opens directions in new tab; window stays open
- Unauthenticated: checkbox hidden, no modal

## Image Display

Images render only when `sale.images?.length > 0` — no empty placeholder. Captions (`img.description`) render below each thumbnail when present.

In the **detail modal**, thumbnails are clickable: clicking opens a lightbox (`Dialog`, `zIndex: modal + 1`) at up to `90vw × 80vh`. Multi-image sales show prev/next arrows with wraparound. Closing (X, Esc, or outside click) leaves the card modal open.

## Detail Modal Sizing

`maxWidth="lg" fullWidth`, `minHeight: '70vh'` (via `PaperProps`). Typography uses CSS `clamp()` for fluid scaling: address `clamp(1.25rem, 3vw, 2.125rem)`, headers/subtitle `clamp(0.875rem, 1.8vw, 1.25rem)`, body `clamp(0.8rem, 1.5vw, 1rem)`.
