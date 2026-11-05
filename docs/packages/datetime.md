# @gothassos/easepick-datetime

[![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-datetime.svg)](https://www.npmjs.com/package/@gothassos/easepick-datetime)

::: tip
This package does not need to be installed if you are using [@gothassos/easepick-bundle](/packages/bundle).
:::

DateTime library for `easepick`.

## Quick example

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>easepick</title>
    <script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-datetime@[version.number]/dist/index.umd.min.js"></script>
  </head>
  <body>
    <div id="date-el"></div>
    <script>
      const DateTime = easepick.DateTime;
      const today = new DateTime();
      const tomorrow = today.clone().add(1, 'day');

      const dateEl = document.getElementById('date-el');
      dateEl.innerHTML = `
        Today is: ${today.format('DD MMM YYYY')}
        <br/>
        Tomorrow is: ${tomorrow.format('DD MMM YYYY')}
      `;
    </script>
  </body>
</html>
```

<!--@include: ../../packages/datetime/README.md#reference-->
