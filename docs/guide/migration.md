# Migrating from easepick

This fork is compatible with the last release of the original packages, `@easepick/*` 1.2.1. The options, methods, events, CSS class names and the `easepick` global are the same. In most projects, changing the package names is the whole migration.

## Before you start: upgrade to 1.2.1

This guide lists what changed since `@easepick/*` 1.2.1. If you're on an older version, upgrade the original packages to 1.2.1 first and check that your picker still works:

```bash
npm install @easepick/bundle@1.2.1
```

Then follow the steps below. If something breaks, you'll know which step caused it. The original project has no changelog, so the [commit history](https://github.com/easepick/easepick/commits/master) is the record of what changed up to 1.2.1.

## 1. Change the package names

Every package moved from the `@easepick` scope to `@gothassos`, with an `easepick-` prefix:

| Original | This fork |
| --- | --- |
| `@easepick/bundle` | `@gothassos/easepick-bundle` |
| `@easepick/core` | `@gothassos/easepick-core` |
| `@easepick/datetime` | `@gothassos/easepick-datetime` |
| `@easepick/base-plugin` | `@gothassos/easepick-base-plugin` |
| `@easepick/range-plugin` | `@gothassos/easepick-range-plugin` |
| `@easepick/preset-plugin` | `@gothassos/easepick-preset-plugin` |
| `@easepick/time-plugin` | `@gothassos/easepick-time-plugin` |
| `@easepick/lock-plugin` | `@gothassos/easepick-lock-plugin` |
| `@easepick/kbd-plugin` | `@gothassos/easepick-kbd-plugin` |
| `@easepick/amp-plugin` | `@gothassos/easepick-amp-plugin` |

### npm

```bash
npm uninstall @easepick/bundle
npm install @gothassos/easepick-bundle
```

```js
// Before
import { easepick, RangePlugin } from '@easepick/bundle';

// After
import { easepick, RangePlugin } from '@gothassos/easepick-bundle';
```

Update the stylesheet URLs passed to the `css` option the same way, including any imports of `dist/index.css`.

### CDN

```html
<!-- Before -->
<script src="https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.1/dist/index.umd.min.js"></script>

<!-- After -->
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@[version.number]/dist/index.umd.min.js"></script>
```

The UMD builds still define `window.easepick`, so your page scripts don't change.

## 2. Check the behaviour changes

Most changes in this fork are bug fixes. The ones below change behaviour you might depend on. Skim them, and check any code that worked around the old behaviour.

### Events

- **TimePlugin fires `select` on time changes with `autoApply`.** Before, changing the time applied it but fired no event, unlike picking a date. Now each time change fires `select`, with the same detail a date pick gives: `{ date }`, or `{ start, end }` with RangePlugin. If your `select` handler does something that shouldn't repeat, such as a request, it can now run more than once per selection.
- **TimePlugin attaches after RangePlugin**, whatever order you list them in `plugins`.

### Dates and times

- **DateTime parsing and arithmetic:**
  - `12 AM` is midnight and `12 PM` is noon. They were swapped. Lowercase `am`/`pm` is now read too.
  - Two-digit years (`YY`): `00`–`68` mean 20xx and `69`–`99` mean 19xx. Before, `19` became 1919.
  - `diff(…, 'month')` is correct across years. Before, Jan 2019 − Dec 2018 gave −23.
  - Week numbers follow ISO 8601: 30 Dec 2019 – 5 Jan 2020 is week 1, not 53. This affects AmpPlugin's `weekNumbers`.
- **Pre-filled inputs keep their values on load:**
  - RangePlugin with `strict: false` and both `element` and `elementEnd` pre-filled keeps the end date. Before, the end date was dropped.
  - TimePlugin reads the end time into the end of the range. Before, the start showed the end time.
- **Date strings with month names are parsed in `lang`.** With a format such as `DD MMMM YYYY`, strings passed to `setDate`, `setStartDate`, `setEndDate`, `gotoDate` or the `date` option are now read in the picker's language. Before, they were read in English.

### Display

- **The month title is built with `Intl`**, and so is AmpPlugin's month dropdown. Month names are now in the nominative case: Greek shows "Νοέμβριος", not "Νοεμβρίου". Languages that write months as numbers (ja, zh, ko) show the standalone month, for example "11月".
- **The picker stays inside the viewport.** It now opens above the input when there's no room below, right-aligns near the right edge, and stays on screen on narrow windows. If you added CSS or JavaScript to reposition it, try removing that first.
- **RangePlugin tooltip:** if a plural form in your `locale` is empty, the tooltip uses the `other` form and logs a warning. Before, it showed just the number.

### Selection

- **RangePlugin with `repick: true` and `autoApply: false`** keeps a selection that's waiting for the Apply button when the mouse leaves the picker.
- **TimePlugin without `autoApply`** enables Apply when only the time changes, also with `native: true`. Cancel now discards a time change made in the native input.
- **LockPlugin presets** count days inclusively, like the calendar does. With `minDays: 7`, the "Last 7 Days" preset is enabled.

### Plugins and TypeScript

- **`PluginManager.addInstance('Unknown')`** logs a warning and returns `null`. Before, it threw a `TypeError`.
- **The `plugins` option is typed** as `(PluginConstructor | string)[]` (it was `any[]`). Code that passes anything else no longer type-checks.
- **`AmpPlugin` and `KbdPlugin` options are typed** on `IPickerConfig`, so `easepick.create({ AmpPlugin: { … } })` type-checks.
- **`Calendar.getCalendarFooterView()` takes no arguments.** This only matters if you override or call it.

## 3. Optional: new features

None of these are on by default.

- `viewMode: 'month' | 'year'`: pick a month or a year. See the [month picker](/examples/month-picker) and [year picker](/examples/year-picker) examples.
- `showOffsetDays`: show the previous and next months' days in the empty cells of the grid. See [core](/packages/core).
- CSS variables for the picker shadows: `--box-shadow` and `--box-shadow-inline`. See [core styling](/packages/core#styling).
- AmpPlugin `locale.week`: the label of the week-number column. See [amp-plugin](/packages/amp-plugin).

## Something else changed?

If something behaves differently and it isn't listed here, [report it](/support/reporting-issues).
