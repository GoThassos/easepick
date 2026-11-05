import * as easepick from '@gothassos/easepick-core';
import { DateTime } from '@gothassos/easepick-datetime';
import { RangePlugin } from '@gothassos/easepick-range-plugin';
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

// "Today" is 15 Nov 2019, so calendars open on November 2019.
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
// core types (dist/types) via module augmentation.
const create = (rangeOptions: Record<string, unknown> = {}, pickerOptions: Record<string, unknown> = {}) => {
  const options = {
    element: input(),
    plugins: [RangePlugin],
    ...pickerOptions,
    RangePlugin: rangeOptions,
  };
  const picker = new easepick.create(options as easepick.Core['options']);
  pickers.push(picker);
  return picker;
};

const time = (day: number, month = 11, year = 2019) => String(new Date(year, month - 1, day).getTime());
const day = (picker: easepick.Core, d: number) =>
  picker.ui.container.querySelector<HTMLElement>(`.day[data-time="${time(d)}"]`);
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
const hover = (el: Element) => el.dispatchEvent(new MouseEvent('mouseenter'));
const applyButton = (picker: easepick.Core) => picker.ui.container.querySelector<HTMLButtonElement>('.apply-button');
const tooltip = (picker: easepick.Core) => picker.ui.container.querySelector<HTMLElement>('.range-plugin-tooltip');
const fmt = (d: DateTime | null) => (d ? d.format('YYYY-MM-DD') : null);
const range = (picker: easepick.Core) => [fmt(picker.getStartDate()), fmt(picker.getEndDate())];
const daysWith = (picker: easepick.Core, cls: string) =>
  [...picker.ui.container.querySelectorAll<HTMLElement>(`.day.${cls}`)].map(x => Number(x.textContent));

describe('selecting a range by clicking days', () => {
  test('two clicks set the range, fire select and close the picker', () => {
    const picker = create();
    const onSelect = jest.fn();
    picker.on('select', onSelect);
    picker.show();

    click(day(picker, 5));
    expect(picker.isShown()).toBe(true);
    click(day(picker, 12));

    expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-05 - 2019-11-12');
    expect(range(picker)).toEqual(['2019-11-05', '2019-11-12']);
    expect(onSelect).toHaveBeenCalledTimes(1);
    const { start, end } = onSelect.mock.calls[0][0].detail;
    expect([fmt(start), fmt(end)]).toEqual(['2019-11-05', '2019-11-12']);
    expect(picker.isShown()).toBe(false);
  });

  test('clicking the end before the start swaps them', () => {
    const picker = create();
    picker.show();

    click(day(picker, 20));
    click(day(picker, 3));

    expect(range(picker)).toEqual(['2019-11-03', '2019-11-20']);
  });

  test('the first click fires preselect and marks the start day', () => {
    const picker = create();
    const onPreselect = jest.fn();
    picker.on('preselect', onPreselect);
    picker.show();

    click(day(picker, 7));

    const { start, end } = onPreselect.mock.calls[0][0].detail;
    expect(fmt(start)).toBe('2019-11-07');
    expect(end).toBeNull();
    expect(daysWith(picker, 'start')).toEqual([7]);
    // Nothing is applied yet in strict mode.
    expect(range(picker)).toEqual([null, null]);
    expect((picker.options.element as HTMLInputElement).value).toBe('');
  });

  test('a third click starts a new range', () => {
    const picker = create({}, { autoApply: false });
    picker.show();

    click(day(picker, 5));
    click(day(picker, 10));
    click(day(picker, 15));

    expect(daysWith(picker, 'start')).toEqual([15]);
    expect(daysWith(picker, 'end')).toEqual([]);
    expect(applyButton(picker).disabled).toBe(true);
  });

  test('a selected range renders start, in-range and end classes', () => {
    const picker = create();
    picker.setDateRange('2019-11-05', '2019-11-08');

    expect(daysWith(picker, 'start')).toEqual([5]);
    expect(daysWith(picker, 'in-range')).toEqual([6, 7]);
    expect(daysWith(picker, 'end')).toEqual([8]);
  });
});

describe('hovering days', () => {
  test('highlights the days between the start and the hovered day', () => {
    const picker = create();
    picker.show();
    click(day(picker, 5));

    hover(day(picker, 9));

    expect(daysWith(picker, 'start')).toEqual([5]);
    expect(daysWith(picker, 'in-range')).toEqual([6, 7, 8]);
    expect(daysWith(picker, 'end')).toEqual([9]);
    expect(daysWith(picker, 'flipped')).toEqual([]);
  });

  test('hovering before the start flips the range', () => {
    const picker = create();
    picker.show();
    click(day(picker, 10));

    hover(day(picker, 7));

    expect(daysWith(picker, 'in-range')).toEqual([8, 9]);
    expect(daysWith(picker, 'start')).toEqual([10]);
    expect(daysWith(picker, 'end')).toEqual([7]);
    expect(daysWith(picker, 'flipped')).toEqual([7, 10]);
    expect(tooltip(picker).textContent).toBe('4 days');
  });

  test('does nothing without a pending start', () => {
    const picker = create();
    picker.show();

    hover(day(picker, 9));

    expect(daysWith(picker, 'in-range')).toEqual([]);
    expect(daysWith(picker, 'end')).toEqual([]);
    expect(tooltip(picker).style.visibility).toBe('');
  });

  test('ignores elements outside of a unit', () => {
    const picker = create();
    picker.show();
    click(day(picker, 5));

    hover(picker.ui.container.querySelector('.dayname'));

    expect(daysWith(picker, 'in-range')).toEqual([]);
  });
});

describe('tooltip', () => {
  test('shows the number of days, singular and plural', () => {
    const picker = create();
    picker.show();
    click(day(picker, 5));

    hover(day(picker, 5));
    expect(tooltip(picker).textContent).toBe('1 day');
    expect(tooltip(picker).style.visibility).toBe('visible');

    hover(day(picker, 12));
    expect(tooltip(picker).textContent).toBe('8 days');
  });

  test('tooltipNumber customizes the count, and a count of 0 hides it', () => {
    const picker = create({ tooltipNumber: (num: number) => num - 1 });
    picker.show();
    click(day(picker, 5));

    hover(day(picker, 8));
    expect(tooltip(picker).textContent).toBe('3 days');

    hover(day(picker, 5));
    expect(tooltip(picker).style.visibility).toBe('hidden');
  });

  test('is hidden once a range is preselected without autoApply', () => {
    const picker = create({}, { autoApply: false });
    picker.show();
    click(day(picker, 5));
    hover(day(picker, 8));
    expect(tooltip(picker).style.visibility).toBe('visible');

    click(day(picker, 8));
    // renderAll() recreates the tooltip; the old one was hidden first.
    expect(tooltip(picker).textContent).toBe('');
  });

  test('tooltip: false shows nothing', () => {
    const picker = create({ tooltip: false });
    picker.show();
    click(day(picker, 5));

    hover(day(picker, 8));

    expect(tooltip(picker).textContent).toBe('');
    expect(daysWith(picker, 'in-range')).toEqual([6, 7]);
  });

  test('uses the plural rules of the picker language', () => {
    const picker = create({
      locale: { one: 'день', few: 'дня', many: 'дней', other: 'дня' },
    }, { lang: 'ru-RU' });
    picker.show();
    click(day(picker, 1));

    hover(day(picker, 1));
    expect(tooltip(picker).textContent).toBe('1 день');
    hover(day(picker, 2));
    expect(tooltip(picker).textContent).toBe('2 дня');
    hover(day(picker, 5));
    expect(tooltip(picker).textContent).toBe('5 дней');
    hover(day(picker, 21));
    expect(tooltip(picker).textContent).toBe('21 день');
  });
});

describe('programmatic API', () => {
  test('getStartDate / getEndDate are null before a selection', () => {
    const picker = create();

    expect(picker.getStartDate()).toBeNull();
    expect(picker.getEndDate()).toBeNull();
  });

  test('setDateRange updates the dates and the input', () => {
    const picker = create();

    picker.setDateRange('2019-11-05', new Date(2019, 10, 12));

    expect(range(picker)).toEqual(['2019-11-05', '2019-11-12']);
    expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-05 - 2019-11-12');
  });

  test('setStartDate and setEndDate set each end separately', () => {
    const picker = create();

    picker.setStartDate('2019-11-05');
    expect(range(picker)).toEqual(['2019-11-05', null]);
    expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-05 - ');

    picker.setEndDate(new Date(2019, 10, 9).getTime());
    expect(range(picker)).toEqual(['2019-11-05', '2019-11-09']);
    expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-05 - 2019-11-09');
  });

  test('only the end date set still shows the delimiter', () => {
    const picker = create();

    picker.setEndDate('2019-11-09');

    expect((picker.options.element as HTMLInputElement).value).toBe(' - 2019-11-09');
  });

  test('getters return copies', () => {
    const picker = create();
    picker.setDateRange('2019-11-05', '2019-11-12');

    picker.getStartDate().add(1, 'month');
    picker.getEndDate().add(1, 'month');

    expect(range(picker)).toEqual(['2019-11-05', '2019-11-12']);
  });

  test('uses the picker format and a custom delimiter', () => {
    const picker = create({ delimiter: ' ~ ' }, { format: 'DD/MM/YYYY' });

    picker.setDateRange('05/11/2019', '12/11/2019');

    expect((picker.options.element as HTMLInputElement).value).toBe('05/11/2019 ~ 12/11/2019');
    expect(range(picker)).toEqual(['2019-11-05', '2019-11-12']);
  });

  test('clear empties the selection and the input, and fires clear', () => {
    const picker = create();
    const onClear = jest.fn();
    picker.on('clear', onClear);
    picker.setDateRange('2019-11-05', '2019-11-12');

    picker.clear();

    expect(range(picker)).toEqual([null, null]);
    expect((picker.options.element as HTMLInputElement).value).toBe('');
    expect(daysWith(picker, 'start')).toEqual([]);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  test('clear empties both inputs with elementEnd', () => {
    const end = input();
    const picker = create({ elementEnd: end });
    picker.setDateRange('2019-11-05', '2019-11-12');

    picker.clear();

    expect([(picker.options.element as HTMLInputElement).value, end.value]).toEqual(['', '']);
  });

  test('showing the picker scrolls to the start date', () => {
    const picker = create({ startDate: new DateTime('2020-03-10'), endDate: new DateTime('2020-03-15') });
    expect(picker.ui.container.querySelector('.month-name').textContent).toBe('November 2019');

    picker.show();

    expect(picker.ui.container.querySelector('.month-name').textContent).toBe('March 2020');
  });

  test('scrollToDate: false keeps the current month', () => {
    const picker = create(
      { startDate: new DateTime('2020-03-10'), endDate: new DateTime('2020-03-15') },
      { scrollToDate: false },
    );

    picker.show();

    expect(picker.ui.container.querySelector('.month-name').textContent).toBe('November 2019');
  });
});

describe('non-input elements', () => {
  test('a single element shows the range as its text', () => {
    const element = document.createElement('div');
    document.body.append(element);
    const picker = create({}, { element });

    picker.setDateRange('2019-11-05', '2019-11-12');

    expect(element.innerText).toBe('2019-11-05 - 2019-11-12');
  });

  test('element and elementEnd show each date as their text', () => {
    const element = document.createElement('div');
    const elementEnd = document.createElement('div');
    document.body.append(element, elementEnd);
    const picker = create({ elementEnd }, { element });

    picker.setDateRange('2019-11-05', '2019-11-12');

    expect([element.innerText, elementEnd.innerText]).toEqual(['2019-11-05', '2019-11-12']);
  });
});

describe('elementEnd', () => {
  test('fills the two inputs', () => {
    const end = input();
    const picker = create({ elementEnd: end });
    picker.show();

    click(day(picker, 5));
    click(day(picker, 12));

    expect([(picker.options.element as HTMLInputElement).value, end.value]).toEqual(['2019-11-05', '2019-11-12']);
  });

  test('accepts a selector, applies readonly and opens the picker on click', () => {
    const end = input();
    end.id = 'end-input';
    const picker = create({ elementEnd: '#end-input' }, { readonly: false });

    expect(end.readOnly).toBe(false);
    expect(picker.isShown()).toBe(false);

    click(end);

    expect(picker.isShown()).toBe(true);
  });

  test('inputs are readonly by default', () => {
    const end = input();
    create({ elementEnd: end });

    expect(end.readOnly).toBe(true);
  });

  test('a click outside closes the picker, a click on either input or inside does not', () => {
    const end = input();
    const outside = document.createElement('div');
    document.body.append(outside);
    const picker = create({ elementEnd: end });

    click(end);
    expect(picker.isShown()).toBe(true);

    click(picker.options.element as HTMLElement);
    expect(picker.isShown()).toBe(true);

    // Composed, so the document sees the shadow host as the target.
    click(picker.ui.container.querySelector('.month-name'));
    expect(picker.isShown()).toBe(true);

    click(outside);
    expect(picker.isShown()).toBe(false);
  });

  test('documentClick: false keeps the picker open', () => {
    const end = input();
    const picker = create({ elementEnd: end }, { documentClick: false });

    click(end);
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(picker.isShown()).toBe(true);
  });
});

describe('strict: false', () => {
  test('a single click selects the start date with autoApply', () => {
    const picker = create({ strict: false });
    const onSelect = jest.fn();
    picker.on('select', onSelect);
    picker.show();

    click(day(picker, 5));

    expect(range(picker)).toEqual(['2019-11-05', null]);
    expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-05 - ');
    expect(fmt(onSelect.mock.calls[0][0].detail.start)).toBe('2019-11-05');
    expect(picker.isShown()).toBe(true);
  });

  test('a single click from elementEnd selects the end date', () => {
    const end = input();
    const picker = create({ strict: false, elementEnd: end });
    click(end);

    click(day(picker, 12));

    expect(range(picker)).toEqual([null, '2019-11-12']);
    expect([(picker.options.element as HTMLInputElement).value, end.value]).toEqual(['', '2019-11-12']);
  });

  test('without autoApply, Apply is enabled after one click and sets the start', () => {
    const picker = create({ strict: false }, { autoApply: false });
    picker.setDateRange('2019-11-01', '2019-11-02');
    picker.show();
    expect(applyButton(picker).disabled).toBe(true);

    click(day(picker, 5));
    expect(applyButton(picker).disabled).toBe(false);
    click(applyButton(picker));

    expect(range(picker)).toEqual(['2019-11-05', null]);
    expect(picker.isShown()).toBe(false);
  });

  test('without autoApply, Apply from elementEnd sets only the end', () => {
    const end = input();
    const picker = create({ strict: false, elementEnd: end }, { autoApply: false });
    picker.setDateRange('2019-11-01', '2019-11-02');
    click(end);

    click(day(picker, 12));
    click(applyButton(picker));

    expect(range(picker)).toEqual([null, '2019-11-12']);
  });
});

describe('without autoApply', () => {
  test('Apply is enabled only once both dates are picked', () => {
    const picker = create({}, { autoApply: false });
    const onPreselect = jest.fn();
    const onSelect = jest.fn();
    picker.on('preselect', onPreselect);
    picker.on('select', onSelect);
    picker.show();

    expect(applyButton(picker).disabled).toBe(true);
    click(day(picker, 12));
    expect(applyButton(picker).disabled).toBe(true);
    click(day(picker, 5));
    expect(applyButton(picker).disabled).toBe(false);

    const { start, end } = onPreselect.mock.calls[1][0].detail;
    expect([fmt(start), fmt(end)]).toEqual(['2019-11-05', '2019-11-12']);
    expect(range(picker)).toEqual([null, null]);
    expect(onSelect).not.toHaveBeenCalled();

    click(applyButton(picker));

    expect(range(picker)).toEqual(['2019-11-05', '2019-11-12']);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(picker.isShown()).toBe(false);
  });

  test('Apply with a single pick in strict mode keeps the previous range', () => {
    const picker = create({}, { autoApply: false });
    picker.setDateRange('2019-11-01', '2019-11-02');
    picker.show();

    click(day(picker, 5));
    // The button is disabled, but the handler itself must not half-apply.
    applyButton(picker).disabled = false;
    click(applyButton(picker));

    expect(range(picker)).toEqual(['2019-11-01', '2019-11-02']);
  });
});

describe('parsing initial values', () => {
  test('startDate and endDate options', () => {
    const picker = create({ startDate: new DateTime('2019-11-05'), endDate: new DateTime('2019-11-12') });

    expect(range(picker)).toEqual(['2019-11-05', '2019-11-12']);
    expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-05 - 2019-11-12');
  });

  test('strict: a lone startDate option is dropped', () => {
    const picker = create({ startDate: new DateTime('2019-11-05') });

    expect(range(picker)).toEqual([null, null]);
  });

  test('non-strict: a lone startDate or endDate option is kept', () => {
    expect(range(create({ strict: false, startDate: new DateTime('2019-11-05') }))).toEqual(['2019-11-05', null]);
    expect(range(create({ strict: false, endDate: new DateTime('2019-11-12') }))).toEqual([null, '2019-11-12']);
  });

  test('a pre-filled single input', () => {
    const element = input('2019-11-05 - 2019-11-12');

    expect(range(create({}, { element }))).toEqual(['2019-11-05', '2019-11-12']);
  });

  test('strict: a pre-filled single input with only a start is ignored', () => {
    const element = input('2019-11-05');

    expect(range(create({}, { element }))).toEqual([null, null]);
  });

  test('non-strict: a pre-filled single input with only a start or an end', () => {
    expect(range(create({ strict: false }, { element: input('2019-11-05 - ') }))).toEqual(['2019-11-05', null]);
    expect(range(create({ strict: false }, { element: input(' - 2019-11-12') }))).toEqual([null, '2019-11-12']);
  });

  test('pre-filled element and elementEnd', () => {
    const element = input('2019-11-05');
    const elementEnd = input('2019-11-12');

    expect(range(create({ elementEnd }, { element }))).toEqual(['2019-11-05', '2019-11-12']);
  });

  test('strict: only one of element / elementEnd filled is ignored', () => {
    expect(range(create({ elementEnd: input() }, { element: input('2019-11-05') }))).toEqual([null, null]);
  });

  test('non-strict: element and elementEnd are read separately', () => {
    expect(range(create({ strict: false, elementEnd: input() }, { element: input('2019-11-05') })))
      .toEqual(['2019-11-05', null]);
    expect(range(create({ strict: false, elementEnd: input('2019-11-12') }, { element: input() })))
      .toEqual([null, '2019-11-12']);
  });

  test('options take precedence over the input values', () => {
    const element = input('2019-10-01 - 2019-10-02');
    const picker = create({ startDate: new DateTime('2019-11-05'), endDate: new DateTime('2019-11-12') }, { element });

    expect(range(picker)).toEqual(['2019-11-05', '2019-11-12']);
  });
});

describe('repick', () => {
  const repickPicker = () => {
    const end = input();
    const picker = create({
      elementEnd: end,
      repick: true,
      startDate: new DateTime('2019-11-10'),
      endDate: new DateTime('2019-11-20'),
    });
    return { picker, end };
  };

  test('opening from the end input keeps the start and repicks the end', () => {
    const { picker, end } = repickPicker();
    click(end);

    click(day(picker, 25));

    expect(range(picker)).toEqual(['2019-11-10', '2019-11-25']);
    expect(picker.isShown()).toBe(false);
  });

  test('opening from the start input keeps the end and repicks the start', () => {
    const { picker } = repickPicker();
    click(picker.options.element as HTMLElement);

    click(day(picker, 3));

    expect(range(picker)).toEqual(['2019-11-03', '2019-11-20']);
  });

  test('hovering previews the range from the kept date', () => {
    const { picker, end } = repickPicker();
    click(end);

    hover(day(picker, 23));

    expect(daysWith(picker, 'in-range')).toEqual(expect.arrayContaining([21, 22]));
    expect(daysWith(picker, 'end')).toEqual([23]);
    expect(tooltip(picker).textContent).toBe('14 days');
  });

  test('leaving the calendar drops the repick anchor, entering it restores it', () => {
    const { picker, end } = repickPicker();
    const { container } = picker.ui;
    click(end);

    container.dispatchEvent(new MouseEvent('mouseleave'));
    hover(day(picker, 23));
    expect(daysWith(picker, 'in-range')).not.toContain(22);

    hover(container);
    hover(day(picker, 23));
    expect(daysWith(picker, 'in-range')).toContain(22);
  });

  test('is disabled without elementEnd', () => {
    const picker = create({
      repick: true,
      startDate: new DateTime('2019-11-10'),
      endDate: new DateTime('2019-11-20'),
    });
    picker.show();

    click(day(picker, 25));

    // A fresh range is started instead of replacing one end.
    expect(range(picker)).toEqual(['2019-11-10', '2019-11-20']);
    expect(daysWith(picker, 'start')).toEqual([25]);
  });
});

test('detaching restores the single-date picker', () => {
  const picker = create();
  picker.setDateRange('2019-11-05', '2019-11-12');

  picker.PluginManager.removeInstance('RangePlugin');
  picker.show();
  click(day(picker, 7));

  expect(picker.ui.container.classList.contains('range-plugin')).toBe(false);
  expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-07');
  expect(picker.getStartDate).toBeUndefined();
  expect(picker.setDateRange).toBeUndefined();
});
