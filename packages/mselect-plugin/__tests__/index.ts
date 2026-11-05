import * as easepick from '@gothassos/easepick-core';
import { DateTime } from '@gothassos/easepick-datetime';
import { KbdPlugin } from '@gothassos/easepick-kbd-plugin';
import { LockPlugin } from '@gothassos/easepick-lock-plugin';
import { RangePlugin } from '@gothassos/easepick-range-plugin';
import { MSelectPlugin } from '../src/index';
const pkg = require('../package.json');

window['__VERSION__'] = pkg.version;

// "Today" is 15 Nov 2019, so calendars open on November 2019.
beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2019, 10, 15, 12, 0, 0, 0) });
});

const pickers: easepick.Core[] = [];

afterEach(() => {
  pickers.splice(0).forEach(p => p.destroy());
  document.body.innerHTML = '';
  jest.useRealTimers();
});

const input = (value = '') => {
  const element = document.createElement('input');
  element.value = value;
  document.body.append(element);
  return element;
};

// Options are built as a variable: plugin options are declared on the built
// core types (dist/types) via module augmentation.
const create = (mselect: Record<string, unknown> = {}, options: Record<string, unknown> = {}) => {
  const config = {
    element: input(),
    plugins: [MSelectPlugin],
    MSelectPlugin: mselect,
    ...options,
  };
  const picker = new easepick.create(config as easepick.Core['options']);
  pickers.push(picker);
  return picker;
};

const time = (m: number, d: number) => String(new Date(2019, m - 1, d).getTime());
const day = (picker: easepick.Core, d: number, m = 11) =>
  picker.ui.container.querySelector<HTMLElement>(`.day[data-time="${time(m, d)}"]`);
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
const value = (picker: easepick.Core) => (picker.options.element as HTMLInputElement).value;
const selectedDays = (picker: easepick.Core) =>
  [...picker.ui.container.querySelectorAll<HTMLElement>('.day.selected')].map(d => Number(d.textContent));
const dates = (picker: easepick.Core) => picker.getDates('YYYY-MM-DD');
const applyButton = (picker: easepick.Core) => picker.ui.container.querySelector<HTMLButtonElement>('.apply-button');
const mselect = (picker: easepick.Core) => picker.PluginManager.getInstance('MSelectPlugin') as MSelectPlugin;

describe('with autoApply', () => {
  test('clicking days toggles them, and keeps the picker open', () => {
    const picker = create();
    const onSelect = jest.fn();
    picker.on('select', onSelect);
    picker.show();

    click(day(picker, 3));
    click(day(picker, 20));
    click(day(picker, 7));

    expect(dates(picker)).toEqual(['2019-11-03', '2019-11-20', '2019-11-07']);
    expect(value(picker)).toBe('2019-11-03;2019-11-20;2019-11-07');
    expect(selectedDays(picker)).toEqual([3, 7, 20]);
    expect(picker.isShown()).toBe(true);

    click(day(picker, 20));

    expect(dates(picker)).toEqual(['2019-11-03', '2019-11-07']);
    expect(selectedDays(picker)).toEqual([3, 7]);

    expect(onSelect).toHaveBeenCalledTimes(4);
    const detail = onSelect.mock.calls[3][0].detail;
    expect(detail.dates.map((d: DateTime) => d.format('YYYY-MM-DD'))).toEqual(['2019-11-03', '2019-11-07']);
  });

  test('locked days cannot be picked', () => {
    const picker = create({}, { plugins: [MSelectPlugin, LockPlugin], LockPlugin: { minDate: '2019-11-10' } });

    click(day(picker, 5));
    click(day(picker, 12));

    expect(dates(picker)).toEqual(['2019-11-12']);
  });
});

describe('without autoApply', () => {
  const createPending = (mselectOptions = {}) => {
    const picker = create({ dates: ['2019-11-03', '2019-11-07'], ...mselectOptions }, { autoApply: false });
    picker.show();
    return picker;
  };

  test('picks and unpicks wait for the Apply button', () => {
    const picker = createPending();
    const onSelect = jest.fn();
    const onPreselect = jest.fn();
    picker.on('select', onSelect);
    picker.on('preselect', onPreselect);

    expect(applyButton(picker).disabled).toBe(true);

    click(day(picker, 3)); // unpick an applied date
    click(day(picker, 20)); // pick a new one

    expect(selectedDays(picker)).toEqual([7, 20]);
    expect(dates(picker)).toEqual(['2019-11-03', '2019-11-07']);
    expect(value(picker)).toBe('2019-11-03;2019-11-07');
    expect(applyButton(picker).disabled).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onPreselect.mock.calls[1][0].detail.dates.map((d: DateTime) => d.getDate())).toEqual([7, 20]);

    click(applyButton(picker));

    expect(dates(picker)).toEqual(['2019-11-07', '2019-11-20']);
    expect(value(picker)).toBe('2019-11-07;2019-11-20');
    expect(picker.isShown()).toBe(false);
    expect(onSelect).toHaveBeenCalledTimes(1);

    // The unpicked date stays removed (it came back in the original plugin).
    picker.show();
    expect(selectedDays(picker)).toEqual([7, 20]);
  });

  test('closing drops the pending picks and unpicks', () => {
    const picker = createPending();

    click(day(picker, 3));
    click(day(picker, 20));
    picker.hide();
    picker.show();

    expect(selectedDays(picker)).toEqual([3, 7]);
    expect(dates(picker)).toEqual(['2019-11-03', '2019-11-07']);
  });

  test('clicking a pending day again undoes it', () => {
    const picker = createPending();

    click(day(picker, 3));
    click(day(picker, 3));
    click(day(picker, 20));
    click(day(picker, 20));

    expect(selectedDays(picker)).toEqual([3, 7]);
    expect(applyButton(picker).disabled).toBe(true);
  });

  test('a footer without the apply button (custom footer) still allows unpicking', () => {
    const picker = create({}, { autoApply: false });
    // A listener ahead of the plugin's drops the apply button.
    picker.on('view', (event: CustomEvent) => {
      if (event.detail.view === 'Footer') event.detail.target.querySelector('.apply-button')?.remove();
    });
    picker.PluginManager.reloadInstance('MSelectPlugin');
    picker.setDates(['2019-11-03', '2019-11-07']);
    picker.show();
    const onPreselect = jest.fn();
    picker.on('preselect', onPreselect);

    click(day(picker, 3));

    expect(applyButton(picker)).toBeNull();
    expect(picker.ui.container.querySelector('.cancel-button')).not.toBeNull();
    expect(selectedDays(picker)).toEqual([7]);
    expect(onPreselect.mock.calls[0][0].detail.dates.map((d: DateTime) => d.getDate())).toEqual([7]);
  });

  test('removing every date can be applied', () => {
    const picker = createPending();

    click(day(picker, 3));
    click(day(picker, 7));
    expect(applyButton(picker).disabled).toBe(false);

    click(applyButton(picker));
    expect(dates(picker)).toEqual([]);
    expect(value(picker)).toBe('');
  });
});

describe('options', () => {
  test('dates are read with inputFormat, written with format', () => {
    const picker = create(
      { dates: ['03/11/2019', new Date(2019, 10, 7), new Date(2019, 10, 9).getTime()], inputFormat: 'DD/MM/YYYY' },
      { format: 'DD.MM.YYYY' },
    );

    expect(dates(picker)).toEqual(['2019-11-03', '2019-11-07', '2019-11-09']);
    expect(value(picker)).toBe('03.11.2019;07.11.2019;09.11.2019');
  });

  test('the input value is read back with format and delimiter', () => {
    const picker = create({ delimiter: ', ' }, { element: input('03.11.2019, 07.11.2019'), format: 'DD.MM.YYYY' });

    expect(dates(picker)).toEqual(['2019-11-03', '2019-11-07']);
    expect(value(picker)).toBe('03.11.2019, 07.11.2019');
  });

  test('a non-input element gets the dates as its text', () => {
    const element = document.createElement('div');
    document.body.append(element);
    const picker = create({ dates: ['2019-11-03', '2019-11-07'] }, { element });

    expect(element.innerText).toBe('2019-11-03;2019-11-07');

    picker.addDate('2019-11-09');
    expect(element.innerText).toBe('2019-11-03;2019-11-07;2019-11-09');
  });

  test('an element that is not an HTMLElement (SVG) is left untouched', () => {
    document.body.innerHTML = '<svg id="icon"><circle r="4"></circle></svg>';
    const element = document.getElementById('icon');
    const picker = create({ dates: ['2019-11-03'] }, { element: '#icon' });

    expect(picker.options.element).toBe(element);
    expect(dates(picker)).toEqual(['2019-11-03']);
    expect(element.innerHTML).toBe('<circle r="4"></circle>');
    expect('innerText' in element).toBe(false);
  });

  test('the calendar opens on the earliest date', () => {
    const picker = create({ dates: ['2020-03-09', '2020-02-14'] });

    expect(picker.ui.container.querySelector('.month-name').textContent).toBe('February 2020');
  });

  test('max: other days become unavailable once reached', () => {
    const picker = create({ max: 2 });

    click(day(picker, 3));
    click(day(picker, 7));

    expect(day(picker, 20).classList.contains('not-available')).toBe(true);
    expect(day(picker, 20).tabIndex).toBe(-1);
    expect(day(picker, 3).classList.contains('not-available')).toBe(false);

    click(day(picker, 20));
    expect(dates(picker)).toEqual(['2019-11-03', '2019-11-07']);

    // Removing one frees a slot.
    click(day(picker, 3));
    expect(day(picker, 20).classList.contains('not-available')).toBe(false);
  });

  test('max: a day without the not-available mark is still refused once reached', () => {
    const picker = create({ max: 2 });
    // Rendered before the max is reached, so not marked unavailable.
    const stale = day(picker, 20);

    click(day(picker, 3));
    click(day(picker, 7));
    expect(stale.classList.contains('not-available')).toBe(false);

    picker.onClickCalendarDay(stale);

    expect(dates(picker)).toEqual(['2019-11-03', '2019-11-07']);
  });

  test('max counts pending picks, and limits dates set by the API', () => {
    const picker = create({ max: 2 }, { autoApply: false });
    picker.show();

    click(day(picker, 3));
    click(day(picker, 7));
    expect(day(picker, 20).classList.contains('not-available')).toBe(true);

    picker.setDates(['2019-11-01', '2019-11-02', '2019-11-04']);
    expect(dates(picker)).toEqual(['2019-11-01', '2019-11-02']);
  });

  test.each([
    ['asc', ['2019-11-03', '2019-11-07', '2019-11-20']],
    ['desc', ['2019-11-20', '2019-11-07', '2019-11-03']],
    [null, ['2019-11-07', '2019-11-20', '2019-11-03']],
  ])('sort: %s', (sort, expected) => {
    const picker = create({ sort, dates: ['2019-11-07', '2019-11-20', '2019-11-03'] });

    expect(dates(picker)).toEqual(expected);
    expect(value(picker)).toBe(expected.join(';'));
  });
});

describe('methods', () => {
  test('setDates, addDates, addDate, removeDate, getDates', () => {
    const picker = create();

    picker.setDates(['2019-11-03', '2019-11-07']);
    picker.addDates(['2019-11-07', '2019-11-09']);
    picker.addDate(new Date(2019, 10, 11));
    picker.removeDate('2019-11-03');

    // Duplicates are dropped.
    expect(dates(picker)).toEqual(['2019-11-07', '2019-11-09', '2019-11-11']);
    expect(selectedDays(picker)).toEqual([7, 9, 11]);
    expect(value(picker)).toBe('2019-11-07;2019-11-09;2019-11-11');

    picker.addDate('11/12/2019', 'DD/MM/YYYY');
    expect(dates(picker)).toContain('2019-12-11');
  });

  test('getDates returns copies', () => {
    const picker = create({ dates: ['2019-11-03'] });

    picker.getDates()[0].add(1, 'day');

    expect(dates(picker)).toEqual(['2019-11-03']);
  });

  test('clear', () => {
    const picker = create({ dates: ['2019-11-03'] });
    const onClear = jest.fn();
    picker.on('clear', onClear);

    picker.clear();

    expect(dates(picker)).toEqual([]);
    expect(value(picker)).toBe('');
    expect(selectedDays(picker)).toEqual([]);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe('viewMode', () => {
  test('month: picks several months', () => {
    const picker = create({}, { viewMode: 'month', format: 'MM/YYYY' });
    const month = (m: number) => picker.ui.container.querySelector(`.month[data-time="${time(m, 1)}"]`);

    click(month(2));
    click(month(5));

    expect(value(picker)).toBe('02/2019;05/2019');
    expect([...picker.ui.container.querySelectorAll('.month.selected')].map(m => m.textContent)).toEqual(['Feb', 'May']);

    // Another day of a selected month is the same month.
    picker.removeDate('2019-05-20', 'YYYY-MM-DD');
    expect(value(picker)).toBe('02/2019');
  });

  test('year: picks several years', () => {
    const picker = create({}, { viewMode: 'year', format: 'YYYY' });
    const year = (y: number) => picker.ui.container.querySelector(`.year[data-time="${new Date(y, 0, 1).getTime()}"]`);

    click(year(2012));
    click(year(2015));

    expect(value(picker)).toBe('2012;2015');
    expect([...picker.ui.container.querySelectorAll('.year.selected')].map(m => m.textContent)).toEqual(['2012', '2015']);
  });
});

describe('useWrapper', () => {
  const items = (picker: easepick.Core) => [...mselect(picker).wrapper.querySelectorAll('.mselect-item')];

  test('lists the dates in place of the input, which keeps the value', () => {
    const picker = create({ useWrapper: true, dates: ['2019-11-03', '2019-11-07'] });
    const element = picker.options.element as HTMLInputElement;

    expect(items(picker).map(i => i.querySelector('span').textContent)).toEqual(['2019-11-03', '2019-11-07']);
    expect(element.style.visibility).toBe('hidden');
    expect(value(picker)).toBe('2019-11-03;2019-11-07');
    // In the page flow, where the input was.
    expect(picker.ui.wrapper.style.position).toBe('relative');
  });

  test('the picker opens under the list', () => {
    const picker = create({ useWrapper: true, dates: ['2019-11-03'] });
    const onShow = jest.fn();
    picker.on('show', onShow);

    picker.show();

    expect(onShow.mock.calls[0][0].detail.target).toBe(mselect(picker).wrapper);
  });

  test('opening for the hidden input (KbdPlugin button) opens under the list', () => {
    const picker = create({ useWrapper: true, dates: ['2019-11-03'] }, { plugins: [MSelectPlugin, KbdPlugin] });
    const onShow = jest.fn();
    picker.on('show', onShow);

    const kbd = picker.PluginManager.getInstance('KbdPlugin') as KbdPlugin;
    click(kbd.docElement.shadowRoot.querySelector('button'));

    expect(picker.isShown()).toBe(true);
    expect(onShow.mock.calls[0][0].detail.target).toBe(mselect(picker).wrapper);
  });

  test('opening for another element keeps that target', () => {
    const picker = create({ useWrapper: true, dates: ['2019-11-03'] });
    const onShow = jest.fn();
    picker.on('show', onShow);
    const button = document.createElement('button');
    document.body.append(button);

    picker.show({ target: button });

    expect(onShow.mock.calls[0][0].detail.target).toBe(button);
  });

  test('the remove button removes a date without opening the picker', () => {
    const picker = create({ useWrapper: true, dates: ['2019-11-03', '2019-11-07'] });
    const onSelect = jest.fn();
    picker.on('select', onSelect);

    const button = items(picker)[0].querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Remove 2019-11-03');
    expect(button.type).toBe('button');

    click(button);

    expect(dates(picker)).toEqual(['2019-11-07']);
    expect(items(picker).length).toBe(1);
    expect(picker.isShown()).toBe(false);
    expect(onSelect).toHaveBeenCalledTimes(1);

    click(mselect(picker).wrapper);
    expect(picker.isShown()).toBe(true);
  });

  test('itemTemplate', () => {
    const picker = create({
      useWrapper: true,
      dates: ['2019-11-03'],
      itemTemplate: (date: DateTime) => {
        const el = document.createElement('b');
        el.textContent = date.format('D MMM');
        return el;
      },
    });

    expect(mselect(picker).wrapper.innerHTML).toBe('<b>3 Nov</b>');
  });
});

describe('detach', () => {
  test('restores the core methods and the input', () => {
    const element = input();
    element.style.position = 'relative';
    const picker = create({ useWrapper: true, dates: ['2019-11-03'] }, { element });

    picker.PluginManager.removeInstance('MSelectPlugin');

    expect(element.style.position).toBe('relative');
    expect(element.style.visibility).toBe('');
    expect(picker.ui.shadowRoot.querySelector('.mselect-wrapper')).toBeNull();
    expect(picker.ui.wrapper.style.position).toBe('absolute');
    expect('getDates' in picker).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(picker, 'show')).toBe(false);

    // Clicking a day is the core's single date pick again.
    picker.show();
    click(day(picker, 20));
    expect(picker.getDate().format('YYYY-MM-DD')).toBe('2019-11-20');
    expect(value(picker)).toBe('2019-11-20');
  });
  test('restores the input visibility it had', () => {
    const element = input();
    element.style.visibility = 'collapse';
    const picker = create({ useWrapper: true }, { element });

    expect(element.style.visibility).toBe('hidden');

    picker.PluginManager.removeInstance('MSelectPlugin');

    expect(element.style.visibility).toBe('collapse');
    expect(element.style.position).toBe('');
    expect(element.dataset.easepickStoreVisibility).toBeUndefined();
  });

  test("restores another plugin's overrides of the core methods", () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const picker = create({}, { plugins: [RangePlugin, MSelectPlugin] });
    const range = picker.PluginManager.getInstance('RangePlugin') as RangePlugin;

    expect(picker.clear).toBe(mselect(picker).binds.clear);

    picker.PluginManager.removeInstance('MSelectPlugin');

    expect(picker.clear).toBe(range.binds.clear);
    expect(picker.parseValues).toBe(range.binds.parseValues);
    expect(picker.onClickCalendarDay).toBe(range.binds.onClickCalendarDay);
    expect('getDates' in picker).toBe(false);
    warn.mockRestore();
  });
});

describe('with other plugins', () => {
  test('RangePlugin is not supported: a warning', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    create({}, { plugins: [MSelectPlugin, RangePlugin] });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('MSelectPlugin does not support RangePlugin'));
    warn.mockRestore();
  });

  test('KbdPlugin: Enter toggles the focused day', () => {
    const picker = create({}, { plugins: [MSelectPlugin, KbdPlugin] });
    picker.show();

    const el = day(picker, 12);
    el.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
    jest.runAllTimers();

    expect(dates(picker)).toEqual(['2019-11-12']);
  });
});
