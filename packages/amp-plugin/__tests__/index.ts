import * as easepick from '@gothassos/easepick-core';
import { AmpPlugin } from '@gothassos/easepick-amp-plugin';
import { LockPlugin } from '@gothassos/easepick-lock-plugin';
import { DateTime } from '@gothassos/easepick-datetime';
const pkg = require('../../core/package.json');

type Config = ConstructorParameters<typeof easepick.create>[0];

// A MediaQueryList stand-in that really dispatches `change` events.
class FakeMediaQueryList extends EventTarget {
  constructor(public matches: boolean, public media: string) {
    super();
  }
}

let mediaQuery: FakeMediaQueryList;

const mockColorScheme = (dark: boolean) => {
  window.matchMedia = jest.fn().mockImplementation((query: string) => {
    mediaQuery = new FakeMediaQueryList(dark, query);
    return mediaQuery;
  });
};

const changeColorScheme = (dark: boolean) => {
  const event = new Event('change');
  Object.defineProperty(event, 'matches', { value: dark });
  mediaQuery.dispatchEvent(event);
};

window['__VERSION__'] = pkg.version;

beforeEach(() => {
  document.body.innerHTML = '';
  mockColorScheme(false);
});

const create = (options: Partial<Config> = {}) => {
  const element = document.createElement('input');
  document.body.append(element);

  // Passed as a variable: plugin options come from module augmentation.
  const config: Config = {
    element,
    date: '2019-11-23',
    plugins: [AmpPlugin],
    ...options,
  };

  return new easepick.create(config);
};

const change = (select: HTMLSelectElement, value: string) => {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
};

const click = (element: Element) => element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

// "YYYY-MM" of every displayed calendar, read from its first day.
const shownMonths = (picker: easepick.Core) => {
  return Array.from(picker.ui.container.querySelectorAll('.calendar')).map((calendar) => {
    const day = calendar.querySelector<HTMLElement>('.day');
    const date = new Date(Number(day.dataset.time));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
};

const monthSelects = (picker: easepick.Core) =>
  Array.from(picker.ui.container.querySelectorAll<HTMLSelectElement>('.month-name--dropdown'));

const yearSelects = (picker: easepick.Core) =>
  Array.from(picker.ui.container.querySelectorAll<HTMLSelectElement>('.month-name--select:not(.month-name--dropdown)'));

const optionValues = (select: HTMLSelectElement) => Array.from(select.options).map(o => o.value);

const disabledValues = (select: HTMLSelectElement) =>
  Array.from(select.options).filter(o => o.disabled).map(o => o.value);

describe('darkMode', () => {
  test('follows a dark system preference on attach', () => {
    mockColorScheme(true);
    const picker = create();

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(picker.ui.container.dataset.theme).toBe('dark');
  });

  test('a light preference leaves the theme unset, then follows changes', () => {
    const picker = create();

    expect(picker.ui.container.hasAttribute('data-theme')).toBe(false);

    changeColorScheme(true);
    expect(picker.ui.container.dataset.theme).toBe('dark');

    changeColorScheme(false);
    expect(picker.ui.container.dataset.theme).toBe('light');
  });

  test('darkMode: false ignores the system preference', () => {
    mockColorScheme(true);
    const picker = create({ AmpPlugin: { darkMode: false } });

    expect(window.matchMedia).not.toHaveBeenCalled();
    expect(picker.ui.container.hasAttribute('data-theme')).toBe(false);

    picker.PluginManager.removeInstance('AmpPlugin');
    expect(picker.ui.container.classList.contains('amp-plugin')).toBe(false);
  });

  test('works without matchMedia support', () => {
    const matchMedia = window.matchMedia;
    delete window.matchMedia;

    try {
      const picker = create();
      expect(picker.ui.container.hasAttribute('data-theme')).toBe(false);
      expect(() => picker.PluginManager.removeInstance('AmpPlugin')).not.toThrow();
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  test('detaching removes the theme and stops following changes', () => {
    mockColorScheme(true);
    const picker = create();

    picker.PluginManager.removeInstance('AmpPlugin');
    expect(picker.ui.container.hasAttribute('data-theme')).toBe(false);

    changeColorScheme(true);
    expect(picker.ui.container.hasAttribute('data-theme')).toBe(false);
  });
});

describe('month dropdown', () => {
  test('replaces the month name and keeps the year text', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: true } } });
    const monthName = picker.ui.container.querySelector('.month-name');

    expect(monthName.childNodes.length).toBe(2);
    expect(monthName.childNodes[0]).toBe(monthSelects(picker)[0]);
    expect(monthName.childNodes[1].textContent).toBe(' 2019');
    expect(optionValues(monthSelects(picker)[0])).toEqual(
      ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    );
    expect(monthSelects(picker)[0].value).toBe('10');
  });

  test('choosing a month shows it without changing the date', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: true } } });

    change(monthSelects(picker)[0], '2');

    expect(shownMonths(picker)).toEqual(['2019-03']);
    expect(monthSelects(picker)[0].value).toBe('2');
    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-23');
  });

  test('choosing a month in the second calendar shows it there', () => {
    const picker = create({
      calendars: 2,
      grid: 2,
      AmpPlugin: { dropdown: { months: true } },
    });

    expect(shownMonths(picker)).toEqual(['2019-11', '2019-12']);

    change(monthSelects(picker)[1], '5');

    expect(shownMonths(picker)).toEqual(['2019-05', '2019-06']);
    expect(monthSelects(picker).map(s => s.value)).toEqual(['4', '5']);
  });

  test('LockPlugin minDate / maxDate disable the months out of range', () => {
    const picker = create({
      date: '2019-06-15',
      plugins: [AmpPlugin, LockPlugin],
      AmpPlugin: { dropdown: { months: true } },
      LockPlugin: { minDate: '2019-03-15', maxDate: '2019-09-10' },
    });

    expect(disabledValues(monthSelects(picker)[0])).toEqual(['0', '1', '9', '10', '11']);
  });

  test('LockPlugin with only minDate disables the earlier months', () => {
    const picker = create({
      date: '2019-06-15',
      plugins: [AmpPlugin, LockPlugin],
      AmpPlugin: { dropdown: { months: true } },
      LockPlugin: { minDate: '2019-03-15' },
    });

    expect(disabledValues(monthSelects(picker)[0])).toEqual(['0', '1']);
  });

  test('without Calendar.getMonthTitle (older core), month names come from toLocaleString', () => {
    const picker = create();
    const amp = picker.PluginManager.getInstance<AmpPlugin>('AmpPlugin');
    amp.options.dropdown.months = true;
    // Shadow the prototype method, as on a core version that predates it.
    Object.defineProperty(picker.Calendar, 'getMonthTitle', { value: undefined });

    const header = document.createElement('div');
    header.innerHTML = '<div class="month-name"><span>November</span> 2019</div>';
    amp.handleDropdown(new CustomEvent('view', {
      detail: { view: 'CalendarHeader', target: header, date: new DateTime('2019-11-23'), index: 0 },
    }));

    const select = header.querySelector<HTMLSelectElement>('.month-name--dropdown');
    expect(Array.from(select.options).map(o => o.text)).toEqual([
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]);
    expect(select.value).toBe('10');
  });
});

describe('year dropdown', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2022, 5, 15));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('defaults to this year down to 1950, and keeps the month name', () => {
    const picker = create({ AmpPlugin: { dropdown: { years: true } } });
    const monthName = picker.ui.container.querySelector('.month-name');
    const values = optionValues(yearSelects(picker)[0]);

    expect(monthName.childNodes.length).toBe(2);
    expect(monthName.childNodes[0].textContent).toBe('November');
    expect(monthName.childNodes[1]).toBe(yearSelects(picker)[0]);
    expect(values.length).toBe(2022 - 1950 + 1);
    expect(values[0]).toBe('2022');
    expect(values[values.length - 1]).toBe('1950');
    expect(yearSelects(picker)[0].value).toBe('2019');
    expect(disabledValues(yearSelects(picker)[0])).toEqual([]);
  });

  test('minYear / maxYear set the range', () => {
    const picker = create({
      AmpPlugin: { dropdown: { years: true, minYear: 2010, maxYear: 2020 } },
    });
    const values = optionValues(yearSelects(picker)[0]);

    expect(values).toEqual(['2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010']);
  });

  test('"asc" lists the years in ascending order', () => {
    const picker = create({
      AmpPlugin: { dropdown: { years: 'asc', minYear: 2017, maxYear: 2020 } },
    });
    const select = yearSelects(picker)[0];

    expect(optionValues(select)).toEqual(['2017', '2018', '2019', '2020']);
    expect(Array.from(select.options).map(o => o.text)).toEqual(['2017', '2018', '2019', '2020']);
    expect(select.value).toBe('2019');
  });

  test('a year after maxYear is shown as a disabled first option', () => {
    const picker = create({
      date: '2025-03-01',
      AmpPlugin: { dropdown: { years: true, minYear: 2018, maxYear: 2020 } },
    });
    const select = yearSelects(picker)[0];

    expect(optionValues(select)).toEqual(['2025', '2020', '2019', '2018']);
    expect(disabledValues(select)).toEqual(['2025']);
    expect(select.value).toBe('2025');
  });

  test('a year before minYear is shown as a disabled last option', () => {
    const picker = create({
      date: '1940-03-01',
      AmpPlugin: { dropdown: { years: true, minYear: 1950, maxYear: 1952 } },
    });
    const select = yearSelects(picker)[0];

    expect(optionValues(select)).toEqual(['1952', '1951', '1950', '1940']);
    expect(disabledValues(select)).toEqual(['1940']);
    expect(select.value).toBe('1940');
  });

  test('choosing a year shows the same month in that year', () => {
    const picker = create({ AmpPlugin: { dropdown: { years: true } } });

    change(yearSelects(picker)[0], '2015');

    expect(shownMonths(picker)).toEqual(['2015-11']);
    expect(yearSelects(picker)[0].value).toBe('2015');
    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-23');
  });

  test('choosing a year in the second calendar shows it there', () => {
    const picker = create({
      date: '2019-12-10',
      calendars: 2,
      grid: 2,
      AmpPlugin: { dropdown: { years: true } },
    });

    expect(shownMonths(picker)).toEqual(['2019-12', '2020-01']);

    change(yearSelects(picker)[1], '2018');

    expect(shownMonths(picker)).toEqual(['2017-12', '2018-01']);
    expect(yearSelects(picker).map(s => s.value)).toEqual(['2017', '2018']);
  });

  test('months and years together replace both parts of the title', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: true, years: true } } });
    const monthName = picker.ui.container.querySelector('.month-name');

    expect(Array.from(monthName.childNodes)).toEqual([monthSelects(picker)[0], yearSelects(picker)[0]]);
  });

  test('LockPlugin minDate / maxDate disable the years out of range', () => {
    const picker = create({
      plugins: [AmpPlugin, LockPlugin],
      AmpPlugin: { dropdown: { years: true, minYear: 2015, maxYear: 2022 } },
      LockPlugin: { minDate: '2017-05-01', maxDate: '2021-02-01' },
    });

    expect(disabledValues(yearSelects(picker)[0])).toEqual(['2022', '2016', '2015']);
  });

  test('LockPlugin with only maxDate disables the later years', () => {
    const picker = create({
      plugins: [AmpPlugin, LockPlugin],
      AmpPlugin: { dropdown: { years: true, minYear: 2015, maxYear: 2022 } },
      LockPlugin: { maxDate: '2021-02-01' },
    });

    expect(disabledValues(yearSelects(picker)[0])).toEqual(['2022']);
  });
});

describe('grid dropdown', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2022, 5, 15));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const grid = (picker: easepick.Core) => picker.ui.container.querySelector<HTMLElement>('.amp-grid');

  const cells = (picker: easepick.Core) =>
    Array.from(picker.ui.container.querySelectorAll<HTMLButtonElement>('.amp-grid-cell'));

  const cell = (picker: easepick.Core, text: string) => cells(picker).find(c => c.textContent === text);

  const texts = (list: Element[]) => list.map(c => c.textContent);

  const titleButton = (picker: easepick.Core, mode: 'months' | 'years', index = 0) =>
    picker.ui.container.querySelectorAll('.calendars > .calendar')[index]
      .querySelector<HTMLButtonElement>(`.month-name--${mode}`);

  const header = (picker: easepick.Core, index = 0) =>
    picker.ui.container.querySelectorAll<HTMLElement>('.calendars > .calendar > .header')[index];

  const title = (picker: easepick.Core, index = 0) => header(picker, index).querySelector('.month-name').textContent;

  const key = (element: Element, code: string) =>
    element.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));

  const activeElement = (picker: easepick.Core) => picker.ui.shadowRoot.activeElement;

  test('the title shows buttons in place of the month and year', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: 'grid', years: 'grid' } } });
    const monthName = picker.ui.container.querySelector('.month-name');

    expect(Array.from(monthName.childNodes)).toEqual([titleButton(picker, 'months'), titleButton(picker, 'years')]);
    expect(titleButton(picker, 'months').textContent).toBe('November');
    expect(titleButton(picker, 'years').textContent).toBe('2019');
    expect(titleButton(picker, 'months').type).toBe('button');
    expect(titleButton(picker, 'months').getAttribute('aria-expanded')).toBe('false');
    expect(grid(picker)).toBeNull();
  });

  test('can be mixed with a dropdown', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: 'grid', years: true } } });
    const monthName = picker.ui.container.querySelector('.month-name');

    expect(Array.from(monthName.childNodes)).toEqual([titleButton(picker, 'months'), yearSelects(picker)[0]]);
  });

  test('the month button shows the months of the year over the days', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: 'grid' } } });

    click(titleButton(picker, 'months'));

    const calendar = picker.ui.container.querySelector('.calendar');
    expect(calendar.classList.contains('amp-grid-open')).toBe(true);
    expect(grid(picker).parentElement).toBe(calendar);
    expect(grid(picker).getAttribute('aria-label')).toBe('Month');
    // The days stay, hidden by the CSS, so the calendar keeps its size.
    expect(calendar.querySelector('.days-grid')).not.toBeNull();
    expect(texts(cells(picker))).toEqual(
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    );
    expect(cell(picker, 'Nov').classList.contains('selected')).toBe(true);
    expect(cell(picker, 'Nov').getAttribute('aria-label')).toBe('November 2019');
    expect(title(picker)).toBe('2019');
    expect(activeElement(picker)).toBe(cell(picker, 'Nov'));
  });

  test('picking a month shows it without changing the date, and focuses the button', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: 'grid' } } });
    const onSelect = jest.fn();
    picker.on('select', onSelect);

    click(titleButton(picker, 'months'));
    click(cell(picker, 'Mar'));

    expect(grid(picker)).toBeNull();
    expect(shownMonths(picker)).toEqual(['2019-03']);
    expect(titleButton(picker, 'months').textContent).toBe('March');
    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-23');
    expect(onSelect).not.toHaveBeenCalled();
    expect(activeElement(picker)).toBe(titleButton(picker, 'months'));
  });

  test('previous / next step a year in the months grid', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: 'grid' } } });

    click(titleButton(picker, 'months'));
    const previous = header(picker).querySelector('.previous-button');
    expect(previous.getAttribute('aria-label')).toBe('Previous year');

    click(previous);
    expect(title(picker)).toBe('2018');
    expect(cell(picker, 'Nov').classList.contains('selected')).toBe(false);
    expect(activeElement(picker)).toBe(header(picker).querySelector('.previous-button'));

    click(header(picker).querySelector('.next-button'));
    click(header(picker).querySelector('.next-button'));
    expect(title(picker)).toBe('2020');

    click(cell(picker, 'Feb'));
    expect(shownMonths(picker)).toEqual(['2020-02']);
  });

  test('the year button shows the decade; picking a year keeps the month', () => {
    const picker = create({ AmpPlugin: { dropdown: { years: 'grid' } } });

    click(titleButton(picker, 'years'));

    expect(grid(picker).getAttribute('aria-label')).toBe('Year');
    expect(title(picker)).toBe('2010 – 2019');
    expect(texts(cells(picker))).toEqual(
      ['2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020'],
    );
    expect(texts(cells(picker).filter(c => c.classList.contains('outside')))).toEqual(['2009', '2020']);
    expect(cell(picker, '2019').classList.contains('selected')).toBe(true);
    expect(header(picker).querySelector('.next-button').getAttribute('aria-label')).toBe('Next decade');

    click(cell(picker, '2014'));

    expect(grid(picker)).toBeNull();
    expect(shownMonths(picker)).toEqual(['2014-11']);
    expect(activeElement(picker)).toBe(titleButton(picker, 'years'));
  });

  test('previous / next step a decade, within minYear / maxYear', () => {
    const picker = create({ AmpPlugin: { dropdown: { years: 'grid', minYear: 2005 } } });

    click(titleButton(picker, 'years'));
    // maxYear defaults to this year (2022), in the next decade.
    expect(header(picker).classList.contains('amp-no-next')).toBe(false);

    click(header(picker).querySelector('.next-button'));
    expect(title(picker)).toBe('2020 – 2029');
    expect(header(picker).classList.contains('amp-no-next')).toBe(true);
    expect(texts(cells(picker).filter(c => c.disabled))).toEqual(['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030']);
    // The next button is hidden now: the focus moves to the grid.
    expect(activeElement(picker)).toBe(cell(picker, '2019'));

    click(header(picker).querySelector('.previous-button'));
    click(header(picker).querySelector('.previous-button'));
    expect(title(picker)).toBe('2000 – 2009');
    expect(header(picker).classList.contains('amp-no-previous')).toBe(true);
    expect(texts(cells(picker).filter(c => c.disabled))).toEqual(['1999', '2000', '2001', '2002', '2003', '2004']);
    expect(cell(picker, '2004').classList.contains('locked')).toBe(true);
  });

  test('with both grids, the months grid title opens the years, and a year goes back to its months', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: 'grid', years: 'grid' } } });

    click(titleButton(picker, 'months'));
    click(header(picker).querySelector('.previous-button'));
    expect(titleButton(picker, 'years').textContent).toBe('2018');

    click(titleButton(picker, 'years'));
    expect(title(picker)).toBe('2010 – 2019');

    click(cell(picker, '2012'));
    expect(title(picker)).toBe('2012');
    expect(texts(cells(picker))[0]).toBe('Jan');
    expect(shownMonths(picker)).toEqual(['2019-11']);

    click(cell(picker, 'Jun'));
    expect(shownMonths(picker)).toEqual(['2012-06']);
  });

  test('works in the second calendar', () => {
    const picker = create({
      calendars: 2,
      grid: 2,
      AmpPlugin: { dropdown: { months: 'grid', years: 'grid' } },
    });

    click(titleButton(picker, 'months', 1));

    const calendars = picker.ui.container.querySelectorAll('.calendars > .calendar');
    expect(calendars[0].classList.contains('amp-grid-open')).toBe(false);
    expect(calendars[1].classList.contains('amp-grid-open')).toBe(true);
    expect(cell(picker, 'Dec').classList.contains('selected')).toBe(true);

    click(cell(picker, 'May'));
    expect(picker.ui.container.querySelectorAll('.days-grid .day').length).toBeGreaterThan(0);
    expect(Array.from(picker.ui.container.querySelectorAll('.month-name--months')).map(b => b.textContent))
      .toEqual(['April', 'May']);

    click(titleButton(picker, 'years', 1));
    click(cell(picker, '2015'));
    expect(Array.from(picker.ui.container.querySelectorAll('.month-name--years')).map(b => b.textContent))
      .toEqual(['2015', '2015']);
  });

  test('LockPlugin minDate / maxDate lock the months and stop the years', () => {
    const picker = create({
      date: '2019-03-20',
      plugins: [AmpPlugin, LockPlugin],
      AmpPlugin: { dropdown: { months: 'grid' } },
      LockPlugin: { minDate: '2019-03-15', maxDate: '2019-09-10' },
    });

    expect(header(picker).classList.contains('no-previous-month')).toBe(true);
    click(titleButton(picker, 'months'));

    expect(texts(cells(picker).filter(c => c.disabled))).toEqual(['Jan', 'Feb', 'Oct', 'Nov', 'Dec']);
    expect(texts(cells(picker).filter(c => c.classList.contains('locked')))).toEqual(['Jan', 'Feb', 'Oct', 'Nov', 'Dec']);
    expect(header(picker).classList.contains('amp-no-previous')).toBe(true);
    expect(header(picker).classList.contains('amp-no-next')).toBe(true);
    // LockPlugin's day-view classes are dropped while the grid is open.
    expect(header(picker).classList.contains('no-previous-month')).toBe(false);
  });

  test('LockPlugin limits combine with minYear / maxYear in the years grid', () => {
    const picker = create({
      plugins: [AmpPlugin, LockPlugin],
      AmpPlugin: { dropdown: { years: 'grid', minYear: 2012, maxYear: 2020 } },
      LockPlugin: { minDate: '2014-05-01', maxDate: '2030-02-01' },
    });

    click(titleButton(picker, 'years'));

    expect(texts(cells(picker).filter(c => !c.disabled))).toEqual(['2014', '2015', '2016', '2017', '2018', '2019', '2020']);
  });

  test('a click on a cell does not reach core, which would select it', () => {
    const picker = create({ autoApply: false, AmpPlugin: { dropdown: { months: 'grid' } } });
    const onPreselect = jest.fn();
    picker.on('preselect', onPreselect);

    click(titleButton(picker, 'months'));
    click(cell(picker, 'Jan'));

    expect(onPreselect).not.toHaveBeenCalled();
    expect(picker.datePicked.length).toBe(0);
  });

  test('previous / next in the grid do not move the calendar', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: 'grid' } } });
    const onNavigate = jest.fn();
    picker.on('navigate', onNavigate);

    click(titleButton(picker, 'months'));
    click(header(picker).querySelector('.next-button'));

    expect(onNavigate).not.toHaveBeenCalled();
    expect(picker.calendars[0].format('YYYY-MM')).toBe('2019-11');
  });

  test('arrow keys move between cells; Escape goes back to the days', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: 'grid' } } });
    picker.show();

    click(titleButton(picker, 'months'));
    key(cell(picker, 'Nov'), 'ArrowLeft');
    expect(activeElement(picker)).toBe(cell(picker, 'Oct'));
    key(cell(picker, 'Oct'), 'ArrowUp');
    expect(activeElement(picker)).toBe(cell(picker, 'Jun'));
    key(cell(picker, 'Jun'), 'ArrowDown');
    key(cell(picker, 'Oct'), 'ArrowDown');
    // Nothing below the last row.
    expect(activeElement(picker)).toBe(cell(picker, 'Oct'));

    key(cell(picker, 'Oct'), 'Escape');
    expect(grid(picker)).toBeNull();
    expect(shownMonths(picker)).toEqual(['2019-11']);
    expect(picker.isShown()).toBe(true);
    expect(activeElement(picker)).toBe(titleButton(picker, 'months'));
  });

  test('arrow keys do not move onto a locked cell', () => {
    const picker = create({
      date: '2019-06-15',
      plugins: [AmpPlugin, LockPlugin],
      AmpPlugin: { dropdown: { months: 'grid' } },
      LockPlugin: { minDate: '2019-03-15' },
    });

    click(titleButton(picker, 'months'));
    expect(activeElement(picker)).toBe(cell(picker, 'Jun'));

    key(cell(picker, 'Jun'), 'ArrowUp');
    expect(cell(picker, 'Feb').disabled).toBe(true);
    expect(activeElement(picker)).toBe(cell(picker, 'Jun'));
  });

  test('Escape in the years grid opened from the months grid goes back to the days', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: 'grid', years: 'grid' } } });

    click(titleButton(picker, 'months'));
    click(titleButton(picker, 'years'));
    key(cell(picker, '2015'), 'Escape');

    expect(grid(picker)).toBeNull();
    expect(activeElement(picker)).toBe(titleButton(picker, 'months'));
  });

  test('other keys are left alone', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: 'grid' } } });

    click(titleButton(picker, 'months'));
    key(cell(picker, 'Nov'), 'KeyA');

    expect(grid(picker)).not.toBeNull();
    expect(activeElement(picker)).toBe(cell(picker, 'Nov'));
  });

  test('marks this month and this year as today', () => {
    const picker = create({ date: '2022-03-10', AmpPlugin: { dropdown: { months: 'grid', years: 'grid' } } });

    click(titleButton(picker, 'months'));
    expect(texts(cells(picker).filter(c => c.classList.contains('today')))).toEqual(['Jun']);
    expect(cell(picker, 'Jun').getAttribute('aria-current')).toBe('date');
    expect(cell(picker, 'Mar').hasAttribute('aria-current')).toBe(false);

    click(titleButton(picker, 'years'));
    expect(texts(cells(picker).filter(c => c.classList.contains('today')))).toEqual(['2022']);
  });

  test('minYear: null leaves the years open below', () => {
    const picker = create({ date: '1905-01-01', AmpPlugin: { dropdown: { years: 'grid', minYear: null } } });

    click(titleButton(picker, 'years'));

    expect(header(picker).classList.contains('amp-no-previous')).toBe(false);
    expect(cells(picker).filter(c => c.disabled)).toEqual([]);
  });

  test('closing the picker closes the grid', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: 'grid' } } });
    picker.show();

    click(titleButton(picker, 'months'));
    picker.hide();

    expect(grid(picker)).toBeNull();
    expect(picker.ui.container.querySelector('.amp-grid-open')).toBeNull();

    // Closing it again, with no grid open, does not render again.
    picker.show();
    const renderAll = jest.spyOn(picker, 'renderAll');
    picker.hide();
    // Only core's own render.
    expect(renderAll).toHaveBeenCalledTimes(1);
  });

  test('is not used in the month and year views', () => {
    const picker = create({ viewMode: 'month', AmpPlugin: { dropdown: { months: 'grid', years: 'grid' } } });

    expect(picker.ui.container.querySelector('.month-name--button')).toBeNull();
  });

  test('detaching removes the buttons and an open grid', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: 'grid', years: 'grid' } } });

    click(titleButton(picker, 'months'));
    picker.PluginManager.removeInstance('AmpPlugin');
    picker.renderAll();

    expect(picker.ui.container.querySelector('.month-name--button, .amp-grid, .amp-grid-open')).toBeNull();
    expect(picker.ui.container.querySelector('.month-name').textContent).toBe('November 2019');
  });
});

describe('reset button', () => {
  const resetButtons = (picker: easepick.Core) =>
    Array.from(picker.ui.container.querySelectorAll<HTMLButtonElement>('.calendar > .header .reset-button'));

  test('is not shown by default', () => {
    expect(resetButtons(create()).length).toBe(0);
  });

  test('true: shows the default icon and clears the date', () => {
    const picker = create({ AmpPlugin: { resetButton: true } });
    const input = picker.options.element as HTMLInputElement;
    const onClear = jest.fn();
    picker.on('clear', onClear);

    expect(input.value).toBe('2019-11-23');
    expect(resetButtons(picker).length).toBe(1);
    expect(resetButtons(picker)[0].querySelector('svg')).not.toBeNull();

    click(resetButtons(picker)[0]);

    expect(input.value).toBe('');
    expect(picker.getDate()).toBeNull();
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(picker.ui.container.querySelector('.day.selected')).toBeNull();
  });

  test('a function returning false keeps the date', () => {
    const resetButton = jest.fn().mockReturnValue(false);
    const picker = create({ AmpPlugin: { resetButton } });

    click(resetButtons(picker)[0]);

    expect(resetButton).toHaveBeenCalledTimes(1);
    expect(resetButton.mock.contexts[0]).toBe(picker.PluginManager.getInstance('AmpPlugin'));
    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-23');
    expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-23');
  });

  test('a function returning true clears the date', () => {
    const picker = create({ AmpPlugin: { resetButton: () => true } });

    click(resetButtons(picker)[0]);

    expect(picker.getDate()).toBeNull();
    expect((picker.options.element as HTMLInputElement).value).toBe('');
  });

  test('locale.resetButton replaces the icon', () => {
    const picker = create({
      AmpPlugin: { resetButton: true, locale: { resetButton: 'Reset' } },
    });

    expect(resetButtons(picker)[0].innerHTML).toBe('Reset');
  });

  test('one button per calendar', () => {
    const picker = create({ calendars: 2, AmpPlugin: { resetButton: true } });

    expect(resetButtons(picker).length).toBe(2);
  });
});

describe('week numbers', () => {
  const weekNumbers = (picker: easepick.Core) =>
    Array.from(picker.ui.container.querySelectorAll('.wnum-item')).map(w => w.textContent);

  test('are not shown by default', () => {
    const picker = create();

    expect(picker.ui.container.classList.contains('week-numbers')).toBe(false);
    expect(picker.ui.container.querySelector('.wnum-header')).toBeNull();
    expect(weekNumbers(picker)).toEqual([]);
  });

  test('a header cell and a number in front of every week', () => {
    const picker = create({ AmpPlugin: { weekNumbers: true } });
    const { container } = picker.ui;
    const items = container.querySelectorAll<HTMLElement>('.wnum-item');

    expect(container.classList.contains('week-numbers')).toBe(true);
    expect(container.querySelector('.daynames-row').firstElementChild.className).toBe('wnum-header');
    expect(container.querySelector('.wnum-header').textContent).toBe('Wk');
    // November 2019 starts on a Friday: the first week begins with offset cells.
    expect(weekNumbers(picker)).toEqual(['44', '45', '46', '47', '48']);
    expect(items[0].nextElementSibling.classList.contains('offset')).toBe(true);
    expect(items[1].nextElementSibling.textContent).toBe('4');
    expect(items[4].nextElementSibling.textContent).toBe('25');
  });

  test('week 53 that starts in January is shown as "53/1"', () => {
    const picker = create({ date: '2021-01-15', AmpPlugin: { weekNumbers: true } });

    expect(weekNumbers(picker)).toEqual(['53/1', '1', '2', '3', '4']);
  });

  test('week 53 in December stays "53"', () => {
    const picker = create({ date: '2020-12-15', AmpPlugin: { weekNumbers: true } });

    expect(weekNumbers(picker)).toEqual(['49', '50', '51', '52', '53']);
  });

  test('locale.week sets the header text', () => {
    const picker = create({ AmpPlugin: { weekNumbers: true, locale: { week: 'Sem' } } });

    expect(picker.ui.container.querySelector('.wnum-header').textContent).toBe('Sem');
  });
});

test('detaching removes week numbers, dropdowns and the reset button', () => {
  const picker = create({
    AmpPlugin: {
      weekNumbers: true,
      resetButton: true,
      dropdown: { months: true, years: true },
    },
  });

  picker.PluginManager.removeInstance('AmpPlugin');
  picker.renderAll();

  const { container } = picker.ui;
  expect(container.classList.contains('week-numbers')).toBe(false);
  expect(container.querySelector('.wnum-header, .wnum-item, select, .reset-button')).toBeNull();
  expect(container.querySelector('.month-name').textContent).toBe('November 2019');
});

describe('accessibility', () => {
  test('dropdowns and the reset button are named', () => {
    const picker = create({ AmpPlugin: { dropdown: { months: true, years: true }, resetButton: true } });

    expect(monthSelects(picker)[0].getAttribute('aria-label')).toBe('Month');
    expect(yearSelects(picker)[0].getAttribute('aria-label')).toBe('Year');

    const reset = picker.ui.container.querySelector<HTMLButtonElement>('.reset-button');
    expect(reset.getAttribute('aria-label')).toBe('Clear selection');
    expect(reset.type).toBe('button');
  });

  test('names come from locale', () => {
    const picker = create({
      AmpPlugin: { dropdown: { months: true }, resetButton: true, locale: { month: 'Mois', resetButtonLabel: 'Effacer' } },
    });

    expect(monthSelects(picker)[0].getAttribute('aria-label')).toBe('Mois');
    expect(picker.ui.container.querySelector('.reset-button').getAttribute('aria-label')).toBe('Effacer');
  });
});
