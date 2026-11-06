# Changelog

All `@gothassos/easepick-*` packages share one version number. Versions follow [Semantic Versioning](https://semver.org/).

## Unreleased

### Changes

- **Sample plugin and MSelectPlugin are now MIT-licensed**: [Rinat G.](https://github.com/wakirin), the author of the original code, agreed to relicense them from GPL-2.0-or-later. Every package in this repository is now MIT.

## 1.4.0 - 2026-11-05

### New features

- **`translate` option**: set `translate: false` to stop page translators such as Google Translate from translating the picker. The picker already writes month and day names in `lang`, so machine translation can only make them worse (for example, Greek month names read as English, or short weekday names turned into nonsense). Your own texts, like `locale` and preset labels, are not translated either. The option is on by default, so a site that leaves `lang` at `en-US` and relies on page translation keeps working as before.

### Changes

- **The picker's markup now carries `lang`**: the container inside the shadow root gets `lang` set to the `lang` option. Translators and screen readers now know which language the picker is in, instead of assuming the page's language. Browsers may also pick fonts for that language, which mainly matters for Chinese, Japanese and Korean.

## 1.3.0 - 2026-11-05

This release adds month and year pickers, better accessibility, a `navigate` event and offset days. It also brings a long list of bug fixes, many of them from open pull requests on the original easepick.

New: documentation site at <https://gothassos.github.io/easepick/>. Coming from `@easepick/*`? See the [migration guide](https://gothassos.github.io/easepick/guide/migration).

### Check before upgrading

None of these should need code changes, but they change the markup or behaviour:

- **Day, month and year cells are now `<button>`s** (they were `<div>`s). They keep their classes and a CSS reset keeps their look, so `.day` selectors and styles still work. Only code that targets `div.day` or similar needs updating.
- **TimePlugin fires `select` when only the time changes** (with `autoApply`). Before, only a date pick fired it.
- **TimePlugin now always attaches after RangePlugin**, whatever their order in `plugins`. Before, `[TimePlugin, RangePlugin]` lost the picked times.
- **DateTime treats every number as a timestamp**, including `0` (1 Jan 1970). Digit-only strings are also read as timestamps, unless the format is digit-only and the same length (for example `20240115` with `YYYYMMDD`).
- **Two-digit years (`YY`)**: 00–68 now read as 20xx and 69–99 as 19xx. Before, every two-digit year read as 19xx.
- **Week numbers follow ISO 8601**: a week belongs to the year that holds its Thursday. 30 Dec 2019 – 5 Jan 2020 is now week 1, not week 53.
- **The picker can open above the input** and stays inside the viewport on narrow screens.
- **Adding an unknown plugin warns** (`not found`) instead of throwing a `TypeError`.

### New features

- **Month and year pickers**: a new core option, `viewMode: 'day' | 'month' | 'year'`. RangePlugin selects whole months or years, LockPlugin locks them with `minDate`/`maxDate`, and KbdPlugin can navigate them.
- **`navigate` event**: fired when the previous/next buttons change the calendar, with `date`, `direction` (`'next'` or `'previous'`) and `viewMode`. Useful to load data such as availability for the period shown.
- **`showOffsetDays` option**: shows the previous and next month's days, greyed out, in the empty cells.
- **Accessibility**:
  - Cells are focusable buttons, and each day is named by its full date. Today has `aria-current="date"`, and locked days are `aria-disabled`.
  - Icon buttons and time selects have screen reader names.
  - New `locale` texts make every name translatable, in core, TimePlugin and KbdPlugin.
- **Configurable shadows**: `--box-shadow` and `--box-shadow-inline` CSS variables. Set them to `none` to remove the shadow.
- **AmpPlugin**: a `week` locale text.

### Bug fixes

Core and DateTime:

- Published builds no longer need `moment`. Core imported it without depending on it, so installs failed to resolve it, and the UMD build needed a global `window.moment`. Month titles now come from `Intl`.
- Month names are nominative in languages such as Greek ("Νοέμβριος", not "Νοεμβρίου"), in the calendar title and in AmpPlugin's dropdown.
- `lang` is used when parsing dates in `setDate`, `gotoDate` and the `date` option.
- `12 AM`/`12 PM` were parsed the wrong way round, and lowercase `am`/`pm` was ignored.
- Formats without delimiters (`YYYYMMDD`) gave years like 4372.
- `diff(…, 'month')` was wrong across years.
- Picking a day between Aug 1969 and Apr 1970 selected a date thousands of years away.
- The `.d.ts` files no longer import `.scss` files. That import caused TS2882 errors for TypeScript users in 1.2.8 and 1.2.9.

RangePlugin:

- With `repick: true` and `autoApply: false`, a finished selection waiting for Apply was lost or saved wrongly when the mouse left the picker.
- With `strict: false` and two pre-filled inputs, the end date was lost on load.
- A missing plural form left the tooltip blank (for example "5 " in Russian). It now falls back to `other` and warns about the missing form.

TimePlugin:

- Changing only the time of an already selected date left Apply disabled. Cancel also didn't undo a change made with the native time input.
- With `strict: false`, the end time was loaded into the start date.

LockPlugin:

- The "requires RangePlugin" warning appeared even when RangePlugin was loaded.
- Presets were checked against `minDays`/`maxDays` by nights instead of days.

AmpPlugin:

- Fixed the secondary month/year dropdowns.

TypeScript:

- `AmpPlugin: {…}` and `KbdPlugin: {…}` options are now typed on `easepick.create()`.
- The `plugins` option is typed.

### Under the hood

- Tests cover 100% of the code (577 tests), and CI fails if coverage drops.
- CI runs on Node 22, 24 and 26.
- The tooling was upgraded to TypeScript 6 (type-checked with TypeScript 7), Rollup 4, Jest 30 and ESLint 10. The JavaScript output is unchanged.
- CDN links use `index.umd.js`, which is already minified, so they work with SRI hashes.

### Thanks

This release includes work adapted from [YuaFox/easepick2](https://github.com/YuaFox/easepick2), [BeBoRE/easepick2](https://github.com/BeBoRE/easepick2), [Overmoon-com/easepick](https://github.com/Overmoon-com/easepick), and pull requests to [easepick/easepick](https://github.com/easepick/easepick) (#108, #109, #159, #184, #193, #195, #216, #226, #248, #262).

## 1.2.9 - 2026-11-05

- Relicensed from GPL-2.0-or-later to MIT, matching the upstream license change.
- Package homepages, repository and issue links, and README links point to [GoThassos/easepick](https://github.com/GoThassos/easepick). The READMEs use the `@gothassos/easepick-*` package names.

## Earlier versions

Versions up to 1.2.8 have no changelog. See the [git tags](https://github.com/GoThassos/easepick/tags), and the [original easepick](https://github.com/easepick/easepick) for 1.2.1 and before.
