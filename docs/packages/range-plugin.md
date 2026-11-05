# @gothassos/easepick-range-plugin

[![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-range-plugin.svg)](https://www.npmjs.com/package/@gothassos/easepick-range-plugin)

::: tip
This package does not need to be installed if you are using [@gothassos/easepick-bundle](/packages/bundle).
:::

Adds the ability to select a range of dates.

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
    <script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-range-plugin@[version.number]/dist/index.umd.js"></script>
  </head>
  <body>
    <input id="datepicker"/>
    <script>
      const picker = new easepick.create({
        element: document.getElementById('datepicker'),
        css: [
          'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
          'https://cdn.jsdelivr.net/npm/@gothassos/easepick-range-plugin@[version.number]/dist/index.css',
        ],
        plugins: ['RangePlugin'],
        RangePlugin: {
          tooltip: true,
        },
      });
    </script>
  </body>
</html>
```

## Installation

#### NPM

```bash
npm install @gothassos/easepick-core @gothassos/easepick-range-plugin
```

#### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-datetime@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-base-plugin@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-range-plugin@[version.number]/dist/index.umd.js"></script>
```

## Usage

If you’re using a bundler, e.g. [webpack](https://webpack.js.org/):

```ts
import { easepick } from '@gothassos/easepick-core';
import { RangePlugin } from '@gothassos/easepick-range-plugin';

const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-range-plugin@[version.number]/dist/index.css',
  ],
  plugins: [RangePlugin],
});
```

Another way to initialize `easypick`:

```js
const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-range-plugin@[version.number]/dist/index.css',
  ],
  plugins: ['RangePlugin'],
});
```

<!--@include: ../../packages/range-plugin/README.md#reference-->
