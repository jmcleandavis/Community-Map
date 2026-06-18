# Community Map Product Overview

Community Map is a web application that lets neighborhoods organize and browse community garage sales on an interactive map.

## Who Uses It

- **Shoppers** - Browse a map to find nearby garage sale listings and get directions
- **Sellers** - Register their garage sale location, hours, and accepted payment methods
- **Admins** - Manage listings, import or export addresses via CSV, and oversee community sales events

## Core Capabilities

| Capability | Description |
|------------|-------------|
| Interactive Map | Browse garage sale pins on a Google Maps-powered map |
| Listing Registration | Sellers submit their address, description, and payment info |
| Community Sales Events | Group multiple garage sales under a single community event |
| Admin Dashboard | Review, approve, and bulk-manage garage sale listings via CSV import/export |
| Payment Method Tracking | Each listing indicates accepted payment types (cash, card, etc.) |
| External Links | Sellers and admins can add social media/website links via `socialAndWeb`. Supported: Facebook, Instagram, Twitter/X, YouTube, LinkedIn, Pinterest. Unknown keys fall back to a globe icon. Available on both garage sales and community sales. |

## Key Terminology

| Term | Meaning |
|------|---------|
| Garage Sale | An individual seller's listing with address, hours, and payment info |
| Community Sale | A neighborhood-wide event grouping multiple garage sales |
| GENPUB | Special community ID for standalone garage sales not tied to any community event |
| Listing | A registered garage sale entry on the map |
| Admin | A privileged user who manages and approves listings |
| socialAndWeb | A free-form object on both entity types storing social media and website links. Keys are platform identifiers (e.g. `fb`, `instagram`, `website`). Any key is valid; the frontend resolves known keys to branded icons and falls back to a globe icon for unknown keys. |
