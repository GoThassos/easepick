# @gothassos/easepick-lock-plugin

[![npm version](https://badge.fury.io/js/@gothassos%2Feasepick-lock-plugin.svg)](https://www.npmjs.com/package/@gothassos/easepick-lock-plugin)

> This package does not need to be installed if you are using [@gothassos/easepick-bundle](https://github.com/GoThassos/easepick/tree/master/packages/bundle).

Adds the ability to disable days for selection.

## Documentation

[https://github.com/GoThassos/easepick/tree/master/packages/lock-plugin](https://github.com/GoThassos/easepick/tree/master/packages/lock-plugin)

## Options

| Name | Type | Default | Description
| --- | :---: | :---: | ---
| minDate | Date <br/> string <br/> number | null | The minimum/earliest date that can be selected. <br/> Date Object or Unix Timestamp (with milliseconds) or ISO String.
| maxDate | Date <br/> string <br/> number | null | The maximum/latest date that can be selected. <br/> Date Object or Unix Timestamp (with milliseconds) or ISO String.
| minDays | number | null | The minimum days of the selected range.
| maxDays | number | null | The maximum days of the selected range.
| selectForward | boolean | false | Select second date after the first selected date.
| selectBackward | boolean | false | Select second date before the first selected date.
| presets | boolean | true | Disable unallowed presets (when PresetPlugin is included).
| inseparable | boolean | false | Disable date range selection with locked days.
| filter | function | null | Lock days by custom function.

With the core's `viewMode: 'month'` or `'year'`, `minDate` and `maxDate` lock the months (years) entirely outside them and stop the header arrows there. The other options apply to the day view only.
