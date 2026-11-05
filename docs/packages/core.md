# @gothassos/easepick-core

[![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-core.svg)](https://www.npmjs.com/package/@gothassos/easepick-core)

::: tip
This package does not need to be installed if you are using [@gothassos/easepick-bundle](/packages/bundle).
:::

Main package of easepick.

## Quick example

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>easepick</title>
    <script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-datetime@[version.number]/dist/index.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.umd.js"></script>
  </head>
  <body>
    <input id="datepicker"/>
    <script>
      const picker = new easepick.create({
        element: document.getElementById('datepicker'),
        css: [
          'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
        ],
      });
    </script>
  </body>
</html>
```

## Installation

#### NPM

```bash
npm install @gothassos/easepick-core
```

#### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-datetime@[version.number]/dist/index.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.umd.js"></script>
```

## Usage

If you’re using a bundler, e.g. [webpack](https://webpack.js.org/), you’ll need to import easepick.

```ts
import { easepick } from '@gothassos/easepick-core';
```

Now you can create `easepick` instance.

```js
const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@[version.number]/dist/index.css',
  ],
});
```

<!--@include: ../../packages/core/README.md#reference-->
