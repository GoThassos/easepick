# @gothassos/easepick-bundle

[![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-bundle.svg)](https://www.npmjs.com/package/@gothassos/easepick-bundle)

Bundle of easepick.  
Includes all packages.

## Quick example

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
      });
    </script>
  </body>
</html>
```

## Installation

#### NPM

```bash
npm install @gothassos/easepick-bundle
```

#### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@[version.number]/dist/index.umd.js"></script>
```

## Usage

If you’re using a bundler, e.g. [webpack](https://webpack.js.org/), you’ll need to import easepick.

```ts
import { easepick } from '@gothassos/easepick-bundle';
```

Now you can create `easepick` instance.

```js
const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@[version.number]/dist/index.css',
  ],
});
```

<!--@include: ../../packages/bundle/README.md#reference-->
