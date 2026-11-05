# @gothassos/easepick-core

[![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-core.svg)](https://www.npmjs.com/package/@gothassos/easepick-core)

> This package does not need to be installed if you are using [@gothassos/easepick-bundle](https://github.com/GoThassos/easepick/tree/master/packages/bundle).

Main package of easepick.

## Documentation

[https://github.com/GoThassos/easepick/tree/master/packages/core](https://github.com/GoThassos/easepick/tree/master/packages/core)

<!-- #region reference -->

## Options

| Name | Type | Default | Description
| --- | :---: | :---: | ---
| element | HTMLElement <br/> string | null | Bind the datepicker to a element. Also is possible to bind to any element (not input) for example you need inline calendar.
| doc | Document <br/> ShadowRoot | document | May be required if you need to pass ShadowRoot.
| css | string <br/> array <br/> function | [] | Pass a CSS file for picker. Don't mix types, if you are using css link then array should only contain links.
| firstDay | number | 1 | Day of start week. (0 - Sunday, 1 - Monday, 2 - Tuesday, etc…)
| lang | string | en-US | Language. <br/>This option affect to day names, month names via [Date.prototype.toLocaleString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString) and also affect to plural rules via [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules).
| date | Date <br/> string <br/> number | null | Preselect date. <br/> Date Object or Unix Timestamp (with milliseconds) or String (must be equal to option format).
| format | string | YYYY-MM-DD | The default output format. <br/> See [tokens format](https://github.com/GoThassos/easepick/tree/master/packages/datetime#tokens-format).
| grid | number | 1 | Number of calendar columns.
| calendars | number | 1 | Number of visible months.
| readonly | boolean | true | Add `readonly` attribute to `element`.
| autoApply | boolean | true | Hide the apply and cancel buttons, and automatically apply a new date range as soon as two dates are clicked.
| zIndex | number | null | zIndex of picker.
| inline | boolean | false | Show calendar inline.
| scrollToDate | boolean | true | Scroll to the selected date on open.
| viewMode | string | day | What the picker shows: `day` (a month of days), `month` (the 12 months of a year, a month picker) or `year` (a decade of years, a year picker). <br/> Picking a month or year selects its first day; set `format` to match (e.g. `MM/YYYY`, `YYYY`). The arrows move a year (`month`) or a decade (`year`), and `calendars`/`grid` only apply to `day`.
| showOffsetDays | boolean | false | Show the days of the previous and next month in the empty cells around the current month. They are not selectable.
| header | boolean <br/> string <br/> HTMLElement | false | Add header to calendar.
| locale | object | { <br/>nextMonth: `'<svg width="11" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M2.748 16L0 13.333 5.333 8 0 2.667 2.748 0l7.919 8z" fill-rule="nonzero"/></svg>'`, <br/> previousMonth: `'<svg width="11" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M7.919 0l2.748 2.667L5.333 8l5.334 5.333L7.919 16 0 8z" fill-rule="nonzero"/></svg>'`, <br/> cancel: 'Cancel', <br/>apply: 'Apply', <br/>previousMonthLabel: 'Previous month', <br/>nextMonthLabel: 'Next month', <br/>previousYearLabel: 'Previous year', <br/>nextYearLabel: 'Next year', <br/>previousDecadeLabel: 'Previous decade', <br/>nextDecadeLabel: 'Next decade'<br/>} | Icon and text for buttons. <br/> The `…Label` texts name the previous/next buttons for screen readers: they step a month, or a year and a decade with `viewMode` `month` and `year`. Days are named by their full date in `lang`.
| documentClick | boolean <br/> function | function | Hide picker on click outside picker element.
| setup | function | null | Called with the picker instance once it is created, before the first render. Use it to add event listeners (see [Events](#events)).
| plugins | array | [] | List of plugins.

## Methods

| Name | Description
| --- | ---
| version | return version of picker.
| isShown() | Determine if the picker is visible or not.
| show() | Show the picker.
| hide() | Hide the picker.
| clear() | Clear the picker selection.
| gotoDate(date) | Change visible month.
| setDate(date) | Set date programmatically.
| getDate() | Get selected date.
| on(type, listener, options) | Add listener to container element.
| off(type, listener, options) | Remove listener from container element.
| trigger(type, detail) | Dispatch an event.
| renderAll() | Redraw the calendar layout.
| destroy() | Destroy the picker.

### Example

```js
const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
  ],
});
//
picker.setDate('2022-01-01');
```

## Events

Events based on [CustomEvent()](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent).

| Name | Description
| --- | ---
| render | Event is called before a part of the layout is rendered (`Container`, `Header`, `Main`, `Footer`). `detail` contains `view` and `date`.
| view | Event is called after a layout element is created (for example `Header`, `Main`, `CalendarDay`). `detail` contains `view`, `date` and `target` (the element).
| preselect | Event is called on select days (before submit selection). When `autoApply` option is `false`.
| select | Event is called when selection is submitted.
| navigate | Event is called after the previous/next button moved the calendar. `detail` contains `date` (the first day of the month now shown, or of the year and decade with `viewMode` `month` and `year`), `direction` (`next` or `previous`) and `viewMode`.

It is also allowed to use default events such as `click`, `keydown`, etc.

### Example

```js
const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
  ],
  setup(picker) {
    picker.on('view', (e) => {
      const { view, date, target } = e.detail;
      // do something
    });
  },
});
```

## Styling

The picker is rendered in a shadow DOM, so page styles don't reach it, but CSS variables do. Set them on the `.easepick-wrapper` element (the shadow host, inserted right after `element`) to override the defaults:

```css
.easepick-wrapper {
  --color-fg-primary: #c2185b;
  --box-shadow: none;
}
```

| Variable | Default | Description
| --- | :---: | ---
| --color-bg-default | #fff | Background.
| --color-bg-secondary | #f9f9f9 | Header and footer background, month arrows on hover.
| --color-fg-default | #333 | Text.
| --color-fg-primary | #6b82ff | Selected day background, day border on hover, month arrows on hover.
| --color-fg-selected | #fff | Text of the selected day.
| --color-fg-muted | #9e9e9e | Day names.
| --color-fg-accent | #e63757 | Today.
| --color-fg-offset | #cecece | Days of the previous and next month (see `showOffsetDays`).
| --color-border-default | #ddd | Separator in the time plugin.
| `--color-btn-primary-*` <br/> `--color-btn-secondary-*` | | Apply and cancel buttons (secondary also colors the month arrows): `-bg`, `-fg`, `-border`, each also with `-hover-` and `-disabled-` variants (for example `--color-btn-primary-hover-bg`).
| --day-width <br/> --day-height | 42px <br/> 37px | Size of a day cell.
| --border-radius | 2px | Radius of the apply and cancel buttons.
| --box-shadow | `0 0 25px rgba(0, 0, 0, 0.3)` | Shadow of the picker.
| --box-shadow-inline | `0 7px 14px 0 rgba(65, 69, 88, 0.1), 0 3px 6px 0 rgba(0, 0, 0, 0.07)` | Shadow of the picker with `inline: true`.

Plugins add their own variables (for example `--color-bg-inrange` in the range plugin, `--color-bg-locked` in the lock plugin). With the amp plugin's `darkMode`, the dark theme sets the colors on the picker itself, so overrides on `.easepick-wrapper` don't apply while it is active.

## PluginManager

`PluginManager` allows you to manage plugins of created picker.

### Methods

| Name | Description
| --- | ---
| getInstance(pluginName) | Returns the plugin instance. `pluginName` is a string (eg.: `RangePlugin`).
| addInstance(pluginName) | Adds a plugin to the picker. Returns an instance of the added plugin.
| removeInstance(pluginName) | Removes the plugin from the picker. Returns a boolean result.
| reloadInstance(pluginName) | Removes the plugin from the picker and adds it again. Returns an instance of the added plugin.

### Example

```js
// example use bundle version
const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
  ],
});

// add AmpPlugin to the picker
const ampPlugin = picker.PluginManager.addInstance('AmpPlugin');
// change plugin option
ampPlugin.options.resetButton = true;
```

<!-- #endregion reference -->
