import { create } from '@gothassos/easepick-core';
import { DateTime } from '@gothassos/easepick-datetime';
import { RangePlugin } from '@gothassos/easepick-range-plugin';
import { LockPlugin } from '@gothassos/easepick-lock-plugin';
const pkg = require('../package.json');

window.matchMedia = jest.fn().mockImplementation((query) => {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
});
window['__VERSION__'] = pkg.version;

// November 2019 is shown unless a test says otherwise.
const NOV = 10;

const newInput = () => {
  const element = document.createElement('input');
  document.body.append(element);
  return element;
};

// Options are passed as a variable: plugins add their options to the
// built core types (dist/types) through module augmentation.
const open = (lock: Record<string, unknown>, extra: Record<string, unknown> = {}) => {
  const options = {
    element: newInput(),
    date: '2019-11-23',
    plugins: [RangePlugin, LockPlugin],
    LockPlugin: lock,
    ...extra,
  };
  const picker = new create(options as any);
  picker.show();

  return picker;
};

const day = (picker, d: number, month = NOV, year = 2019) =>
  picker.ui.container.querySelector(`.day[data-time="${new Date(year, month, d).getTime()}"]`) as HTMLElement;

const click = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

const pick = (picker, d: number) => click(day(picker, d));

const notAvailable = (picker, days: number[]) =>
  days.filter(d => day(picker, d).classList.contains('not-available'));

const locked = (picker, days: number[]) =>
  days.filter(d => day(picker, d).classList.contains('locked'));

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const ALL = range(1, 30);

let warn: jest.SpyInstance;

beforeEach(() => {
  // Silenced; tests that care assert on it.
  warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('minDate / maxDate', () => {
  test('days outside the bounds are not available', () => {
    const picker = open({ minDate: '2019-11-05', maxDate: '2019-11-25' });

    expect(notAvailable(picker, ALL)).toEqual([...range(1, 4), ...range(26, 30)]);
  });

  test('accept Date objects and timestamps', () => {
    const picker = open({
      minDate: new Date(2019, NOV, 10),
      maxDate: new Date(2019, NOV, 20).getTime(),
    });

    expect(notAvailable(picker, ALL)).toEqual([...range(1, 9), ...range(21, 30)]);
  });

  test('the bound months hide the previous / next month buttons', () => {
    const picker = open({ minDate: '2019-11-05', maxDate: '2019-11-25' });
    const header = picker.ui.container.querySelector('.calendar > .header');

    expect(header.classList.contains('no-previous-month')).toBe(true);
    expect(header.classList.contains('no-next-month')).toBe(true);
  });

  test('months inside the bounds keep both buttons, until the bound month is reached', () => {
    const picker = open({ minDate: '2019-10-15', maxDate: '2019-12-15' });
    const header = () => picker.ui.container.querySelector('.calendar > .header');

    expect(header().classList.contains('no-previous-month')).toBe(false);
    expect(header().classList.contains('no-next-month')).toBe(false);

    click(picker.ui.container.querySelector('.previous-button'));
    expect(header().querySelector('.month-name').textContent).toBe('October 2019');
    expect(header().classList.contains('no-previous-month')).toBe(true);
    expect(header().classList.contains('no-next-month')).toBe(false);
    // Days before minDate in October are locked, the bound itself is not.
    expect(day(picker, 14, 9).classList.contains('not-available')).toBe(true);
    expect(day(picker, 15, 9).classList.contains('not-available')).toBe(false);

    click(picker.ui.container.querySelector('.next-button'));
    click(picker.ui.container.querySelector('.next-button'));
    expect(header().querySelector('.month-name').textContent).toBe('December 2019');
    expect(header().classList.contains('no-next-month')).toBe(true);
  });

  test('with several calendars, starts a month earlier when the first one is the maxDate month', () => {
    const picker = open({ maxDate: '2019-11-30' }, { calendars: 2 });
    const titles = [...picker.ui.container.querySelectorAll('.month-name')].map(x => x.textContent);
    const headers = picker.ui.container.querySelectorAll('.calendar > .header');

    expect(titles).toEqual(['October 2019', 'November 2019']);
    expect(headers[0].classList.contains('no-next-month')).toBe(false);
    expect(headers[1].classList.contains('no-next-month')).toBe(true);
  });

  test('with several calendars, keeps the first month when maxDate is later', () => {
    const picker = open({ maxDate: '2019-12-31' }, { calendars: 2 });
    const titles = [...picker.ui.container.querySelectorAll('.month-name')].map(x => x.textContent);

    expect(titles).toEqual(['November 2019', 'December 2019']);
  });

  test('with a single calendar, the maxDate month is shown', () => {
    const picker = open({ maxDate: '2019-11-30' });

    expect(picker.ui.container.querySelector('.month-name').textContent).toBe('November 2019');
  });

  test('also lock a single-date picker (no RangePlugin)', () => {
    const options = {
      element: newInput(),
      date: '2019-11-23',
      plugins: [LockPlugin],
      LockPlugin: { minDate: '2019-11-20' },
    };
    const picker = new create(options);

    expect(notAvailable(picker, ALL)).toEqual(range(1, 19));
  });
});

describe('minDays / maxDays', () => {
  test('nothing is locked before the first pick', () => {
    const picker = open({ minDays: 3, maxDays: 5 });

    expect(notAvailable(picker, ALL)).toEqual([]);
  });

  test('minDays locks the days too close to the picked start', () => {
    const picker = open({ minDays: 3 });
    pick(picker, 10);

    // 8..10 and 10..12 are 3 days long; 9..11 are too close.
    expect(notAvailable(picker, ALL)).toEqual([9, 10, 11]);
  });

  test('maxDays locks the days too far from the picked start', () => {
    const picker = open({ maxDays: 3 });
    pick(picker, 10);

    // 8..10 and 10..12 are 3 days long.
    expect(notAvailable(picker, ALL)).toEqual([...range(1, 7), ...range(13, 30)]);
  });

  test('a range of exactly minDays..maxDays days can be selected', () => {
    const options = {
      element: newInput(),
      date: '2019-11-23',
      plugins: [RangePlugin, LockPlugin],
      LockPlugin: { minDays: 3, maxDays: 3 },
    };
    const picker = new create(options);
    picker.show();
    pick(picker, 10);
    pick(picker, 12);

    expect((options.element as HTMLInputElement).value).toBe('2019-11-10 - 2019-11-12');
  });

  test('warns when used without RangePlugin', () => {
    const options = {
      element: newInput(),
      plugins: [LockPlugin],
      LockPlugin: { minDays: 2 },
    };
    new create(options);

    expect(warn).toHaveBeenCalledWith(
      'LockPlugin: options minDays, maxDays, selectForward, selectBackward required RangePlugin.',
    );
  });

  test('does not warn when RangePlugin is passed as a class or a name', () => {
    for (const rangePlugin of [RangePlugin, 'RangePlugin']) {
      window['easepick'] = { RangePlugin };
      const options = {
        element: newInput(),
        plugins: [rangePlugin, LockPlugin],
        LockPlugin: { minDays: 2 },
      };
      new create(options);
      delete window['easepick'];
    }

    expect(warn).not.toHaveBeenCalled();
  });

  test('does not warn without range options', () => {
    const options = {
      element: newInput(),
      plugins: [LockPlugin],
      LockPlugin: { minDate: '2019-11-01' },
    };
    new create(options);

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('selectForward / selectBackward', () => {
  test('selectForward locks the days before the picked start', () => {
    const picker = open({ selectForward: true });

    expect(notAvailable(picker, ALL)).toEqual([]);
    pick(picker, 10);
    expect(notAvailable(picker, ALL)).toEqual(range(1, 9));
  });

  test('selectBackward locks the days after the picked start', () => {
    const picker = open({ selectBackward: true });

    expect(notAvailable(picker, ALL)).toEqual([]);
    pick(picker, 10);
    expect(notAvailable(picker, ALL)).toEqual(range(11, 30));
  });

  test('the lock is released once the range is complete', () => {
    const options = {
      element: newInput(),
      date: '2019-11-23',
      autoApply: false,
      plugins: [RangePlugin, LockPlugin],
      LockPlugin: { selectForward: true },
    };
    const picker = new create(options);
    picker.show();
    pick(picker, 10);
    pick(picker, 15);

    expect(notAvailable(picker, ALL)).toEqual([]);
  });
});

describe('filter', () => {
  test('locks the days the function returns true for', () => {
    const picker = open({ filter: (date: DateTime) => date.getDay() === 0 });

    // Sundays of November 2019.
    expect(locked(picker, ALL)).toEqual([3, 10, 17, 24]);
    expect(notAvailable(picker, ALL)).toEqual([]);
  });

  test('receives each date and the picked dates', () => {
    const filter = jest.fn(() => false);
    const picker = open({ filter });

    const [firstDate, firstPicked] = filter.mock.calls[0] as unknown as [DateTime, DateTime[]];
    expect(firstDate).toBeInstanceOf(DateTime);
    expect(firstPicked).toEqual([]);

    pick(picker, 10);
    const [, picked] = filter.mock.calls[filter.mock.calls.length - 1] as unknown as [DateTime, DateTime[]];
    expect(picked.map(d => d.format('YYYY-MM-DD'))).toEqual(['2019-11-10']);
  });

  test('without inseparable, a locked day can sit inside the range', () => {
    const picker = open({ filter: (date: DateTime) => date.getDate() === 15 });
    pick(picker, 10);

    expect(notAvailable(picker, ALL)).toEqual([]);
    expect(locked(picker, ALL)).toEqual([15]);
  });
});

describe('inseparable', () => {
  test('locks the days whose range with the start would contain a locked day', () => {
    const picker = open({
      inseparable: true,
      filter: (date: DateTime) => date.getDate() === 15,
    });

    expect(notAvailable(picker, ALL)).toEqual([]);

    pick(picker, 10);
    expect(locked(picker, ALL)).toEqual([15]);
    expect(notAvailable(picker, ALL)).toEqual(range(16, 30));
  });

  test('also works backwards from the start', () => {
    const picker = open({
      inseparable: true,
      filter: (date: DateTime) => date.getDate() === 5,
    });
    pick(picker, 10);

    expect(notAvailable(picker, ALL)).toEqual(range(1, 4));
  });

  test('with minDays, locks days that fit no range between locked days', () => {
    // 10 and 14 are locked: 12 can neither start (12..14) nor end (10..12)
    // a 3-day range, while 11 (11..13) and 13 (11..13) can.
    const picker = open({
      inseparable: true,
      minDays: 3,
      filter: (date: DateTime) => [10, 14].includes(date.getDate()),
    });

    expect(locked(picker, ALL)).toEqual([10, 14]);
    expect(notAvailable(picker, ALL)).toEqual([12]);
  });
});

test('removing the plugin removes the locks', () => {
  const picker = open({ minDate: '2019-11-05', filter: (date: DateTime) => date.getDate() === 20 });
  expect(notAvailable(picker, ALL).length).toBe(4);

  picker.PluginManager.removeInstance('LockPlugin');
  picker.renderAll();

  expect(notAvailable(picker, ALL)).toEqual([]);
  expect(locked(picker, ALL)).toEqual([]);
  expect(picker.ui.container.classList.contains('lock-plugin')).toBe(false);
});
