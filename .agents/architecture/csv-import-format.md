# CSV Import Format

GarageSalesAdmin "Import CSV" / "Export CSV" feature.

## Columns

| Column | Required | Notes |
|--------|----------|-------|
| Address | ✅ Yes | Numeric street number required. City/province optional if dialog defaults are set. |
| Description | No | Defaults to `"GARAGE SALE"` |
| Featured Items | No | Comma-separated |
| Payment Types | No | Comma-separated (e.g. `Cash, Visa`) |

## Address rules

- Street number must be a positive integer — non-numeric prefix (e.g. `"- Lily & Coop's"`) → `Invalid address: no street number`.
- Leading `=` in any field (Excel formula artifact) is stripped before parsing.
- Parser is RFC 4180-compliant; quoted fields may span multiple lines.

## Multi-vendor addresses

Multiple vendors at one address go in a single row. Put vendor names in the Description field, one per line prefixed with `"- "`:

```csv
"706 Kingfisher Drive","- Sally's Baubles
- Lily & Coop's Soda Pop Shop","String art","Cash"
```

One map pin is created; all vendor names appear in its description.

## Duplicate address handling (within CSV)

If the same address appears more than once:
- **Same description** → second row silently skipped.
- **Different descriptions** → combined as `desc1 / desc2` in the first row's entry.

## Default City / Province

Import dialog has **Default City** and **Default Province** fields — used as geocoding fallback when an address row has no city/province. Required for bare-street-address CSVs — without city context the geocoder may place sales in the wrong country.

Future: auto-populate from the community record.

## Export round-trip (June 2026+)

"Export CSV" writes the full address (streetNum + street + city + provState). Reimporting does not require default city/province.

## Database duplicate handling

Community-scoped: same address may exist in multiple community events; rejected only if address+community already exists.

