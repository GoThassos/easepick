# Year picker

With `viewMode: 'year'` the picker shows a decade of years (with the years just before and after it), and the arrows move a decade at a time. Picking a year selects 1 January: set `format` to `YYYY`.

### Demo

<Demo name="year-picker" />

### Quick example

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>easepick</title>
    <script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@[version.number]/dist/index.umd.js"></script>
  </head>
  <body>
    <input id="datepicker"/>
    <script>
      const picker = new easepick.create({
        element: document.getElementById('datepicker'),
        css: [
          'https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@[version.number]/dist/index.css',
        ],
        viewMode: 'year',
        format: 'YYYY',
      });
    </script>
  </body>
</html>
```

### Year range up to this year

With the RangePlugin the range covers whole years (1 January to 31 December). With the LockPlugin, `minDate` and `maxDate` lock the years outside them: here, the years after this one.

<Demo name="year-range" />

```js
const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@[version.number]/dist/index.css',
  ],
  viewMode: 'year',
  format: 'YYYY',
  plugins: ['RangePlugin', 'LockPlugin'],
  LockPlugin: {
    maxDate: new Date(),
  },
});
```
