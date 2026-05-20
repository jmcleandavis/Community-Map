# Menu Layout Contexts

## Layouts

| Layout | Component | Renders |
|--------|-----------|---------|
| Hamburger | `HamburgerMenu` + padding div | Floating hamburger button only — no persistent sidebar |
| Dashboard | `DashboardLayout` | Full MUI drawer sidebar with nav links |

## Rule

**Hamburger menu items stay in the hamburger layout** — except `/about`, which intentionally uses DashboardLayout.

| Route | Layout | Why |
|-------|--------|-----|
| `/` (map) | Hamburger | Primary map view |
| `/help` | Hamburger (always) | Help content is about the map; no sidebar needed |
| `/sales` | Hamburger if `fromMap`, else Dashboard | Accessible from both map and dashboard contexts |
| `/about` | Dashboard (intentional exception) | Gateway to login, register garage sale, etc. — sidebar nav is useful here |
| `/info` | Dashboard | Dashboard-only content |
| `/list-active-community-sales-events` | Dashboard | Dashboard-only content |
| `/login`, `/reset-password` | Dashboard | Auth flows |
| `/admin/*`, `/register-garage-sale` | ProtectedDashboard | Auth-gated admin pages |

## Adding a New Hamburger Menu Item

When a new item is added to `HamburgerMenu.jsx`, decide:

1. **Always hamburger** → create a `XxxRoute` component in `App.jsx` mirroring `HelpRoute`: render `<HamburgerMenu />` + a padding div wrapping the page component.

2. **Origin-sensitive** → use the `fromMap` pattern (see `SalesRoute`): navigate with `{ state: { fromMap: true } }`, then check `location.state?.fromMap` in the route component to pick layout.

3. **Always dashboard (like /about)** → wrap in `DashboardRoute`. Document the reason in this file.

## fromMap State Pattern

`navigate('/path', { state: { fromMap: true } })` marks a navigation as coming from the map. The route component reads `location.state?.fromMap` to choose hamburger vs dashboard layout. Passing it on always-hamburger routes (e.g. `/help`) is harmless — the component ignores it.
