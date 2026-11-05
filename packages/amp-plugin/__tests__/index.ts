import * as easepick from '@gothassos/easepick-core';
import { AmpPlugin } from '@gothassos/easepick-amp-plugin';
import { LockPlugin } from '@gothassos/easepick-lock-plugin';
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
