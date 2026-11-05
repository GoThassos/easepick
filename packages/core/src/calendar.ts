import { Core } from './core';
import { DateTime } from '@gothassos/easepick-datetime';

export default class Calendar {
  public picker: Core;

  constructor(picker: Core) {
    this.picker = picker;
  }

  /**
   * Render transferred date and view
   *
   * @param date
   * @param view
   */
  public render(date: DateTime, view: string): void {
    if (!date) {
      date = new DateTime();
    }

    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    // find function for view
    if (typeof this[`get${view}View`] === 'function') {
      this[`get${view}View`](date);
    }
  }

  /**
   * Function for `Container` view
   *
   * @param date
   */
  public getContainerView(date: DateTime): void {
    this.picker.ui.container.innerHTML = '';

    if (this.picker.options.header) {
      this.picker.trigger('render', { date: date.clone(), view: 'Header' });
    }

    this.picker.trigger('render', { date: date.clone(), view: 'Main' });

    if (!this.picker.options.autoApply) {
      this.picker.trigger('render', { date: date.clone(), view: 'Footer' });
    }
  }

  /**
   * Function for `Header` view
   *
   * @param date
   */
  public getHeaderView(date: DateTime): void {
    const element = document.createElement('header');

    if (this.picker.options.header instanceof HTMLElement) {
      element.appendChild(this.picker.options.header);
    }

    if (typeof this.picker.options.header === 'string') {
      element.innerHTML = this.picker.options.header;
    }

    this.picker.ui.container.appendChild(element);
    this.picker.trigger('view', { target: element, date: date.clone(), view: 'Header' });
  }

  /**
   * Function for `Main` view
   *
   * @param date
   */
  public getMainView(date: DateTime): void {
    const main = document.createElement('main');
    this.picker.ui.container.appendChild(main);

    const calendars = document.createElement('div');
    calendars.className = `calendars grid-${this.picker.options.grid}`;

    const { viewMode } = this.picker.options;

    if (viewMode === 'month' || viewMode === 'year') {
      // A single calendar: the months of a year, or the years of a decade.
      const calendar = document.createElement('div');
      calendar.className = 'calendar';
      calendars.appendChild(calendar);

      const calendarHeader = this.getCalendarHeaderView(date.clone());
      calendar.appendChild(calendarHeader);
      this.picker.trigger('view', { date: date.clone(), view: 'CalendarHeader', index: 0, target: calendarHeader });

      const grid = viewMode === 'month'
        ? this.getCalendarMonthsView(date.clone())
        : this.getCalendarYearsView(date.clone());
      calendar.appendChild(grid);
      this.picker.trigger('view', {
        date: date.clone(),
        view: viewMode === 'month' ? 'CalendarMonths' : 'CalendarYears',
        index: 0,
        target: grid,
      });

      this.picker.trigger('view', { date: date.clone(), view: 'CalendarItem', index: 0, target: calendar });
    }

    for (let i = 0; viewMode !== 'month' && viewMode !== 'year' && i < this.picker.options.calendars; i++) {
      const month = document.createElement('div');
      month.className = 'calendar';
      calendars.appendChild(month);

      const calendarHeader = this.getCalendarHeaderView(date.clone());
      month.appendChild(calendarHeader);
      this.picker.trigger('view', {
        date: date.clone(),
        view: 'CalendarHeader',
        index: i,
        target: calendarHeader,
      });

      const dayNames = this.getCalendarDayNamesView();
      month.appendChild(dayNames);
      this.picker.trigger('view', {
        date: date.clone(),
        view: 'CalendarDayNames',
        index: i,
        target: dayNames,
      });

      const daysView = this.getCalendarDaysView(date.clone());
      month.appendChild(daysView);
      this.picker.trigger('view', {
        date: date.clone(),
        view: 'CalendarDays',
        index: i,
        target: daysView,
      });

      const calendarFooter = this.getCalendarFooterView();
      month.appendChild(calendarFooter);
      this.picker.trigger('view', {
        date: date.clone(),
        view: 'CalendarFooter',
        index: i,
        target: calendarFooter,
      });

      this.picker.trigger('view', {
        date: date.clone(),
        view: 'CalendarItem',
        index: i,
        target: month,
      });

      date.add(1, 'month');
    }

    main.appendChild(calendars);

    this.picker.trigger('view', { date: date.clone(), view: 'Calendars', target: calendars });
    this.picker.trigger('view', { date: date.clone(), view: 'Main', target: main });
  }

  /**
   * Function for `Footer` view
   *
   * @param date
   */
  public getFooterView(date: DateTime): void {
    const element = document.createElement('footer');

    const buttons = document.createElement('div');
    buttons.className = 'footer-buttons';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-button unit';
    cancelButton.innerHTML = this.picker.options.locale.cancel;
    buttons.appendChild(cancelButton);

    const applyButton = document.createElement('button');
    applyButton.className = 'apply-button unit';
    applyButton.innerHTML = this.picker.options.locale.apply;
    applyButton.disabled = true;
    buttons.appendChild(applyButton);
    element.appendChild(buttons);

    this.picker.ui.container.appendChild(element);
    this.picker.trigger('view', { date, target: element, view: 'Footer' });
  }

  /**
   * Month name as used in a "month year" title.
   *
   * `toLocaleString(lang, { month: 'long' })` returns the genitive form in
   * some languages (Greek: "Νοεμβρίου" instead of "Νοέμβριος"), so the name
   * is taken from a month + year format, which uses the form the language
   * puts in front of a year. Languages that write the month as a number
   * there (ja, zh, ko: "11") fall back to the month on its own ("11月").
   *
   * @param date
   * @param lang
   * @returns string
   */
  public getMonthTitle(date: DateTime, lang: string): string {
    const options: Intl.DateTimeFormatOptions = { calendar: 'gregory', month: 'long' };
    const month = new Intl.DateTimeFormat(lang, { ...options, year: 'numeric' })
      .formatToParts(date)
      .find(part => part.type === 'month');

    if (month && !/^\d+$/.test(month.value)) {
      return month.value;
    }

    return new Intl.DateTimeFormat(lang, options).format(date);
  }

  /**
   * Function for `CalendarHeader` view
   *
   * @param date
   * @returns HTMLElement
   */
  public getCalendarHeaderView(date: DateTime): HTMLElement {
    const element = document.createElement('div');
    element.className = 'header';

    const monthName = document.createElement('div');
    monthName.className = 'month-name';
    const title = document.createElement('span');

    if (this.picker.options.viewMode === 'month') {
      title.textContent = date.format('YYYY');
      monthName.append(title);
    } else if (this.picker.options.viewMode === 'year') {
      const decade = this.getDecadeStart(date);
      title.textContent = `${decade} – ${decade + 9}`;
      monthName.append(title);
    } else {
      // Keep the `<span>month</span> year` structure: AmpPlugin replaces
      // childNodes[0] (month) and childNodes[1] (year) with dropdowns.
      title.textContent = this.getMonthTitle(date, this.picker.options.lang);
      monthName.append(title, ` ${date.format('YYYY')}`);
    }

    element.appendChild(monthName);

    const prevMonth = document.createElement('button');
    prevMonth.className = 'previous-button unit';
    prevMonth.innerHTML = this.picker.options.locale.previousMonth;
    element.appendChild(prevMonth);

    const nextMonth = document.createElement('button');
    nextMonth.className = 'next-button unit';
    nextMonth.innerHTML = this.picker.options.locale.nextMonth;
    element.appendChild(nextMonth);

    return element;
  }

  /**
   * Function for `CalendarDayNames` view
   *
   * @param date
   * @returns HTMLElement
   */
  public getCalendarDayNamesView(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'daynames-row';

    for (let w = 1; w <= 7; w++) {
      // 7 days, 4 is «Thursday» (new Date(1970, 0, 1, 12, 0, 0, 0))
      const dayIdx = 7 - 4 + this.picker.options.firstDay + w;

      const dayName = document.createElement('div');
      dayName.className = 'dayname';
      dayName.innerHTML = new Date(1970, 0, dayIdx, 12, 0, 0, 0)
        .toLocaleString(this.picker.options.lang, { weekday: 'short' });

      dayName.title = new Date(1970, 0, dayIdx, 12, 0, 0, 0)
        .toLocaleString(this.picker.options.lang, { weekday: 'long' });

      element.appendChild(dayName);

      this.picker.trigger('view', { dayIdx, view: 'CalendarDayName', target: dayName });
    }

    return element;
  }

  /**
   * Function for `CalendarDays` view
   *
   * @param date
   * @returns HTMLElement
   */
  public getCalendarDaysView(date: DateTime): HTMLElement {
    const element = document.createElement('div');
    element.className = 'days-grid';
    const { firstDay, showOffsetDays } = this.picker.options;
    const year = date.getFullYear();
    const month = date.getMonth();
    const offsetDays = this.calcOffsetDays(date, firstDay);
    const totalDays = 32 - new Date(year, month, 32).getDate();

    // Leading cells: the end of the previous month (day 0 is its last day).
    for (let idx = 0; idx < offsetDays; idx++) {
      element.appendChild(this.getCalendarOffsetDayView(new Date(year, month, idx - offsetDays + 1)));
    }

    for (let idx = 1; idx <= totalDays; idx++) {
      date.setDate(idx);

      const calendarDay = this.getCalendarDayView(date);

      element.appendChild(calendarDay);

      this.picker.trigger('view', { date, view: 'CalendarDay', target: calendarDay });
    }

    // Trailing cells: the start of the next month, to complete the last week.
    if (showOffsetDays) {
      const trailingDays = (7 - ((offsetDays + totalDays) % 7)) % 7;

      for (let idx = 1; idx <= trailingDays; idx++) {
        element.appendChild(this.getCalendarOffsetDayView(new Date(year, month, totalDays + idx)));
      }
    }

    return element;
  }

  /**
   * Function for an offset cell (a day outside the displayed month).
   * Not a `.day`: it is not selectable and carries no `data-time`.
   *
   * @param date
   * @returns HTMLElement
   */
  public getCalendarOffsetDayView(date: Date): HTMLElement {
    const element = document.createElement('div');
    element.className = 'offset';

    if (this.picker.options.showOffsetDays) {
      element.textContent = String(date.getDate());
    }

    return element;
  }

  /**
   * Function for `CalendarDay` view
   *
   * @param date
   * @returns HTMLElement
   */
  public getCalendarDayView(date: DateTime): HTMLElement {
    const optionsDate = this.picker.options.date ? new DateTime(this.picker.options.date) : null;
    const today = new DateTime();

    const element = document.createElement('div');
    element.className = 'day unit';
    element.innerHTML = date.format('D');
    element.dataset.time = String(date.getTime());

    if (date.isSame(today, 'day')) {
      element.classList.add('today');
    }

    if ([0, 6].includes(date.getDay())) {
      element.classList.add('weekend');
    }

    if (this.picker.datePicked.length) {
      if (this.picker.datePicked[0].isSame(date, 'day')) {
        element.classList.add('selected');
      }
    } else {
      if (optionsDate && date.isSame(optionsDate, 'day')) {
        element.classList.add('selected');
      }
    }

    this.picker.trigger('view', { date, view: 'CalendarDay', target: element });

    return element;
  }

  /**
   * Function for `CalendarMonths` view (viewMode: 'month'):
   * the 12 months of the year, in a 4×3 grid.
   *
   * @param date
   * @returns HTMLElement
   */
  public getCalendarMonthsView(date: DateTime): HTMLElement {
    const element = document.createElement('div');
    element.className = 'months-grid';

    for (let m = 0; m < 12; m++) {
      const month = new DateTime(new Date(date.getFullYear(), m, 1));
      const view = this.getCalendarPeriodView(
        month,
        'month',
        month.toLocaleString(this.picker.options.lang, { month: 'short' }),
        `${this.getMonthTitle(month, this.picker.options.lang)} ${month.format('YYYY')}`,
      );

      element.appendChild(view);
      this.picker.trigger('view', { date: month, view: 'CalendarMonth', target: view });
    }

    return element;
  }

  /**
   * Function for `CalendarYears` view (viewMode: 'year'):
   * the decade, with the years just before and after it, in a 4×3 grid.
   *
   * @param date
   * @returns HTMLElement
   */
  public getCalendarYearsView(date: DateTime): HTMLElement {
    const element = document.createElement('div');
    element.className = 'years-grid';
    const decade = this.getDecadeStart(date);

    for (let y = decade - 1; y <= decade + 10; y++) {
      const year = new DateTime(new Date(y, 0, 1));
      const view = this.getCalendarPeriodView(year, 'year', String(y), String(y));

      if (y < decade || y > decade + 9) {
        view.classList.add('outside');
      }

      element.appendChild(view);
      this.picker.trigger('view', { date: year, view: 'CalendarYear', target: view });
    }

    return element;
  }

  /**
   * A month or year cell, marked `today` and `selected` like a day.
   *
   * @param date first day of the period
   * @param unit
   * @param text
   * @param title
   * @returns HTMLElement
   */
  private getCalendarPeriodView(date: DateTime, unit: 'month' | 'year', text: string, title: string): HTMLElement {
    const isSame = (a: Date, b: Date) => a.getFullYear() === b.getFullYear()
      && (unit === 'year' || a.getMonth() === b.getMonth());
    const selected = this.picker.datePicked.length
      ? this.picker.datePicked[0]
      : (this.picker.options.date ? new DateTime(this.picker.options.date) : null);

    const element = document.createElement('div');
    element.className = `${unit} unit`;
    element.textContent = text;
    element.title = title;
    element.dataset.time = String(date.getTime());

    if (isSame(date, new Date())) {
      element.classList.add('today');
    }

    if (selected && isSame(date, selected)) {
      element.classList.add('selected');
    }

    return element;
  }

  /**
   * First year of the decade holding the date (2026 → 2020).
   *
   * @param date
   * @returns number
   */
  public getDecadeStart(date: Date): number {
    return Math.floor(date.getFullYear() / 10) * 10;
  }

  /**
   * Function for `CalendarFooter` view
   *
   * @returns HTMLElement
   */
  public getCalendarFooterView(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'footer';

    return element;
  }

  /**
   * Count the number of days of indentation
   *
   * @param date
   * @param firstDay
   * @returns Number
   */
  public calcOffsetDays(date: DateTime, firstDay: number): number {
    let total = date.getDay() - firstDay;
    if (total < 0) total += 7;

    return total;
  }
}
