# Cache-Control Policy

The production server (`client/server.js`) sets caching headers via `express.static`'s `setHeaders` option:

| File Type | Header |
|-----------|--------|
| HTML (`.html`) | `Cache-Control: no-cache, must-revalidate` |
| Assets (`/assets/*`) | `Cache-Control: public, max-age=31536000, immutable` |

## Why

Vite builds use content-hashed filenames (e.g., `GarageSales-B7ZmN9uN.js`). After a deploy, old hashes no longer exist. Without `no-cache` on `index.html`, browsers serve a stale `index.html` that references deleted chunks → Express catch-all returns HTML instead of the asset → browser rejects it as a JS module → **blank white screen** (CSE-132).

## Stale Cache Recovery

Both `index.html` and `garageSales.html` include this as the first script in `<head>`:

```html
<script>
  window.addEventListener('vite:preloadError', () => {
    window.location.reload();
  });
</script>
```

A failed preload triggers a reload. With `no-cache` on `index.html`, the reload fetches fresh HTML with correct hashes.

## Missing Asset Behavior

The catch-all in `server.js` returns `404 Asset not found` for `/assets/*` paths not served by `express.static`, preventing MIME type confusion.

## Verifying After Deploy

1. Open DevTools → Network tab on https://www.communitysaleevents.com/
2. Hard refresh (Ctrl+Shift+R)
3. `index.html` response → expect `Cache-Control: no-cache, must-revalidate`
4. Any `/assets/*.js` response → expect `Cache-Control: public, max-age=31536000, immutable`

## CDN Warning

As of 2026-06-20, it is unknown whether a CDN sits in front of the production Cloud Run service. If one does, it may override the `no-cache` header and re-introduce the blank screen bug.

If the live `index.html` response shows a long TTL, either purge the CDN cache after each deploy or configure the CDN to pass through `Cache-Control` headers for HTML responses.
