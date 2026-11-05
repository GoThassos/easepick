// viewMode: 'month' | 'year' (month and year pickers), with the plugins that
// take part in them. Idea from YuaFox/easepick2.
import * as easepick from '@gothassos/easepick-core';
import { DateTime } from '@gothassos/easepick-datetime';
import { RangePlugin } from '@gothassos/easepick-range-plugin';
import { LockPlugin } from '@gothassos/easepick-lock-plugin';
import { AmpPlugin } from '@gothassos/easepick-amp-plugin';
import { KbdPlugin } from '@gothassos/easepick-kbd-plugin';
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

// "Today" is 15 Nov 2019.
beforeAll(() => {
  jest.useFakeTimers({ now: new Date(2019, 10, 15, 12, 0, 0, 0) });
});

afterAll(() => {
  jest.useRealTimers();
});

const pickers: easepick.Core[] = [];

afterEach(() => {
  pickers.splice(0).forEach(p => p.destroy());
  document.body.innerHTML = '';
  jest.restoreAllMocks();
});

const input = (value = '') => {
  const element = document.createElement('input');
  element.value = value;
  document.body.append(element);
  return element;
};

// Options are built as a variable: plugin options are declared on the built
// core types via module augmentation. Range methods aren't on the Core type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const create = (options: Record<string, unknown>): any => {
  const picker = new easepick.create({ element: input(), ...options } as easepick.Core['options']);
  pickers.push(picker);
  return picker;
};

const ymd = (d: Date | null) => (d ? new DateTime(d).format('YYYY-MM-DD') : null);
const container = (picker: easepick.Core) => picker.ui.container;
const cells = (picker: easepick.Core, selector: string) =>
  [...container(picker).querySelectorAll<HTMLElement>(selector)];
const texts = (picker: easepick.Core, selector: string) => cells(picker, selector).map(x => x.textContent);
const title = (picker: easepick.Core) => container(picker).querySelector('.month-name').textContent;
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
const hover = (el: Element) => el.dispatchEvent(new MouseEvent('mouseenter'));
const month = (picker: easepick.Core, m: number, y = 2019) =>
  container(picker).querySelector<HTMLElement>(`.month[data-time="${new Date(y, m - 1, 1).getTime()}"]`);
const year = (picker: easepick.Core, y: number) =>
  container(picker).querySelector<HTMLElement>(`.year[data-time="${new Date(y, 0, 1).getTime()}"]`);
const withClass = (picker: easepick.Core, cls: string) => texts(picker, `.month.${cls}, .year.${cls}`);
const button = (picker: easepick.Core, name: 'previous' | 'next') =>
  container(picker).querySelector<HTMLElement>(`.${name}-button`);

describe('core', () => {
  test('day is the default view', () => {
    const picker = create({});

    expect(picker.options.viewMode).toBe('day');
    expect(cells(picker, '.day').length).toBe(30);
    expect(cells(picker, '.month, .year')).toEqual([]);
  });

  test('month view: one calendar with the 12 months of the year', () => {
    const picker = create({ viewMode: 'month', calendars: 2 });

    expect(cells(picker, '.calendar').length).toBe(1);
    expect(cells(picker, '.day')).toEqual([]);
    expect(title(picker)).toBe('2019');
    expect(texts(picker, '.month')).toEqual(
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    );
    expect(month(picker, 11).title).toBe('November 2019');
    expect(withClass(picker, 'today')).toEqual(['Nov']);
  });

  test('month view uses the language, with nominative month titles', () => {
    const picker = create({ viewMode: 'month', lang: 'el-GR' });

    expect(month(picker, 11).title).toBe('Νοέμβριος 2019');
  });

  test('year view: the decade, plus the years just before and after it', () => {
    const picker = create({ viewMode: 'year' });

    expect(title(picker)).toBe('2010 – 2019');
    expect(texts(picker, '.year')).toEqual(
      ['2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020'],
    );
    expect(withClass(picker, 'outside')).toEqual(['2009', '2020']);
    expect(withClass(picker, 'today')).toEqual(['2019']);
  });

  test('the selected date is marked', () => {
    expect(withClass(create({ viewMode: 'month', date: '2019-06-10' }), 'selected')).toEqual(['Jun']);
    expect(withClass(create({ viewMode: 'year', date: '2016-06-10' }), 'selected')).toEqual(['2016']);
  });

  test('the arrows move a year in the month view, a decade in the year view', () => {
    const months = create({ viewMode: 'month' });
    click(button(months, 'next'));
    expect(title(months)).toBe('2020');
    click(button(months, 'previous'));
    click(button(months, 'previous'));
    expect(title(months)).toBe('2018');

    const years = create({ viewMode: 'year' });
    click(button(years, 'next'));
    expect(title(years)).toBe('2020 – 2029');
    click(button(years, 'previous'));
    click(button(years, 'previous'));
    expect(title(years)).toBe('2000 – 2009');
  });

  test('moving a year from 29 February does not skip a month', () => {
    const picker = create({ viewMode: 'month', date: '2020-02-29' });
    click(button(picker, 'next'));

    expect(title(picker)).toBe('2021');
    expect(picker.calendars[0].getMonth()).toBe(1);
  });

  test('clicking a month selects its first day (autoApply)', () => {
    const picker = create({ viewMode: 'month', format: 'MM/YYYY' });
    const onSelect = jest.fn();
    picker.on('select', onSelect);
    picker.show();

    click(month(picker, 3));

    expect(ymd(picker.getDate())).toBe('2019-03-01');
    expect(picker.options.element.value).toBe('03/2019');
    expect(ymd(onSelect.mock.calls[0][0].detail.date)).toBe('2019-03-01');
    expect(picker.isShown()).toBe(false);
  });

  test('clicking a year selects 1 January (autoApply)', () => {
    const picker = create({ viewMode: 'year', format: 'YYYY' });
    click(year(picker, 2014));

    expect(ymd(picker.getDate())).toBe('2014-01-01');
    expect(picker.options.element.value).toBe('2014');
  });

  test('without autoApply: preselect, then Apply', () => {
    const picker = create({ viewMode: 'month', format: 'MM/YYYY', autoApply: false });
    const onPreselect = jest.fn();
    picker.on('preselect', onPreselect);
    picker.show();

    click(month(picker, 5));
    expect(onPreselect).toHaveBeenCalledTimes(1);
    expect(withClass(picker, 'selected')).toEqual(['May']);
    expect(picker.options.element.value).toBe('');

    click(container(picker).querySelector('.apply-button'));
    expect(picker.options.element.value).toBe('05/2019');
  });

  test('a value in the input is read with the format', () => {
    const picker = create({ viewMode: 'month', format: 'MM/YYYY', element: input('04/2018') });

    expect(ymd(picker.getDate())).toBe('2018-04-01');
    expect(title(picker)).toBe('2018');
    expect(withClass(picker, 'selected')).toEqual(['Apr']);
  });
});

describe('RangePlugin', () => {
  const range = (options: Record<string, unknown> = {}) =>
    create({ format: 'MM/YYYY', plugins: [RangePlugin], ...options });
  const dates = (picker) => [ymd(picker.getStartDate()), ymd(picker.getEndDate())];

  test('a month range covers whole months, picked in either order', () => {
    const forward = range({ viewMode: 'month' });
    click(month(forward, 3));
    click(month(forward, 6));
    expect(dates(forward)).toEqual(['2019-03-01', '2019-06-30']);
    expect(forward.options.element.value).toBe('03/2019 - 06/2019');

    const backward = range({ viewMode: 'month' });
    click(month(backward, 6));
    click(month(backward, 3));
    expect(dates(backward)).toEqual(['2019-03-01', '2019-06-30']);
  });

  test('the same month twice is that whole month', () => {
    const picker = range({ viewMode: 'month' });
    click(month(picker, 2));
    click(month(picker, 2));

    expect(dates(picker)).toEqual(['2019-02-01', '2019-02-28']);
  });

  test('a year range covers whole years', () => {
    const picker = range({ viewMode: 'year', format: 'YYYY' });
    click(year(picker, 2015));
    click(year(picker, 2012));

    expect(dates(picker)).toEqual(['2012-01-01', '2015-12-31']);
    expect(picker.options.element.value).toBe('2012 - 2015');
  });

  test('the picked range is marked: start, in-range, end', () => {
    const picker = range({ viewMode: 'month', RangePlugin: { startDate: '03/2019', endDate: '06/2019' } });

    expect(withClass(picker, 'start')).toEqual(['Mar']);
    expect(withClass(picker, 'in-range')).toEqual(['Apr', 'May']);
    expect(withClass(picker, 'end')).toEqual(['Jun']);
  });

  test('hovering after the first click previews the range', () => {
    const picker = range({ viewMode: 'month' });
    picker.show();
    click(month(picker, 8));
    hover(month(picker, 5));

    expect(withClass(picker, 'start')).toEqual(['May']);
    expect(withClass(picker, 'in-range')).toEqual(['Jun', 'Jul']);
    expect(withClass(picker, 'end')).toEqual(['Aug']);
  });

  test('without autoApply, Apply sets the whole-month range', () => {
    const picker = range({ viewMode: 'month', autoApply: false });
    picker.show();
    click(month(picker, 9));
    click(month(picker, 10));
    expect(picker.options.element.value).toBe('');

    click(container(picker).querySelector('.apply-button'));
    expect(dates(picker)).toEqual(['2019-09-01', '2019-10-31']);
  });

  test('setters and input values are widened to whole periods', () => {
    const picker = range({ viewMode: 'month', format: 'YYYY-MM-DD' });
    picker.setDateRange('2019-03-15', '2019-06-10');
    expect(dates(picker)).toEqual(['2019-03-01', '2019-06-30']);

    picker.setStartDate('2019-01-20');
    picker.setEndDate('2019-02-03');
    expect(dates(picker)).toEqual(['2019-01-01', '2019-02-28']);

    const parsed = range({ viewMode: 'year', format: 'YYYY', element: input('2012 - 2015') });
    expect(dates(parsed)).toEqual(['2012-01-01', '2015-12-31']);
  });

  test('the day view keeps exact days', () => {
    const picker = range({ format: 'YYYY-MM-DD' });
    picker.setDateRange('2019-03-15', '2019-06-10');

    expect(dates(picker)).toEqual(['2019-03-15', '2019-06-10']);
  });
});

describe('LockPlugin', () => {
  const lock = (viewMode: string, lockOptions: Record<string, unknown>) =>
    create({ viewMode, plugins: [LockPlugin], LockPlugin: lockOptions });
  const header = (picker: easepick.Core) => container(picker).querySelector('.header').classList;

  test('months entirely outside minDate / maxDate are locked, and cannot be picked', () => {
    const picker = lock('month', { minDate: '2019-03-15', maxDate: '2019-10-05' });

    expect(withClass(picker, 'locked')).toEqual(['Jan', 'Feb', 'Nov', 'Dec']);

    click(month(picker, 2));
    expect(picker.getDate()).toBeNull();
    click(month(picker, 3));
    expect(ymd(picker.getDate())).toBe('2019-03-01');
  });

  test('years entirely outside minDate / maxDate are locked', () => {
    const picker = lock('year', { minDate: '2012-06-01', maxDate: '2016-02-01' });

    expect(withClass(picker, 'locked')).toEqual(['2009', '2010', '2011', '2017', '2018', '2019', '2020']);
  });

  test('month view: the arrows stop at the years of minDate / maxDate', () => {
    const picker = lock('month', { minDate: '2019-03-15', maxDate: '2020-10-05' });
    expect(header(picker).contains('no-previous-month')).toBe(true);
    expect(header(picker).contains('no-next-month')).toBe(false);

    click(button(picker, 'next'));
    expect(header(picker).contains('no-previous-month')).toBe(false);
    expect(header(picker).contains('no-next-month')).toBe(true);
  });

  test('year view: the arrows stop at the decades of minDate / maxDate', () => {
    const inside = lock('year', { minDate: '2012-06-01', maxDate: '2016-02-01' });
    expect(header(inside).contains('no-previous-month')).toBe(true);
    expect(header(inside).contains('no-next-month')).toBe(true);

    const wide = lock('year', { minDate: '2005-06-01', maxDate: '2031-02-01' });
    expect(header(wide).contains('no-previous-month')).toBe(false);
    expect(header(wide).contains('no-next-month')).toBe(false);
  });
});

describe('AmpPlugin', () => {
  test('its month/year dropdowns stay out of the month and year views', () => {
    for (const viewMode of ['month', 'year']) {
      const picker = create({
        viewMode,
        plugins: [AmpPlugin],
        AmpPlugin: { dropdown: { months: true, years: true } },
      });

      expect(container(picker).querySelector('select')).toBeNull();
      expect(title(picker)).toBe(viewMode === 'month' ? '2019' : '2010 – 2019');
    }
  });
});

describe('KbdPlugin', () => {
  test('months can be focused and picked with Enter, except locked ones', () => {
    const picker = create({
      viewMode: 'month',
      format: 'MM/YYYY',
      plugins: [KbdPlugin, LockPlugin],
      LockPlugin: { maxDate: '2019-10-31' },
    });
    picker.show();

    expect(month(picker, 3).tabIndex).toBe(1);
    expect(month(picker, 12).tabIndex).toBe(-1);

    const enter = new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true });
    month(picker, 3).dispatchEvent(enter);

    expect(enter.defaultPrevented).toBe(true);
    expect(picker.options.element.value).toBe('03/2019');
  });
});
