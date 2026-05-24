# Default Community Fallback

## Overview

When a user navigates to `communitysaleevents.com` with no `communityId` query parameter, the app applies a hardcoded default communityId so it knows which community map to display.

## Where it lives

The default is set in three places — all must be kept in sync:

| File | Location | Role |
|------|----------|------|
| `client/src/components/MapView.jsx` | `const defaultCommunityId = '...'` (~line 135) | Primary: sets context and navigates to `?communityId=...` |
| `client/src/utils/api.js` | `getAddresses(communityId = '...')` (~line 222) | Fallback for address fetching if no communityId passed |
| `client/src/utils/api.js` | `createUpdateUserAddressList(..., community = '...')` (~line 823) | Fallback for saving user address lists |

## Current default

**2026 community** — `96cc0f2f-13e2-4090-8e3d-6dbe35856ef4` (Bay Ridges Community Sale Day 2026)

Previous: `eef06da4-788b-435b-8f84-9467dd5b89a9` (2025, retired)

## When this fires

- User types the bare root URL (`communitysaleevents.com`) with no params
- QR codes embed the full `?communityId=...` URL, so they bypass this fallback entirely

## Updating for a new year

Search for the old UUID across the codebase and replace all three occurrences with the new community's UUID. Also update `INSTRUCTIONS_EDIT_AFTER_QR_SCAN.md` example URLs.
