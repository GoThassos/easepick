# Using another language

### Demo

<Demo name="language" />

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
        lang: 'sv-SE',
        plugins: ['RangePlugin'],
        RangePlugin: {
          locale: {
            one: 'dag',
            other: 'dagar',
          },
        },
      });
    </script>
  </body>
</html>
```

### Page translators

The picker writes month and day names itself, in `lang`. When a visitor runs a page translator such as Google Translate, the translator can mangle those names: it may read Greek month names as English, or turn short weekday names into nonsense.

If `lang` already matches your page, set `translate: false` to keep translators off the picker:

```js
const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  lang: 'el-GR',
  translate: false,
});
```

Your own texts, such as `locale` and preset labels, are not translated either. Leave `translate` on (the default) if your site keeps `lang` at `en-US` and relies on visitors translating the page.

Either way, the picker's markup carries `lang`, so translators and screen readers know which language it is in.
