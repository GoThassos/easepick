# @gothassos/easepick-time-plugin

[![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-time-plugin.svg)](https://www.npmjs.com/package/@gothassos/easepick-time-plugin)

::: tip
This package does not need to be installed if you are using [@gothassos/easepick-bundle](/packages/bundle).
:::

Adds time picker.

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
    <script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-time-plugin@[version.number]/dist/index.umd.js"></script>
  </head>
  <body>
    <input id="datepicker"/>
    <script>
      const picker = new easepick.create({
        element: document.getElementById('datepicker'),
        css: [
          'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
          'https://cdn.jsdelivr.net/npm/@gothassos/easepick-time-plugin@[version.number]/dist/index.css',
        ],
        plugins: ['TimePlugin'],
        TimePlugin: {
          format: 'HH:mm',
        },
      });
    </script>
  </body>
</html>
```

## Installation

#### NPM

```bash
npm install @gothassos/easepick-core @gothassos/easepick-time-plugin
```

#### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-datetime@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-base-plugin@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-time-plugin@[version.number]/dist/index.umd.js"></script>
```

## Usage

If you’re using a bundler, e.g. [webpack](https://webpack.js.org/):

```ts
import { easepick } from '@gothassos/easepick-core';
import { TimePlugin } from '@gothassos/easepick-time-plugin';

const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-time-plugin@[version.number]/dist/index.css',
  ],
  plugins: [TimePlugin],
});
```

Another way to initialize `easypick`:

```js
const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-time-plugin@[version.number]/dist/index.css',
  ],
  plugins: ['TimePlugin'],
});
```

<!--@include: ../../packages/time-plugin/README.md#reference-->
