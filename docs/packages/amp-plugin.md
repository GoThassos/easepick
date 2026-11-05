# @gothassos/easepick-amp-plugin

[![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-amp-plugin.svg)](https://www.npmjs.com/package/@gothassos/easepick-amp-plugin)

::: tip
This package does not need to be installed if you are using [@gothassos/easepick-bundle](/packages/bundle).
:::

Adds extra options.

## Quick example

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>easepick</title>
    <script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-datetime@[version.number]/dist/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-base-plugin@[version.number]/dist/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-amp-plugin@[version.number]/dist/index.umd.js"></script>
  </head>
  <body>
    <input id="datepicker"/>
    <script>
      const picker = new easepick.create({
        element: document.getElementById('datepicker'),
        css: [
          'https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@[version.number]/dist/index.css',
        ],
        plugins: ['AmpPlugin'],
        AmpPlugin: {
          dropdown: {
            months: true,
            years: true,
          },
        },
      });
    </script>
  </body>
</html>
```

## Installation

#### NPM

```bash
npm install @gothassos/easepick-core @gothassos/easepick-amp-plugin
```

#### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-datetime@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-base-plugin@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-amp-plugin@[version.number]/dist/index.umd.js"></script>
```

## Usage

If you’re using a bundler, e.g. [webpack](https://webpack.js.org/):

```ts
import { easepick } from '@gothassos/easepick-core';
import { AmpPlugin } from '@gothassos/easepick-amp-plugin';

const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@[version.number]/dist/index.css',
  ],
  plugins: [AmpPlugin],
});
```

Another way to initialize `easypick`:

```js
const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@[version.number]/dist/index.css',
  ],
  plugins: ['AmpPlugin'],
});
```

<!--@include: ../../packages/amp-plugin/README.md#reference-->
