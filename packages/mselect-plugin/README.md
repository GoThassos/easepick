# @gothassos/easepick-mselect-plugin

Select several separate dates: click days to add or remove them. With the core's `viewMode` (`month` or `year`), it selects several months or years instead.

Ported from the unfinished `mselect-plugin` branch of [easepick/easepick](https://github.com/easepick/easepick/tree/mselect-plugin) by its original author, and completed:

- `addDate`, `addDates` and `removeDate` are available on the picker.
- With `autoApply: false`, unpicking an applied date waits for the Apply button, and Cancel or closing the picker drops the change.
- `max` also counts dates picked before Apply, and applies to dates added through the methods.
- Duplicate dates are ignored.

> [!NOTE]
> This package is not part of [@gothassos/easepick-bundle](../bundle#readme), and it is not published to npm yet: remove `"private": true` from its `package.json` to publish it with the other packages.

## Usage

```js
import { easepick } from '@gothassos/easepick-core';
import { MSelectPlugin } from '@gothassos/easepick-mselect-plugin';

const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core/dist/index.css',
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-mselect-plugin/dist/index.css',
  ],
  plugins: [MSelectPlugin],
  MSelectPlugin: {
    max: 5,
    sort: 'asc',
  },
  setup(picker) {
    picker.on('select', (e) => {
      console.log(e.detail.dates); // DateTime[]
    });
  },
});
```

The input's value is the dates in the picker's `format`, joined by `delimiter` (`2019-11-03;2019-11-07`). It is read back on load.

It can't be combined with RangePlugin (a warning is logged) or TimePlugin.

## Options

| Name | Type | Default | Description
| --- | :---: | :---: | ---
| dates | array | [] | Preselected dates: Date objects, timestamps or strings in `inputFormat`. Without it, the input's value is read.
| max | number | null | Maximum number of dates. Once reached, the other days can't be picked.
| delimiter | string | `;` | Separator of the dates in the input's value.
| sort | string | null | Order of the dates: `asc`, `desc`, or `null` for the order they were picked in.
| inputFormat | string | null | Format of string dates in `dates` and the methods. Defaults to the picker's `format`.
| useWrapper | boolean | false | Show the dates as removable items in place of the input. The (hidden) input still holds the value, for forms.
| itemTemplate | function | null | With `useWrapper`, returns the element of a date: `(date: DateTime) => HTMLElement`. Defaults to the date and a remove button.
| locale | object | { remove: `'<svg …>'`, removeLabel: `'Remove'` } | Icon of the remove button, and its name for screen readers (followed by the date).

## Methods

| Name | Description
| --- | ---
| getDates(format?) | Returns the selected dates as DateTime objects, or as strings in `format`.
| setDates(dates, format?) | Replaces the selected dates. `format` reads string dates (defaults to `inputFormat`).
| addDates(dates, format?) | Adds dates.
| addDate(date, format?) | Adds a date.
| removeDate(date, format?) | Removes a date.

`clear()` clears all the dates.

## Events

| Name | Description
| --- | ---
| select | The selection changed (a click with `autoApply`, Apply, or a remove button). `detail.dates` holds the dates.
| preselect | With `autoApply: false`, a day was picked or unpicked before Apply. `detail.dates` holds the dates shown as selected.

## License

[MIT License](LICENSE.md). The original branch was GPL-licensed; [Rinat G.](https://github.com/wakirin), its author, kindly agreed to relicense it under MIT.
