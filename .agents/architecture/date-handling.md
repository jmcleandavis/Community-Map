# Date Handling

How date-only strings are stored and displayed across the app.

## Storage Format

Community sale and garage sale dates are stored on the client as `"YYYY-MM-DD"` strings (date only, no time). When sent to the API, a default time is appended:

- Start dates: `"YYYY-MM-DDT09:00:00"`
- End dates: `"YYYY-MM-DDT18:00:00"`

When fetched back, the API value is normalized to `"YYYY-MM-DD"` via `new Date(value).toISOString().split('T')[0]`.

## The Timezone Pitfall

`new Date("2026-06-20")` parses the string as **UTC midnight**. Calling `.toLocaleDateString()` on the result then converts to the user's local timezone. For any timezone west of UTC (e.g. Eastern Time), UTC midnight is the previous evening locally, so the displayed date rolls back one day.

**Symptom**: User enters June 20, the card displays June 19.

## The Rule

Never pass a `"YYYY-MM-DD"` string directly to `new Date()` for display. Parse it as a local date instead:

```js
const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const datePart = String(dateString).split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return '';
  return new Date(year, month - 1, day).toLocaleDateString();
};
```

The `Date(year, month, day)` constructor uses local time, so the displayed date matches what the user entered.

## Where This Matters

Anywhere a date-only string is rendered. The pattern is currently used in `client/src/pages/CommunitySalesAdmin.jsx`. If a value carries a real time component (e.g. `dateTime.start` on a registered garage sale), `new Date(value).toLocaleDateString()` is fine — the timezone shift only bites date-only strings.
