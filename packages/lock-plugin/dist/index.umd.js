/**
* @license
* Package: @easepick/lock-plugin
* Version: 1.2.1
* https://easepick.com/
* Copyright 2023 Rinat G.
* 
* Licensed under the terms of GNU General Public License Version 2 or later. (http://www.gnu.org/licenses/gpl.html)
*/
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports,require("@easepick/datetime"),require("@easepick/base-plugin")):"function"==typeof define&&define.amd?define(["exports","@easepick/datetime","@easepick/base-plugin"],e):e((t="undefined"!=typeof globalThis?globalThis:t||self).easepick=t.easepick||{},t.easepick,t.easepick)}(this,(function(t,e,i){"use strict";class s extends i.BasePlugin{priority=1;binds={onView:this.onView.bind(this)};options={minDate:null,maxDate:null,minDays:null,maxDays:null,selectForward:null,selectBackward:null,presets:!0,inseparable:!1,filter:null};getName(){return"LockPlugin"}onAttach(){if(this.options.minDate&&(this.options.minDate=new e.DateTime(this.options.minDate,this.picker.options.format,this.picker.options.lang)),this.options.maxDate&&(this.options.maxDate=new e.DateTime(this.options.maxDate,this.picker.options.format,this.picker.options.lang),this.options.maxDate instanceof e.DateTime&&this.picker.options.calendars>1&&this.picker.calendars[0].isSame(this.options.maxDate,"month"))){const t=this.picker.calendars[0].clone().subtract(1,"month");this.picker.gotoDate(t)}if((this.options.minDays||this.options.maxDays||this.options.selectForward||this.options.selectBackward)&&!this.picker.options.plugins.includes("RangePlugin")){const t=["minDays","maxDays","selectForward","selectBackward"];console.warn(`${this.getName()}: options ${t.join(", ")} required RangePlugin.`)}this.picker.on("view",this.binds.onView)}onDetach(){this.picker.off("view",this.binds.onView)}onView(t){const{view:i,target:s,date:a}=t.detail;if("CalendarHeader"===i&&(this.options.minDate instanceof e.DateTime&&a.isSameOrBefore(this.options.minDate,"month")&&s.classList.add("no-previous-month"),this.options.maxDate instanceof e.DateTime&&a.isSameOrAfter(this.options.maxDate,"month")&&s.classList.add("no-next-month")),"CalendarDay"===i){const t=this.picker.datePicked.length?this.picker.datePicked[0]:null;if(this.testFilter(a))return void s.classList.add("locked");if(this.options.inseparable){if(this.options.minDays){const t=a.clone().subtract(this.options.minDays-1,"day"),e=a.clone().add(this.options.minDays-1,"day");let i=!1,o=!1;for(;t.isBefore(a,"day");){if(this.testFilter(t)){i=!0;break}t.add(1,"day")}for(;e.isAfter(a,"day");){if(this.testFilter(e)){o=!0;break}e.subtract(1,"day")}i&&o&&s.classList.add("not-available")}this.rangeIsNotAvailable(a,t)&&s.classList.add("not-available")}this.dateIsNotAvailable(a,t)&&s.classList.add("not-available")}if(this.options.presets&&"PresetPluginButton"===i){const t=new e.DateTime(Number(s.dataset.start)),i=new e.DateTime(Number(s.dataset.end)),a=i.diff(t,"day"),o=this.options.minDays&&a<this.options.minDays,n=this.options.maxDays&&a>this.options.maxDays;(o||n||this.lockMinDate(t)||this.lockMaxDate(t)||this.lockMinDate(i)||this.lockMaxDate(i)||this.rangeIsNotAvailable(t,i))&&s.setAttribute("disabled","disabled")}}dateIsNotAvailable(t,e){return this.lockMinDate(t)||this.lockMaxDate(t)||this.lockMinDays(t,e)||this.lockMaxDays(t,e)||this.lockSelectForward(t)||this.lockSelectBackward(t)}rangeIsNotAvailable(t,e){if(!t||!e)return!1;const i=(t.isSameOrBefore(e,"day")?t:e).clone(),s=(e.isSameOrAfter(t,"day")?e:t).clone();for(;i.isSameOrBefore(s,"day");){if(this.testFilter(i))return!0;i.add(1,"day")}return!1}lockMinDate(t){return this.options.minDate instanceof e.DateTime&&t.isBefore(this.options.minDate,"day")}lockMaxDate(t){return this.options.maxDate instanceof e.DateTime&&t.isAfter(this.options.maxDate,"day")}lockMinDays(t,e){if(this.options.minDays&&e){const i=e.clone().subtract(this.options.minDays-1,"day"),s=e.clone().add(this.options.minDays-1,"day");return t.isBetween(i,s)}return!1}lockMaxDays(t,e){if(this.options.maxDays&&e){const i=e.clone().subtract(this.options.maxDays,"day"),s=e.clone().add(this.options.maxDays,"day");return!t.isBetween(i,s)}return!1}lockSelectForward(t){if(1===this.picker.datePicked.length&&this.options.selectForward){const e=this.picker.datePicked[0].clone();return t.isBefore(e,"day")}return!1}lockSelectBackward(t){if(1===this.picker.datePicked.length&&this.options.selectBackward){const e=this.picker.datePicked[0].clone();return t.isAfter(e,"day")}return!1}testFilter(t){return"function"==typeof this.options.filter&&this.options.filter(t,this.picker.datePicked)}}t.LockPlugin=s,Object.defineProperty(t,"__esModule",{value:!0})}));
