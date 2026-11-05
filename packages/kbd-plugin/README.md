# @gothassos/easepick-kbd-plugin

[![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-kbd-plugin.svg)](https://www.npmjs.com/package/@gothassos/easepick-kbd-plugin)

> This package does not need to be installed if you are using [@gothassos/easepick-bundle](https://github.com/GoThassos/easepick/tree/master/packages/bundle).

Adds keyboard navigation.

## Documentation

[https://github.com/GoThassos/easepick/tree/master/packages/kbd-plugin](https://github.com/GoThassos/easepick/tree/master/packages/kbd-plugin)

<!-- #region reference -->

## Options

| Name | Type | Default | Description
| --- | :---: | :---: | ---
| unitIndex | number | 1 | `tabIndex` for elements except days elements (including months and years with the core's `viewMode`, which Enter and Space pick).
| dayIndex | number | 2 | `tabIndex` for days elements.
| locale | object | { openButton: `'Open calendar'` } | Name of the icon button that opens the picker, for screen readers (kept if a custom `html` button has its own `aria-label`).

<!-- #endregion reference -->
