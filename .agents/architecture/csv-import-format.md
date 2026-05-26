# CSV Import Format

The GarageSalesAdmin "Import CSV" button expects a CSV exported by the same panel's "Export CSV" feature. Hand-crafted CSVs are supported if they match the column format.

## Columns

| Column | Required | Notes |
|--------|----------|-------|
| Address | ✅ Yes | Must include a numeric street number |
| Description | No | Defaults to `"GARAGE SALE"` if empty |
| Featured Items | No | Comma-separated list |
| Payment Types | No | Comma-separated list (e.g. `Cash, Visa`) |

> **Planned**: A **City** column will be added to the export to supply geocoding context. Without it, bare street addresses (e.g. `"712 Kingfisher Drive"`) can geocode to wrong countries.

## Address format rules

- Street number must be a positive integer. Rows where the street number is a dash (`"-"`) or any non-numeric value are rejected client-side with `Invalid address: no street number`. This catches vendor/booth entries that appear in some community CSV exports alongside residential sales.
- The import parser is RFC 4180-compliant (handles quoted fields with embedded commas).

## Duplicate handling

Duplicate detection is **community-scoped**: the same physical address may exist in multiple community events. A row is only rejected as a duplicate if the exact address already exists within the **same community event** being imported into.

> **Note (CSE-125 Bug #1)**: As of May 2026 the backend checks duplicates globally across all communities. Once Jamie's fix is merged, the above community-scoped rule will be enforced.

## Error reporting

After the run completes, the import dialog shows a per-row results table:
- Created rows show a success count.
- Failed rows show row number, address, and error reason.
- The import does **not** stop on failure — all rows are attempted regardless of individual failures.
