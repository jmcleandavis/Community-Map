# Garage Sale Display Contexts

Three components render garage sale data. Each shows a different subset of fields.

## Field Matrix

| Field | Public Listing Card (`GarageSales.jsx`) | Detail View (`SingleGarageSales.jsx`) | Admin Card (`GarageSalesAdmin.jsx`) |
|---|---|---|---|
| Address | ✅ | ✅ | ✅ |
| Description | ✅ | ✅ | ✅ |
| Highlighted Items | ✅ | ✅ | ✅ |
| Images | ✅ 80×80, with captions | ✅ 80×80, with captions | ✅ 60×60, no captions |
| Payment Types | ✅ | ✅ | ✅ |
| Social/Web Links | ✅ (icon buttons) | ✅ (icon buttons) | ❌ |
| Edit / Delete buttons | ❌ | ❌ | ✅ |
| Start/End Times | ❌ | ✅ | ❌ |

## Rule

When adding a new field to the garage sale data model, update **all three components** unless there is a deliberate reason to exclude one. The public listing card is the most likely to be missed — verify it explicitly.

## Image Display

Images render only when `sale.images?.length > 0`. The section is entirely absent for sales with no images (no empty placeholder). Captions (`img.description`) render below the thumbnail when present.
