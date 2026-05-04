# Map Centring

The community sales map (`MapView.jsx`) has two competing centring forces and a strict precedence rule.

## Rule

**The map centres on the community by default.** Only an explicit user gesture — the "My Location" button — pans to the user's geolocation.

## Why It Matters

Direct URL access via `/?communityId=<id>` is the primary entry point: community admins generate a QR code (see `CommunityQRCode.jsx`) for each sale and print it on flyers and ads. Most map visitors arrive by scanning a QR code, not by SPA navigation. If the map auto-centred on the user, every QR-code visitor would see their own location instead of the neighbourhood they came to browse.

## How It Works

`LocationContext.jsx`:
- On mount, calls `fetchUserLocation(false)` — captures the user's coordinates (needed by the "Navigate here" button inside each marker's info window) but does **not** set `shouldCenterOnUser`.
- `centerOnUserLocation()` (the public callback) calls `fetchUserLocation(true)`. The "My Location" button is the only intended caller.

`MapView.jsx`:
- `centerOnCommunitySales()` runs whenever `garageSales` arrives — this is the default centring.
- A separate effect watches `shouldCenterOnUser && userLocation && mapRef.current`, pans/zooms to the user, then clears the flag.

## What to Watch Out For

- Do **not** call `setShouldCenterOnUser(true)` from any mount effect, route effect, or other non-user-initiated code path.
- New callers that want to centre on the user should go through `centerOnUserLocation()`, not the state setter directly.
- CSE-110 ("title and centring break on direct URL load") was caused by `LocationContext` auto-setting `shouldCenterOnUser=true` on mount; on cold loads, the user-centring effect won the race against `centerOnCommunitySales` and overrode it.
