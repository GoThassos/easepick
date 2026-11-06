import { BasePlugin, IEventDetail, IPlugin } from '@gothassos/easepick-base-plugin';
import { LockPlugin } from '@gothassos/easepick-lock-plugin';
import { RangePlugin } from '@gothassos/easepick-range-plugin';
import { DateTime } from '@gothassos/easepick-datetime';
import { IAmpPlugin } from './interface';
import './index.scss';

type GridMode = 'months' | 'years';

// The month or year grid shown in place of a calendar's days
// (dropdown.months / dropdown.years: 'grid').
interface IGridState {
  mode: GridMode;
  // Calendar that shows the grid.
  index: number;
  // Months: the year shown. Years: a year of the decade shown.
  year: number;
  // The years grid was opened from the months grid's title: picking a
  // year goes back to the months of that year.
  fromMonths?: boolean;
}

export class AmpPlugin extends BasePlugin implements IPlugin {
  public rangePlugin: RangePlugin;
  public lockPlugin: LockPlugin;
  public priority = 10;

  protected grid: IGridState = null;

  public binds = {
    onView: this.onView.bind(this),
    onColorScheme: this.onColorScheme.bind(this),
    onHide: this.onHide.bind(this),
  }

  public options: IAmpPlugin = {
    dropdown: {
      months: false,
      years: false,
      minYear: 1950,
      maxYear: null,
    },
    darkMode: true,
    locale: {
      resetButton: `<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>`,
      week: 'Wk',
      month: 'Month',
      year: 'Year',
      resetButtonLabel: 'Clear selection',
    },
  };

  protected matchMedia;

  /**
   * Returns plugin name
   *
   * @returns String
   */
  public getName(): string {
    return 'AmpPlugin';
  }

  /**
   * - Called automatically via BasePlugin.attach() -
   * The function execute on initialize the picker
   */
  public onAttach(): void {
    if (this.options.darkMode && window && 'matchMedia' in window) {
      this.matchMedia = window.matchMedia('(prefers-color-scheme: dark)');

      if (this.matchMedia.matches) {
        this.picker.ui.container.dataset.theme = 'dark';
      }

      this.matchMedia.addEventListener('change', this.binds.onColorScheme);
    }

    if (this.options.weekNumbers) {
      this.picker.ui.container.classList.add('week-numbers');
    }

    this.picker.on('view', this.binds.onView);
    this.picker.on('hide', this.binds.onHide);
  }

  /**
   * - Called automatically via BasePlugin.detach() -
   */
  public onDetach(): void {
    if (this.options.darkMode && window && 'matchMedia' in window) {
      this.matchMedia.removeEventListener('change', this.binds.onColorScheme);
    }

    this.picker.ui.container.removeAttribute('data-theme');
    this.picker.ui.container.classList.remove('week-numbers');

    this.picker.off('view', this.binds.onView);
    this.picker.off('hide', this.binds.onHide);
    this.grid = null;
  }

  /**
   * Function `view` event
   * Adds `tabIndex` to the picker elements
   *
   * @param event
   */
  private onView(event: CustomEvent) {
    this.lockPlugin = this.picker.PluginManager.getInstance('LockPlugin');
    this.rangePlugin = this.picker.PluginManager.getInstance('RangePlugin');

    this.handleDropdown(event);
    this.handleResetButton(event);
    this.handleWeekNumbers(event);
    this.handleGrid(event);
  }

  /**
   * Closing the picker closes an open grid, so it reopens on the days.
   */
  private onHide() {
    if (this.grid) {
      this.grid = null;
      this.picker.renderAll();
    }
  }

  /**
   *
   * @param evt
   */
  private onColorScheme(evt) {
    const colorScheme = evt.matches ? 'dark' : 'light';
    this.picker.ui.container.dataset.theme = colorScheme;
  }

  /**
   *
   * @param evt
   */
  public handleDropdown(evt) {
    const { view, target, date, index }: IEventDetail = evt.detail;
    const viewMode = this.picker.options.viewMode;

    // Month/year dropdowns belong to the day view; the month and year views
    // (viewMode: 'month' | 'year') already are month and year pickers.
    if (view === 'CalendarHeader' && (!viewMode || viewMode === 'day')) {
      const monthNameWrapper = target.querySelector('.month-name');

      if (this.options.dropdown.months === 'grid') {
        monthNameWrapper.childNodes[0].remove();
        monthNameWrapper.prepend(this.getGridButton('months', this.getMonthTitle(date), () => {
          this.openGrid({ mode: 'months', index, year: date.getFullYear() });
        }));
      } else if (this.options.dropdown.months) {
        monthNameWrapper.childNodes[0].remove();

        const selectMonths = document.createElement('select');
        selectMonths.className = 'month-name--select month-name--dropdown unit';
        selectMonths.setAttribute('aria-label', this.options.locale.month);

        for (let x = 0; x < 12; x += 1) {
          const option = document.createElement('option');
          // day 2 due to iOS bug (?) with `toLocaleString`
          const monthName = new DateTime(new Date(date.getFullYear(), x, 2, 0, 0, 0));
          const optionMonth = new DateTime(new Date(date.getFullYear(), x, 1, 0, 0, 0));

          option.value = String(x);
          option.text = this.getMonthTitle(monthName);

          if (this.lockPlugin) {
            option.disabled = (this.lockPlugin.options.minDate
              && optionMonth.isBefore(new DateTime(this.lockPlugin.options.minDate), 'month'))
              || (this.lockPlugin.options.maxDate && optionMonth.isAfter(new DateTime(this.lockPlugin.options.maxDate), 'month'));
          }

          option.selected = optionMonth.getMonth() === date.getMonth();

          selectMonths.appendChild(option);
        }

        selectMonths.addEventListener('change', (e) => {
          const target = e.target as HTMLSelectElement;

          this.picker.calendars[0].add(index, 'months');
          this.picker.calendars[0].setDate(1);
          this.picker.calendars[0].setMonth(Number(target.value));
          this.picker.calendars[0].subtract(index, 'months');
          this.picker.renderAll();
        });

        monthNameWrapper.prepend(selectMonths);
      }

      if (this.options.dropdown.years === 'grid') {
        monthNameWrapper.childNodes[1].remove();
        monthNameWrapper.appendChild(this.getGridButton('years', date.format('YYYY'), () => {
          this.openGrid({ mode: 'years', index, year: date.getFullYear() });
        }));
      } else if (this.options.dropdown.years) {
        monthNameWrapper.childNodes[1].remove();

        const selectYears = document.createElement('select');
        selectYears.className = 'month-name--select unit';
        selectYears.setAttribute('aria-label', this.options.locale.year);

        const minYear = this.options.dropdown.minYear;
        const maxYear = this.options.dropdown.maxYear ? this.options.dropdown.maxYear : (new Date()).getFullYear();

        if (date.getFullYear() > maxYear) {
          const option = document.createElement('option');
          option.value = String(date.getFullYear());
          option.text = String(date.getFullYear());
          option.selected = true;
          option.disabled = true;

          selectYears.appendChild(option);
        }

        for (let x = maxYear; x >= minYear; x -= 1) {
          const option = document.createElement('option');
          const optionYear = new DateTime(new Date(x, 0, 1, 0, 0, 0));
          option.value = String(x);
          option.text = String(x);

          if (this.lockPlugin) {
            option.disabled = (this.lockPlugin.options.minDate
              && optionYear.isBefore(new DateTime(this.lockPlugin.options.minDate), 'year'))
              || (this.lockPlugin.options.maxDate
                && optionYear.isAfter(new DateTime(this.lockPlugin.options.maxDate), 'year'));
          }

          option.selected = date.getFullYear() === x;

          selectYears.appendChild(option);
        }

        if (date.getFullYear() < minYear) {
          const option = document.createElement('option');
          option.value = String(date.getFullYear());
          option.text = String(date.getFullYear());
          option.selected = true;
          option.disabled = true;

          selectYears.appendChild(option);
        }

        if (this.options.dropdown.years === 'asc') {
          const childs = Array.prototype.slice.call(selectYears.childNodes);
          const options = childs.reverse();
          selectYears.innerHTML = '';
          options.forEach((y) => {
            y.innerHTML = y.value;
            selectYears.appendChild(y);
          });
        }

        selectYears.addEventListener('change', (e) => {
          const target = e.target as HTMLSelectElement;

          this.picker.calendars[0].add(index, 'months');
          this.picker.calendars[0].setFullYear(Number(target.value));
          this.picker.calendars[0].subtract(index, 'months');
          this.picker.renderAll();
        });

        monthNameWrapper.appendChild(selectYears);
      }
    }
  }

  /**
   * Month name in the nominative form (Greek: "Νοέμβριος", not "Νοεμβρίου").
   * Falls back to `toLocaleString` on older core versions without
   * Calendar.getMonthTitle.
   *
   * @param date
   */
  private getMonthTitle(date: DateTime): string {
    return typeof this.picker.Calendar.getMonthTitle === 'function'
      ? this.picker.Calendar.getMonthTitle(date, this.picker.options.lang)
      : date.toLocaleString(this.picker.options.lang, { month: 'long' });
  }

  /**
   * A title button that opens the months or years grid.
   *
   * @param mode
   * @param text
   * @param onClick
   */
  private getGridButton(mode: GridMode, text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `month-name--button month-name--${mode} unit`;
    button.textContent = text;
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', onClick);

    return button;
  }

  /**
   * Shows a grid in place of a calendar's days, and focuses it.
   *
   * @param state
   */
  private openGrid(state: IGridState) {
    this.grid = state;
    this.picker.renderAll();
    this.focusGrid();
  }

  /**
   * Back to the days. `focus` is the title button to focus.
   *
   * @param focus
   */
  private closeGrid(focus: GridMode) {
    const { index } = this.grid;
    this.grid = null;
    this.picker.renderAll();

    const button = this.getCalendar(index)?.querySelector<HTMLElement>(`.month-name--${focus}`);
    button?.focus();
  }

  /**
   * Shows `month` of `year` in calendar `index`; the others follow it.
   *
   * @param index
   * @param year
   * @param month
   */
  private showMonth(index: number, year: number, month: number) {
    this.picker.calendars[0].setFullYear(year, month - index, 1);
  }

  /**
   * @param index
   * @returns the calendar element at `index`
   */
  private getCalendar(index: number): HTMLElement {
    return this.picker.ui.container.querySelectorAll<HTMLElement>('.calendars > .calendar')[index];
  }

  /**
   * Focuses the shown month or year in the open grid, or else its first
   * cell that can be picked.
   */
  private focusGrid() {
    const grid = this.getCalendar(this.grid.index).querySelector('.amp-grid');
    const cell = grid.querySelector<HTMLElement>('.selected:not(:disabled)')
      || grid.querySelector<HTMLElement>('.amp-grid-cell:not(:disabled)');

    cell?.focus();
  }

  /**
   * First and last year that can be reached: LockPlugin's minDate and
   * maxDate, and in the years grid `dropdown.minYear` and `dropdown.maxYear`
   * too. `null` is no limit.
   *
   * @param mode
   */
  private getYearLimits(mode: GridMode): { min: number, max: number } {
    let min: number = null;
    let max: number = null;

    if (this.lockPlugin?.options.minDate) {
      min = new DateTime(this.lockPlugin.options.minDate).getFullYear();
    }

    if (this.lockPlugin?.options.maxDate) {
      max = new DateTime(this.lockPlugin.options.maxDate).getFullYear();
    }

    if (mode === 'years') {
      const { minYear, maxYear } = this.options.dropdown;
      const lastYear = maxYear ? maxYear : (new Date()).getFullYear();

      if (minYear) min = min === null ? minYear : Math.max(min, minYear);
      max = max === null ? lastYear : Math.min(max, lastYear);
    }

    return { min, max };
  }

  /**
   * Function `view` event: on the calendar that shows a grid, puts the grid
   * over its days and sets up its header.
   *
   * @param event
   */
  private handleGrid(event) {
    const { view, target, date, index }: IEventDetail = event.detail;
    const viewMode = this.picker.options.viewMode;

    if (view !== 'CalendarItem' || !this.grid || this.grid.index !== index
      || (viewMode && viewMode !== 'day')) {
      return;
    }

    // The days stay in place, hidden, so the calendar keeps its size.
    target.classList.add('amp-grid-open');
    this.setGridHeader(target.querySelector('.header'));
    target.appendChild(this.grid.mode === 'months' ? this.getMonthsGrid(date) : this.getYearsGrid(date));

    target.addEventListener('keydown', (evt: KeyboardEvent) => {
      if (evt.code === 'Escape') {
        // Back to the days, rather than closing the picker (KbdPlugin).
        evt.preventDefault();
        evt.stopPropagation();
        this.closeGrid(this.grid.fromMonths ? 'months' : this.grid.mode);
      }
    });
  }

  /**
   * The open grid's title (the year, or the decade) and its previous / next
   * buttons, which step a year or a decade.
   *
   * @param header
   */
  private setGridHeader(header: HTMLElement) {
    const { mode, year, index } = this.grid;
    const decade = Math.floor(year / 10) * 10;
    const monthName = header.querySelector('.month-name');
    monthName.textContent = '';

    if (mode === 'months' && this.options.dropdown.years === 'grid') {
      const button = this.getGridButton('years', String(year), () => {
        this.openGrid({ mode: 'years', index, year: this.grid.year, fromMonths: true });
      });
      monthName.appendChild(button);
    } else {
      const title = document.createElement('span');
      title.textContent = mode === 'months' ? String(year) : `${decade} – ${decade + 9}`;
      monthName.appendChild(title);
    }

    // LockPlugin's classes are about the months of the day view.
    header.classList.remove('no-previous-month', 'no-next-month');

    const { min, max } = this.getYearLimits(mode);
    const first = mode === 'months' ? year : decade;
    const last = mode === 'months' ? year : decade + 9;
    header.classList.toggle('amp-no-previous', min !== null && first <= min);
    header.classList.toggle('amp-no-next', max !== null && last >= max);

    const { locale } = this.picker.options;
    const step = mode === 'months' ? 'Year' : 'Decade';

    ['previous', 'next'].forEach((direction) => {
      const button = header.querySelector<HTMLElement>(`.${direction}-button`);
      button.setAttribute('aria-label', locale[`${direction}${step}Label`]);
      button.addEventListener('click', (evt) => {
        // Stop core from stepping a month.
        evt.stopPropagation();

        const years = mode === 'months' ? 1 : 10;
        this.grid.year += direction === 'next' ? years : -years;
        this.picker.renderAll();

        // Keep the focus on the button, unless the limit now hides it.
        const header = this.getCalendar(index).querySelector('.header');
        if (header.classList.contains(`amp-no-${direction}`)) {
          this.focusGrid();
        } else {
          header.querySelector<HTMLElement>(`.${direction}-button`).focus();
        }
      });
    });
  }

  /**
   * @param mode
   * @returns an empty grid that moves the focus with the arrow keys
   */
  private createGrid(mode: GridMode): HTMLElement {
    const grid = document.createElement('div');
    grid.className = `amp-grid amp-grid--${mode}`;
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', mode === 'months' ? this.options.locale.month : this.options.locale.year);

    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };

    grid.addEventListener('keydown', (evt: KeyboardEvent) => {
      if (!(evt.code in moves)) return;

      evt.preventDefault();
      const cells = [...grid.querySelectorAll<HTMLButtonElement>('.amp-grid-cell')];
      const next = cells[cells.indexOf(evt.target as HTMLButtonElement) + moves[evt.code]];

      if (next && !next.disabled) {
        next.focus();
      }
    });

    return grid;
  }

  /**
   * @param date first day of the period
   * @param unit
   * @param text
   * @param title
   * @param onClick
   * @returns a month or year cell
   */
  private createGridCell(date: Date, unit: 'month' | 'year', text: string, title: string, onClick: () => void) {
    const today = new Date();
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'amp-grid-cell unit';
    cell.textContent = text;
    cell.title = title;
    cell.dataset.time = String(date.getTime());
    cell.setAttribute('aria-label', title);

    if (today.getFullYear() === date.getFullYear() && (unit === 'year' || today.getMonth() === date.getMonth())) {
      cell.classList.add('today');
      cell.setAttribute('aria-current', 'date');
    }

    cell.addEventListener('click', onClick);

    return cell;
  }

  /**
   * Locks a cell that can't be picked.
   *
   * @param cell
   */
  private lockGridCell(cell: HTMLButtonElement) {
    cell.classList.add('locked');
    cell.disabled = true;
  }

  /**
   * The 12 months of the grid's year, in a 4×3 grid.
   *
   * @param date month shown in the calendar
   */
  private getMonthsGrid(date: DateTime): HTMLElement {
    const { year, index } = this.grid;
    const grid = this.createGrid('months');
    const minDate = this.lockPlugin?.options.minDate ? new DateTime(this.lockPlugin.options.minDate) : null;
    const maxDate = this.lockPlugin?.options.maxDate ? new DateTime(this.lockPlugin.options.maxDate) : null;

    for (let m = 0; m < 12; m += 1) {
      const month = new DateTime(new Date(year, m, 1));
      const cell = this.createGridCell(
        month,
        'month',
        month.toLocaleString(this.picker.options.lang, { month: 'short' }),
        `${this.getMonthTitle(month)} ${year}`,
        () => {
          this.showMonth(index, year, m);
          this.closeGrid('months');
        },
      );

      if (year === date.getFullYear() && m === date.getMonth()) {
        cell.classList.add('selected');
      }

      if ((minDate && month.isBefore(minDate, 'month')) || (maxDate && month.isAfter(maxDate, 'month'))) {
        this.lockGridCell(cell);
      }

      grid.appendChild(cell);
    }

    return grid;
  }

  /**
   * The grid's decade, with the years just before and after it, in a 4×3
   * grid.
   *
   * @param date month shown in the calendar
   */
  private getYearsGrid(date: DateTime): HTMLElement {
    const { year, index, fromMonths } = this.grid;
    const decade = Math.floor(year / 10) * 10;
    const grid = this.createGrid('years');
    const { min, max } = this.getYearLimits('years');

    for (let y = decade - 1; y <= decade + 10; y += 1) {
      const cell = this.createGridCell(new Date(y, 0, 1), 'year', String(y), String(y), () => {
        if (fromMonths) {
          this.openGrid({ mode: 'months', index, year: y });
        } else {
          this.showMonth(index, y, date.getMonth());
          this.closeGrid('years');
        }
      });

      if (y < decade || y > decade + 9) {
        cell.classList.add('outside');
      }

      if (y === date.getFullYear()) {
        cell.classList.add('selected');
      }

      if ((min !== null && y < min) || (max !== null && y > max)) {
        this.lockGridCell(cell);
      }

      grid.appendChild(cell);
    }

    return grid;
  }

  /**
   *
   * @param event
   */
  private handleResetButton(event) {
    const { view, target }: IEventDetail = event.detail;

    if (view === 'CalendarHeader' && this.options.resetButton) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'reset-button unit';
      button.innerHTML = this.options.locale.resetButton;
      button.setAttribute('aria-label', this.options.locale.resetButtonLabel);

      button.addEventListener('click', (evt) => {
        evt.preventDefault();

        let shouldReset = true;

        if (typeof this.options.resetButton === 'function') {
          shouldReset = this.options.resetButton.call(this);
        }

        if (shouldReset) {
          this.picker.clear();
        }
      });

      target.appendChild(button);
    }
  }

  /**
   *
   * @param event
   */
  private handleWeekNumbers(event) {
    if (this.options.weekNumbers) {
      const { view, target }: IEventDetail = event.detail;

      if (view === 'CalendarDayNames') {
        const w = document.createElement('div');
        w.className = 'wnum-header';
        w.innerHTML = this.options.locale.week;
        target.prepend(w);
      }

      if (view === 'CalendarDays') {
        [...target.children].forEach((element: HTMLElement, index: number) => {
          if (index === 0 || index % 7 === 0) {
            let date;
            if (element.classList.contains('day')) {
              date = new DateTime(element.dataset.time);
            } else {
              const elDate = target.querySelector('.day') as HTMLElement;
              date = new DateTime(elDate.dataset.time);
            }

            let weekNum = date.getWeek(this.picker.options.firstDay);
            if (weekNum === 53 && date.getMonth() === 0) {
              weekNum = '53/1';
            }

            const w = document.createElement('div');
            w.className = 'wnum-item';
            w.innerHTML = String(weekNum);
            target.insertBefore(w, element);
          }
        });
      }
    }
  }
}
