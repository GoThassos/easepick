# Month picker

With `viewMode: 'month'` the picker shows the 12 months of a year, and the arrows move a year at a time. Picking a month selects its first day: set `format` to show only the month and year.

### Demo

<Demo name="month-picker" />

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
        viewMode: 'month',
        format: 'MM/YYYY',
      });
    </script>
  </body>
</html>
```

### Month range

With the RangePlugin, the range covers whole months: picking March and June selects 1 March to 30 June.

<Demo name="month-range" />

```js
const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@[version.number]/dist/index.css',
  ],
  viewMode: 'month',
  format: 'MMM YYYY',
  plugins: ['RangePlugin'],
});
```
