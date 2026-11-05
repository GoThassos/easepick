# @gothassos/easepick-preset-plugin

[![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-preset-plugin.svg)](https://www.npmjs.com/package/@gothassos/easepick-preset-plugin)

::: tip
This package does not need to be installed if you are using [@gothassos/easepick-bundle](/packages/bundle).
:::

Adds predefined ranges.  

### Required:
* [@gothassos/easepick-range-plugin](/packages/range-plugin)

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
    <script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-preset-plugin@[version.number]/dist/index.umd.js"></script>
  </head>
  <body>
    <input id="datepicker"/>
    <script>
      const picker = new easepick.create({
        element: document.getElementById('datepicker'),
        css: [
          'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
          'https://cdn.jsdelivr.net/npm/@gothassos/easepick-range-plugin@[version.number]/dist/index.css',
          'https://cdn.jsdelivr.net/npm/@gothassos/easepick-preset-plugin@[version.number]/dist/index.css',
        ],
        plugins: ['RangePlugin', 'PresetPlugin'],
        PresetPlugin: {
          position: 'left',
        },
      });
    </script>
  </body>
</html>
```

## Installation

#### NPM

```bash
npm install @gothassos/easepick-core @gothassos/easepick-preset-plugin
```

#### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-datetime@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-base-plugin@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-range-plugin@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-preset-plugin@[version.number]/dist/index.umd.js"></script>
```

## Usage

If you’re using a bundler, e.g. [webpack](https://webpack.js.org/):

```ts
import { easepick } from '@gothassos/easepick-core';
import { RangePlugin } from '@gothassos/easepick-range-plugin';
import { PresetPlugin } from '@gothassos/easepick-preset-plugin';

const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-range-plugin@[version.number]/dist/index.css',
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-preset-plugin@[version.number]/dist/index.css',
  ],
  plugins: [RangePlugin, PresetPlugin],
});
```

Another way to initialize `easypick`:

```js
const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-range-plugin@[version.number]/dist/index.css',
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-preset-plugin@[version.number]/dist/index.css',
  ],
  plugins: ['RangePlugin', 'PresetPlugin'],
});
```

<!--@include: ../../packages/preset-plugin/README.md#reference-->
