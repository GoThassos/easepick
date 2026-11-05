import { BasePlugin, IEventDetail, IPlugin } from '@gothassos/easepick-base-plugin';
import { DateTime } from '@gothassos/easepick-datetime';
import { IMSelectConfig, MSelectDate } from './interface';
import './index.scss';

/**
 * Select several separate dates (or months and years, with the core's
 * `viewMode`).
 *
 * The applied selection is `options.dates`. With `autoApply: false`, picks
 * waiting for the Apply button are in `picker.datePicked`, and applied dates
 * unpicked before Apply are in `unpicked`; Cancel (or closing) drops both.
 */
export class MSelectPlugin extends BasePlugin implements IPlugin {
  public binds = {
    getDates: this.getDates.bind(this),
    setDates: this.setDates.bind(this),
    addDates: this.addDates.bind(this),
    addDate: this.addDate.bind(this),
    removeDate: this.removeDate.bind(this),
    parseValues: this.parseValues.bind(this),
    updateValues: this.updateValues.bind(this),
    clear: this.clear.bind(this),
    onClickCalendarDay: this.onClickCalendarDay.bind(this),
    onClickApplyButton: this.onClickApplyButton.bind(this),
    onView: this.onView.bind(this),
    onHide: this.onHide.bind(this),
  };

  // The core methods this plugin replaces, restored on detach.
  private overridden: Record<string, unknown> = {};

  public options: IMSelectConfig = {
    dates: [],
    max: null,
    delimiter: ';',
    sort: null,
    inputFormat: null,
    useWrapper: false,
    locale: {
      remove: '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.46445 15.5354L15.5355 8.46436" stroke-width="1.5" stroke-linecap="round" /><path d="M8.46446 8.46458L15.5355 15.5356" stroke-width="1.5" stroke-linecap="round" /></svg>',
      removeLabel: 'Remove',
    },
    itemTemplate: null,
  };

  /** Applied dates unpicked in the calendar, waiting for the Apply button. */
  public unpicked: DateTime[] = [];

  /** With `useWrapper`, the element listing the dates in place of the input. */
  public wrapper: HTMLElement;

  private warnedRangePlugin = false;

  // With `useWrapper`, the picker wrapper's position before attaching.
  private wrapperPosition: string;

  /**
   * Returns plugin name
   *
   * @returns String
   */
  public getName(): string {
    return 'MSelectPlugin';
  }

  /**
   * - Called automatically via BasePlugin.attach() -
   * The function execute on initialize the picker
   */
  public onAttach(): void {
    const methods = {
      getDates: this.binds.getDates,
      setDates: this.binds.setDates,
      addDates: this.binds.addDates,
      addDate: this.binds.addDate,
      removeDate: this.binds.removeDate,
      parseValues: this.binds.parseValues,
      updateValues: this.binds.updateValues,
      clear: this.binds.clear,
      onClickCalendarDay: this.binds.onClickCalendarDay,
      onClickApplyButton: this.binds.onClickApplyButton,
    };

    for (const [name, value] of Object.entries(methods)) {
      this.overridden[name] = Object.getOwnPropertyDescriptor(this.picker, name);
      Object.defineProperty(this.picker, name, { configurable: true, writable: true, value });
    }

    if (this.options.useWrapper) {
      this.createWrapper();
    }

    this.picker.on('view', this.binds.onView);
    this.picker.on('hide', this.binds.onHide);
  }

  /**
   * - Called automatically via BasePlugin.detach() -
   */
  public onDetach(): void {
    for (const [name, descriptor] of Object.entries(this.overridden)) {
      if (descriptor) {
        Object.defineProperty(this.picker, name, descriptor as PropertyDescriptor);
      } else {
        // Back to the prototype's method.
        Reflect.deleteProperty(this.picker, name);
      }
    }
    this.overridden = {};

    if (this.wrapper) {
      const element = this.picker.options.element as HTMLElement;
      element.style.position = element.dataset.easepickStorePosition || '';
      element.style.visibility = element.dataset.easepickStoreVisibility || '';
      delete element.dataset.easepickStorePosition;
      delete element.dataset.easepickStoreVisibility;

      this.wrapper.remove();
      this.wrapper = null;
      this.picker.ui.wrapper.style.position = this.wrapperPosition;
    }

    this.picker.off('view', this.binds.onView);
    this.picker.off('hide', this.binds.onHide);
  }

  /**
   * Returns the selected dates, sorted by the `sort` option
   *
   * @param format string to return formatted dates instead
   * @returns DateTime[] | String[]
   */
  public getDates(format?: string) {
    const dates = this.selected().map(d => d.clone());

    return format ? dates.map(d => d.format(format, this.picker.options.lang)) : dates;
  }

  /**
   * Replaces the selected dates
   *
   * @param dates
   * @param format of string dates; defaults to `inputFormat`
   */
  public setDates(dates: MSelectDate[], format?: string) {
    this.options.dates = dates.map(d => this.toDate(d, format));
    this.onChange();
  }

  /**
   * Adds dates to the selection
   *
   * @param dates
   * @param format of string dates; defaults to `inputFormat`
   */
  public addDates(dates: MSelectDate[], format?: string) {
    this.options.dates = [...this.selected(), ...dates.map(d => this.toDate(d, format))];
    this.onChange();
  }

  /**
   * Adds a date to the selection
   *
   * @param date
   * @param format of a string date; defaults to `inputFormat`
   */
  public addDate(date: MSelectDate, format?: string) {
    this.addDates([date], format);
  }

  /**
   * Removes a date from the selection
   *
   * @param date
   * @param format of a string date; defaults to `inputFormat`
   */
  public removeDate(date: MSelectDate, format?: string) {
    const d = this.toDate(date, format);

    this.options.dates = this.selected().filter(x => !this.isSame(x, d));
    this.onChange();
  }

  /**
   * Parse the `dates` option, or the value of the input element
   */
  public parseValues() {
    const { element } = this.picker.options;

    if (this.options.dates.length) {
      this.options.dates = this.options.dates.map(d => this.toDate(d));
    } else if (element instanceof HTMLInputElement && element.value.length) {
      // The input holds dates written by updateValues(), in the picker's format.
      this.options.dates = element.value
        .split(this.options.delimiter)
        .map(x => x.trim())
        .filter(x => x.length)
        .map(x => new DateTime(x, this.picker.options.format, this.picker.options.lang));
    }

    this.options.dates = this.normalize(this.options.dates as DateTime[]);

    // Open on the first selected date.
    if (this.options.dates.length) {
      const first = [...this.selected()].sort((a, b) => a.getTime() - b.getTime())[0];
      this.picker.calendars[0] = first.clone();
    }

    this.updateValues();
  }

  /**
   * Update value of input element, and the wrapper's list
   */
  public updateValues() {
    const el = this.picker.options.element;
    const value = this.getDates(this.picker.options.format).join(this.options.delimiter);

    // The input keeps the value with `useWrapper` too, for form submission.
    if (el instanceof HTMLInputElement) {
      el.value = value;
    } else if (el instanceof HTMLElement) {
      el.innerText = value;
    }

    if (this.wrapper) {
      this.wrapper.replaceChildren(...this.getDates().map(d => this.getItem(d)));
    }
  }

  /**
   * Clear selection
   */
  public clear() {
    this.options.dates = [];
    this.picker.datePicked.length = 0;
    this.unpicked.length = 0;
    this.updateValues();
    this.picker.renderAll();
    this.picker.trigger('clear');
  }

  /**
   * Toggles a day (or month, or year) on click
   *
   * @param element
   */
  public onClickCalendarDay(element: HTMLElement) {
    if (!this.picker.isCalendarDay(element) && !this.picker.isCalendarPeriod(element)) return;
    // LockPlugin's days, and days past `max`.
    if (['locked', 'not-available'].some(x => element.classList.contains(x))) return;

    const date = new DateTime(element.dataset.time);
    const isShown = this.isShownSelected(date);

    // Nothing more can be added once `max` dates are selected.
    if (!isShown && this.isFull()) return;

    if (this.picker.options.autoApply) {
      this.options.dates = isShown
        ? this.selected().filter(d => !this.isSame(d, date))
        : [...this.selected(), date];

      this.updateValues();
      this.picker.renderAll();
      this.picker.trigger('select', { dates: this.getDates() });
      return;
    }

    const { datePicked } = this.picker;

    if (this.includes(datePicked, date)) {
      this.picker.datePicked = datePicked.filter(d => !this.isSame(d, date));
    } else if (this.includes(this.unpicked, date)) {
      this.unpicked = this.unpicked.filter(d => !this.isSame(d, date));
    } else if (isShown) {
      this.unpicked.push(date);
    } else {
      datePicked.push(date);
    }

    this.picker.renderAll();
    this.picker.trigger('preselect', { dates: this.pending() });
  }

  /**
   * Applies the pending picks and unpicks (`autoApply: false`)
   *
   * @param element
   */
  public onClickApplyButton(element: HTMLElement) {
    if (!this.picker.isApplyButton(element)) return;

    this.options.dates = this.pending();
    this.picker.datePicked.length = 0;
    this.unpicked.length = 0;

    this.updateValues();
    this.picker.hide();
    this.picker.trigger('select', { dates: this.getDates() });
  }

  /**
   * Fired on `view` event
   *
   * @param event
   */
  private onView(event: CustomEvent) {
    const { view, target }: IEventDetail = event.detail;

    if (view === 'Main' && !this.warnedRangePlugin && this.picker.PluginManager.getInstance('RangePlugin')) {
      this.warnedRangePlugin = true;
      console.warn('easepick: MSelectPlugin does not support RangePlugin; use one or the other.');
    }

    if (['CalendarDay', 'CalendarMonth', 'CalendarYear'].includes(view) && target.dataset.time) {
      const date = new DateTime(target.dataset.time);
      // The core marks its own (single) date: show this plugin's selection.
      const selected = this.isShownSelected(date);
      target.classList.toggle('selected', selected);

      if (!selected && this.isFull()) {
        target.classList.add('not-available');
      }
    }

    if (view === 'Footer') {
      const applyButton = target.querySelector('.apply-button') as HTMLButtonElement;

      if (applyButton) {
        applyButton.disabled = !this.picker.datePicked.length && !this.unpicked.length;
      }
    }
  }

  /**
   * Fired on `hide` event: drops the pending unpicks (the core drops picks)
   */
  private onHide() {
    if (this.unpicked.length) {
      this.unpicked.length = 0;
      this.picker.renderAll();
    }
  }

  /**
   * The applied dates as DateTime (`options.dates` holds them once parsed)
   */
  private selected(): DateTime[] {
    return this.options.dates as DateTime[];
  }

  /**
   * The selection shown in the calendar: applied dates, without the pending
   * unpicks, with the pending picks
   */
  private pending(): DateTime[] {
    return this.normalize([
      ...this.selected().filter(d => !this.includes(this.unpicked, d)),
      ...this.picker.datePicked,
    ]);
  }

  private isShownSelected(date: DateTime): boolean {
    return this.includes(this.pending(), date);
  }

  private isFull(): boolean {
    return Boolean(this.options.max) && this.pending().length >= this.options.max;
  }

  /**
   * Same day, or month and year with the core's `viewMode`
   */
  private isSame(a: DateTime, b: DateTime): boolean {
    switch (this.picker.options.viewMode) {
      case 'year':
        return a.getFullYear() === b.getFullYear();

      case 'month':
        return a.isSame(b, 'month');

      default:
        return a.isSame(b, 'day');
    }
  }

  private includes(dates: DateTime[], date: DateTime): boolean {
    return dates.some(d => this.isSame(d, date));
  }

  /**
   * Drops duplicates, keeps at most `max` dates and sorts them by `sort`
   */
  private normalize(dates: DateTime[]): DateTime[] {
    const unique = dates.filter((d, i) => dates.findIndex(x => this.isSame(x, d)) === i);
    const limited = this.options.max ? unique.slice(0, this.options.max) : unique;

    if (this.options.sort === 'asc' || this.options.sort === 'desc') {
      const dir = this.options.sort === 'asc' ? 1 : -1;
      limited.sort((a, b) => (a.getTime() - b.getTime()) * dir);
    }

    return limited;
  }

  private toDate(date: MSelectDate, format?: string): DateTime {
    return new DateTime(
      date,
      format || this.options.inputFormat || this.picker.options.format,
      this.picker.options.lang,
    );
  }

  /**
   * After an API change: tidy the dates, then show them
   */
  private onChange() {
    this.options.dates = this.normalize(this.selected());
    this.updateValues();
    this.picker.renderAll();
  }

  /**
   * Shows the dates as removable items in place of the input (`useWrapper`)
   */
  private createWrapper() {
    const element = this.picker.options.element as HTMLElement;

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'mselect-wrapper';
    this.wrapper.style.width = `${element.offsetWidth}px`;
    this.wrapper.style.minHeight = `${element.offsetHeight}px`;
    this.wrapper.addEventListener('click', () => this.picker.show());
    this.picker.ui.shadowRoot.prepend(this.wrapper);

    // The list takes the input's place in the page, so the picker wrapper
    // (absolute, around the popup) joins the flow; the popup still opens
    // relative to it. The list is what show() positions the popup under.
    this.wrapperPosition = this.picker.ui.wrapper.style.position;
    this.picker.ui.wrapper.style.position = 'relative';

    const show = Object.getPrototypeOf(this.picker).show;
    this.overridden.show = Object.getOwnPropertyDescriptor(this.picker, 'show');
    Object.defineProperty(this.picker, 'show', {
      configurable: true,
      writable: true,
      value: (event?) => show.call(this.picker, event && event.target !== element ? event : { target: this.wrapper }),
    });

    if (element.style.position) {
      element.dataset.easepickStorePosition = element.style.position;
    }

    if (element.style.visibility) {
      element.dataset.easepickStoreVisibility = element.style.visibility;
    }

    element.style.position = 'absolute';
    element.style.visibility = 'hidden';
  }

  /**
   * An item of the wrapper's list: `itemTemplate`, or the date and a
   * remove button
   *
   * @param date
   * @returns HTMLElement
   */
  private getItem(date: DateTime): HTMLElement {
    if (typeof this.options.itemTemplate === 'function') {
      return this.options.itemTemplate(date);
    }

    const text = date.format(this.picker.options.format, this.picker.options.lang);

    const item = document.createElement('div');
    item.className = 'mselect-item';

    const label = document.createElement('span');
    label.textContent = text;
    item.appendChild(label);

    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = this.options.locale.remove;
    button.setAttribute('aria-label', `${this.options.locale.removeLabel} ${text}`);
    button.addEventListener('click', (evt) => {
      // Don't open the picker (the wrapper's click).
      evt.stopPropagation();

      this.options.dates = this.selected().filter(d => !this.isSame(d, date));
      this.updateValues();
      this.picker.renderAll();
      this.picker.trigger('select', { dates: this.getDates() });
    });
    item.appendChild(button);

    return item;
  }
}

export { IMSelectConfig, MSelectDate };
