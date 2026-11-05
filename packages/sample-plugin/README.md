# @gothassos/easepick-sample-plugin

A minimal easepick plugin to copy when writing your own. It is not published to npm.

Ported from [easepick/sample-plugin](https://github.com/easepick/sample-plugin) and updated for the `@gothassos/easepick-*` packages.

It colors today's day cell by listening to the picker's `view` event, which is the pattern most plugins follow:

- `getName()` returns the name the plugin's options are read from (`SamplePlugin: { ... }`).
- `onAttach()` / `onDetach()` add and remove event listeners.
- `options` holds the defaults; the user's options are merged over them.
- `src/interface.ts` adds the options to the picker's config type through module augmentation.

## Usage

```js
import { easepick } from '@gothassos/easepick-core';
import { SamplePlugin } from '@gothassos/easepick-sample-plugin';

const picker = new easepick.create({
  element: document.getElementById('datepicker'),
  css: [
    'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core/dist/index.css',
  ],
  plugins: [SamplePlugin],
  SamplePlugin: {
    bgColor: '#3eaf7c',
    fgColor: '#fff',
  },
});
```

## Options

| Name | Type | Default | Description
| --- | :---: | :---: | ---
| bgColor | string | `#000` | Background color of today.
| fgColor | string | `#fff` | Text color of today.

## License

[GNU General Public License Version 2 or later](LICENSE.md), as the original sample plugin.
