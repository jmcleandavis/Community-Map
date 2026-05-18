# User Display Name

How to read a user's full name from `userInfo` across different login flows.

## The Problem

The `userInfo` object in `AuthContext` is populated from three different sources, each using different field names:

| Source | First name field | Last name field |
|--------|-----------------|-----------------|
| Email/password login & map view | `fName` | `lName` |
| Registration response | `firstName` | `lastName` |
| Google OAuth callback | `given_name` | `family_name` |

Reading only `userInfo.fName` will return undefined for Google-authenticated users.

## The Rule

Use the fallback chain when displaying a user's full name:

```js
const firstName = userInfo?.fName || userInfo?.firstName || userInfo?.given_name || '';
const lastName  = userInfo?.lName || userInfo?.lastName  || userInfo?.family_name || '';
const fullName  = `${firstName} ${lastName}`.trim();
```

Fall back to `userEmail` if `fullName` is empty (edge case: userInfo not yet populated).

## Where This Is Used

`HamburgerMenu.jsx` (map sidebar logout label) and `DashboardLayout.jsx` (main sidebar logout secondary text) both use this pattern.
