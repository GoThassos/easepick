# Overview

Date picker - tiny size, no dependencies

::: info
This is the documentation for the [GoThassos fork](https://github.com/GoThassos/easepick) of easepick, published on npm as `@gothassos/easepick-*`. The original project by [Rinat G.](https://github.com/wakirin) ([easepick/easepick](https://github.com/easepick/easepick)) is archived. These pages are based on its [documentation](https://github.com/easepick/docs).
:::

## Features

- No dependencies
- Uses [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- Supports plugins

## Browser compatibility

<BrowserCompatibility />

## Packages

### Bundle

| Name | Version | Description
| --- | :---: | ---
| [@gothassos/easepick-bundle](/packages/bundle) | ![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-bundle.svg) | **Bundle of easepick**. Includes all packages.<br/> An easy way to use all the features of `easepick`.

### Core

| Name | Version | Description
| --- | :---: | ---
| [@gothassos/easepick-core](/packages/core) | ![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-core.svg) | Main package of easepick. 
| [@gothassos/easepick-datetime](/packages/datetime) | ![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-datetime.svg) | DateTime package. 
| [@gothassos/easepick-base-plugin](/packages/base-plugin) | ![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-base-plugin.svg) | Base plugin of easepick. <br/> Required for other plugins and for development. 

### Plugins

| Name | Version | Description
| --- | :---: | ---
| [@gothassos/easepick-amp-plugin](/packages/amp-plugin) | ![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-amp-plugin.svg) | Amp plugin. <br/> Adds extra options.
| [@gothassos/easepick-kbd-plugin](/packages/kbd-plugin) | ![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-kbd-plugin.svg) | Keyboard plugin. <br/> Adds keyboard navigation.
| [@gothassos/easepick-lock-plugin](/packages/lock-plugin) | ![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-lock-plugin.svg) | Lock plugin. <br/> Adds the ability to disable days for selection.
| [@gothassos/easepick-preset-plugin](/packages/preset-plugin) | ![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-preset-plugin.svg) | Preset plugin. <br/> Adds predefined ranges.
| [@gothassos/easepick-range-plugin](/packages/range-plugin) | ![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-range-plugin.svg) | Range plugin. <br/> Adds the ability to select a range of dates.
| [@gothassos/easepick-time-plugin](/packages/time-plugin) | ![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-time-plugin.svg) | Time plugin. <br/> Adds time picker.

---

## License

Licensed under the terms of the [MIT License](https://github.com/GoThassos/easepick/blob/master/LICENSE).

Copyright &copy; 2021-{{ new Date().getFullYear() }}, [Rinat G.](https://github.com/wakirin)
