# Cloudinary Integration

Images are uploaded browser-direct to Cloudinary (unsigned preset) — no binary data passes through the backend.

## Upload Flow

```
<input type="file"> → uploadImageToCloudinary(file)  [utils/imageUpload.js]
  → POST api.cloudinary.com/v1_1/{cloudName}/image/upload
  → returns { url: secure_url, publicId: public_id }
  → stored in formData.images[] → sent in POST/PATCH payload → backend stores
```

## Payload Shape

```json
{ "images": [{ "description": "Front yard", "url": "https://res.cloudinary.com/...", "publicId": "community-map-uploads/abc123" }] }
```

`description` is public-facing (shown as caption on listings). `publicId` is stored for server-side deletion.

## Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloud name from Cloudinary dashboard |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Name of an **unsigned** upload preset |

## Cloudinary Setup (one-time)

1. Create account at cloudinary.com
2. Settings → Upload → Upload Presets → **Add upload preset**
3. Set **Signing mode** to **Unsigned**, name it (e.g. `community-map-uploads`), save
4. Add cloud name + preset name to `client/.env`

## Why Unsigned Upload

API secret can't safely live in frontend code. Unsigned presets authenticate uploads without it.

## Image Cleanup (follow-up required — Jamie-Lee)

**Images are NOT deleted from Cloudinary when a sale is deleted.** Deletion requires the API secret (server-side only). `publicId` is stored on each image for this purpose.

**Backend follow-up**: on sale delete, call Cloudinary Admin API with each `publicId` before deleting the record. Until then, deleted sales leave orphaned images accumulating storage costs.
