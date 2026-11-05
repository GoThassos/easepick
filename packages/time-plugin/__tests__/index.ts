import * as easepick from '@gothassos/easepick-core';
import { DateTime } from '@gothassos/easepick-datetime';
import { RangePlugin } from '@gothassos/easepick-range-plugin';
import { TimePlugin } from '@gothassos/easepick-time-plugin';
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
});

const FORMAT = 'YYYY-MM-DD HH:mm';

const input = (value = '') => {
  const element = document.createElement('input');
  element.value = value;
  document.body.append(element);
  return element;
};

// Options are built as a variable: plugin options are declared on the built
// core types (dist/types) via module augmentation.
const create = (timeOptions: Record<string, unknown> = {}, pickerOptions: Record<string, unknown> = {}) => {
  const options = {
    element: input(),
    format: FORMAT,
    plugins: [TimePlugin],
    ...pickerOptions,
    TimePlugin: timeOptions,
  };
  const picker = new easepick.create(options as easepick.Core['options']);
  pickers.push(picker);
  return picker;
};

const createRange = (
  rangeOptions: Record<string, unknown> = {},
  timeOptions: Record<string, unknown> = {},
  pickerOptions: Record<string, unknown> = {},
) => create(timeOptions, { plugins: [RangePlugin, TimePlugin], RangePlugin: rangeOptions, ...pickerOptions });

const time = (d: number) => String(new Date(2019, 10, d).getTime());
const day = (picker: easepick.Core, d: number) =>
  picker.ui.container.querySelector<HTMLElement>(`.day[data-time="${time(d)}"]`);
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
const select = (picker: easepick.Core, name: string) =>
  picker.ui.container.querySelector<HTMLSelectElement>(`select[name="${name}"]`);
const choose = (picker: easepick.Core, name: string, value: string) => {
  const el = select(picker, name);
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
};
const nativeInput = (picker: easepick.Core, name: string) =>
  picker.ui.container.querySelector<HTMLInputElement>(`input.time-plugin-input[name="${name}"]`);
const typeTime = (picker: easepick.Core, name: string, value: string) => {
  const el = nativeInput(picker, name);
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
};
const optionValues = (el: HTMLSelectElement) => [...el.options].map(o => o.value);
const applyButton = (picker: easepick.Core) => picker.ui.container.querySelector<HTMLButtonElement>('.apply-button');
const value = (picker: easepick.Core) => (picker.options.element as HTMLInputElement).value;
const fmt = (d: DateTime | null, format = FORMAT) => (d ? d.format(format) : null);

describe('single date, select inputs', () => {
  test('renders hour and minute selects with the parsed time selected', () => {
    const picker = create({}, { date: '2019-11-23 14:35' });

    const hours = select(picker, 'input[HH]');
    const minutes = select(picker, 'input[mm]');
    expect(optionValues(hours)).toEqual(Array.from({ length: 24 }, (_, i) => String(i)));
    expect(optionValues(minutes)).toEqual(
      ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'],
    );
    expect([hours.value, minutes.value]).toEqual(['14', '35']);
    expect(select(picker, 'input[ss]')).toBeNull();
    expect(select(picker, 'input[period]')).toBeNull();
    expect(fmt(picker.getDate())).toBe('2019-11-23 14:35');
  });

  test('reads the time from a pre-filled input', () => {
    const picker = create({}, { element: input('2019-11-23 08:15') });

    expect(select(picker, 'input[HH]').value).toBe('8');
    expect(select(picker, 'input[mm]').value).toBe('15');
    expect(fmt(picker.getDate())).toBe('2019-11-23 08:15');
  });

  test('stepHours, stepMinutes and stepSeconds', () => {
    const picker = create({ seconds: true, stepHours: 6, stepMinutes: 15, stepSeconds: 20 });

    expect(optionValues(select(picker, 'input[HH]'))).toEqual(['0', '6', '12', '18']);
    expect(optionValues(select(picker, 'input[mm]'))).toEqual(['00', '15', '30', '45']);
    expect(optionValues(select(picker, 'input[ss]'))).toEqual(['00', '20', '40']);
  });

  test('changing the selects updates the date and the input (autoApply)', () => {
    const picker = create({ seconds: true }, { date: '2019-11-23 14:35:00', format: 'YYYY-MM-DD HH:mm:ss' });

    choose(picker, 'input[HH]', '9');
    expect(value(picker)).toBe('2019-11-23 09:35:00');

    choose(picker, 'input[mm]', '50');
    choose(picker, 'input[ss]', '45');

    expect(value(picker)).toBe('2019-11-23 09:50:45');
    expect(fmt(picker.getDate(), 'YYYY-MM-DD HH:mm:ss')).toBe('2019-11-23 09:50:45');
  });

  test('a time chosen before the date is applied to the clicked day', () => {
    const picker = create();
    picker.show();

    choose(picker, 'input[HH]', '7');
    expect(picker.getDate()).toBeNull();
    expect(value(picker)).toBe('');

    click(day(picker, 5));

    expect(value(picker)).toBe('2019-11-05 07:00');
  });

  test('getDate is null without a date', () => {
    expect(create().getDate()).toBeNull();
  });
});

describe('format12', () => {
  const periodOf = (picker: easepick.Core) => [
    select(picker, 'input[HH]').value,
    select(picker, 'input[period]').value,
  ];

  test('renders 1–12 hours and an AM/PM select', () => {
    const picker = create({ format12: true }, { date: '2019-11-23 14:35' });

    expect(optionValues(select(picker, 'input[HH]'))).toEqual(
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    );
    expect(optionValues(select(picker, 'input[period]'))).toEqual(['AM', 'PM']);
    expect(periodOf(picker)).toEqual(['2', 'PM']);
  });

  test('midnight is 12 AM and noon is 12 PM', () => {
    expect(periodOf(create({ format12: true }, { date: '2019-11-23 00:10' }))).toEqual(['12', 'AM']);
    expect(periodOf(create({ format12: true }, { date: '2019-11-23 12:00' }))).toEqual(['12', 'PM']);
    expect(periodOf(create({ format12: true }, { date: '2019-11-23 09:00' }))).toEqual(['9', 'AM']);
  });

  test('changing the hour keeps the period', () => {
    const picker = create({ format12: true }, { date: '2019-11-23 14:35' });

    choose(picker, 'input[HH]', '3');
    expect(value(picker)).toBe('2019-11-23 15:35');

    choose(picker, 'input[HH]', '12');
    expect(value(picker)).toBe('2019-11-23 12:35');
  });

  test('changing the period keeps the hour', () => {
    const picker = create({ format12: true }, { date: '2019-11-23 03:20' });

    choose(picker, 'input[period]', 'PM');
    expect(value(picker)).toBe('2019-11-23 15:20');

    choose(picker, 'input[period]', 'AM');
    expect(value(picker)).toBe('2019-11-23 03:20');
  });

  test('12 AM is midnight, 12 PM is noon', () => {
    const picker = create({ format12: true }, { date: '2019-11-23 12:20' });

    choose(picker, 'input[period]', 'AM');
    expect(value(picker)).toBe('2019-11-23 00:20');

    choose(picker, 'input[period]', 'PM');
    expect(value(picker)).toBe('2019-11-23 12:20');
  });
});

describe('native input', () => {
  test('renders input[type=time] with the parsed time', () => {
    const picker = create({ native: true }, { date: '2019-11-23 08:05' });
    const el = nativeInput(picker, 'input');

    expect(el.type).toBe('time');
    expect(el.value).toBe('08:05');
    expect(picker.ui.container.querySelector('select')).toBeNull();
  });

  test('is empty without a time', () => {
    expect(nativeInput(create({ native: true }), 'input').value).toBe('');
  });

  test('typing a time updates the date (autoApply)', () => {
    const picker = create({ native: true }, { date: '2019-11-23 08:05' });

    typeTime(picker, 'input', '17:45');
    expect(value(picker)).toBe('2019-11-23 17:45');

    typeTime(picker, 'input', '');
    expect(value(picker)).toBe('2019-11-23 00:00');
  });
});

describe('setTime', () => {
  test('sets the time of the date and re-renders the selects', () => {
    const picker = create({ seconds: true, stepSeconds: 1 }, { date: '2019-11-23 00:00:00', format: 'YYYY-MM-DD HH:mm:ss' });

    picker.setTime('10:20:30');

    expect(value(picker)).toBe('2019-11-23 10:20:30');
    expect(fmt(picker.getDate(), 'HH:mm:ss')).toBe('10:20:30');
    expect(select(picker, 'input[HH]').value).toBe('10');
    expect(select(picker, 'input[mm]').value).toBe('20');
    expect(select(picker, 'input[ss]').value).toBe('30');
  });

  test('missing or invalid parts are zero', () => {
    const picker = create({}, { date: '2019-11-23 14:35' });

    picker.setTime('9');
    expect(value(picker)).toBe('2019-11-23 09:00');

    picker.setTime('foo:bar');
    expect(value(picker)).toBe('2019-11-23 00:00');
  });
});

describe('without autoApply', () => {
  test('successive changes accumulate until Apply', () => {
    const picker = create({}, { date: '2019-11-23 14:35', autoApply: false });
    picker.show();

    choose(picker, 'input[HH]', '9');
    choose(picker, 'input[mm]', '10');
    expect(value(picker)).toBe('2019-11-23 14:35');

    click(applyButton(picker));

    expect(value(picker)).toBe('2019-11-23 09:10');
  });

  test('a pending time survives picking a day, and both are applied', () => {
    const picker = create({}, { date: '2019-11-23 14:35', autoApply: false });
    picker.show();

    choose(picker, 'input[HH]', '9');
    click(day(picker, 5));
    expect(select(picker, 'input[HH]').value).toBe('9');

    click(applyButton(picker));

    expect(value(picker)).toBe('2019-11-05 09:35');
  });

  test('Apply stays disabled without a date to apply the time to', () => {
    const picker = create({}, { autoApply: false });
    picker.show();

    choose(picker, 'input[HH]', '9');

    expect(applyButton(picker).disabled).toBe(true);
  });
});

describe('range', () => {
  test('renders a start and an end block', () => {
    const picker = createRange();

    expect(select(picker, 'start[HH]')).not.toBeNull();
    expect(select(picker, 'end[HH]')).not.toBeNull();
    expect(select(picker, 'input[HH]')).toBeNull();
  });

  test('renders native start and end inputs', () => {
    const picker = createRange(
      { startDate: new DateTime('2019-11-05 10:00', FORMAT), endDate: new DateTime('2019-11-12 18:30', FORMAT) },
      { native: true },
    );

    expect(nativeInput(picker, 'start').value).toBe('10:00');
    expect(nativeInput(picker, 'end').value).toBe('18:30');
  });

  test('getStartDate / getEndDate are null without a range', () => {
    const picker = createRange();

    expect(picker.getStartDate()).toBeNull();
    expect(picker.getEndDate()).toBeNull();
  });

  test('setStartTime / setEndTime apply to the selected range', () => {
    const picker = createRange();
    picker.setStartTime('10:00');
    picker.setEndTime('18:30');
    picker.show();

    click(day(picker, 5));
    click(day(picker, 12));

    expect(value(picker)).toBe('2019-11-05 10:00 - 2019-11-12 18:30');
    expect(fmt(picker.getStartDate())).toBe('2019-11-05 10:00');
    expect(fmt(picker.getEndDate())).toBe('2019-11-12 18:30');
    expect(select(picker, 'start[HH]').value).toBe('10');
    expect(select(picker, 'end[mm]').value).toBe('30');
  });

  test('changing the start and end selects updates the input (autoApply)', () => {
    const picker = createRange({
      startDate: new DateTime('2019-11-05 10:00', FORMAT),
      endDate: new DateTime('2019-11-12 18:30', FORMAT),
    });

    choose(picker, 'start[HH]', '8');
    choose(picker, 'end[mm]', '45');

    expect(value(picker)).toBe('2019-11-05 08:00 - 2019-11-12 18:45');
  });

  test('typing in native inputs updates the input (autoApply)', () => {
    const picker = createRange({
      startDate: new DateTime('2019-11-05 10:00', FORMAT),
      endDate: new DateTime('2019-11-12 18:30', FORMAT),
    }, { native: true });

    typeTime(picker, 'end', '20:15');

    expect(value(picker)).toBe('2019-11-05 10:00 - 2019-11-12 20:15');
  });

  describe('parsing initial times', () => {
    test('startDate and endDate options', () => {
      const picker = createRange({
        startDate: new DateTime('2019-11-05 10:00', FORMAT),
        endDate: new DateTime('2019-11-12 18:30', FORMAT),
      });

      expect(value(picker)).toBe('2019-11-05 10:00 - 2019-11-12 18:30');
      expect([select(picker, 'start[HH]').value, select(picker, 'end[HH]').value]).toEqual(['10', '18']);
    });

    test('non-strict: a lone startDate or endDate option', () => {
      const start = createRange({ strict: false, startDate: new DateTime('2019-11-05 10:00', FORMAT) });
      expect(fmt(start.getStartDate())).toBe('2019-11-05 10:00');
      expect(start.getEndDate()).toBeNull();
      expect(select(start, 'start[HH]').value).toBe('10');

      const end = createRange({ strict: false, endDate: new DateTime('2019-11-12 18:30', FORMAT) });
      expect(fmt(end.getEndDate())).toBe('2019-11-12 18:30');
      expect(select(end, 'end[HH]').value).toBe('18');
    });

    test('a pre-filled single input', () => {
      const picker = createRange({}, {}, { element: input('2019-11-05 10:00 - 2019-11-12 18:30') });

      expect(fmt(picker.getStartDate())).toBe('2019-11-05 10:00');
      expect(fmt(picker.getEndDate())).toBe('2019-11-12 18:30');
      expect([select(picker, 'start[HH]').value, select(picker, 'end[HH]').value]).toEqual(['10', '18']);
    });

    test('pre-filled element and elementEnd', () => {
      const picker = createRange(
        { elementEnd: input('2019-11-12 18:30') },
        {},
        { element: input('2019-11-05 10:00') },
      );

      expect(fmt(picker.getStartDate())).toBe('2019-11-05 10:00');
      expect(fmt(picker.getEndDate())).toBe('2019-11-12 18:30');
      expect([select(picker, 'start[HH]').value, select(picker, 'end[HH]').value]).toEqual(['10', '18']);
    });

    test('non-strict: element and elementEnd times go to the start and the end', () => {
      const picker = createRange(
        { strict: false, elementEnd: input('2019-11-12 18:30') },
        {},
        { element: input('2019-11-05 10:00') },
      );

      expect(fmt(picker.getStartDate())).toBe('2019-11-05 10:00');
      expect(fmt(picker.getEndDate())).toBe('2019-11-12 18:30');
      expect([select(picker, 'start[HH]').value, select(picker, 'end[HH]').value]).toEqual(['10', '18']);
    });

    test('non-strict: start and end times in the single input', () => {
      const picker = createRange({ strict: false }, {}, { element: input('2019-11-05 10:00 - 2019-11-12 18:30') });

      expect(fmt(picker.getStartDate())).toBe('2019-11-05 10:00');
      expect(fmt(picker.getEndDate())).toBe('2019-11-12 18:30');
      expect([select(picker, 'start[HH]').value, select(picker, 'end[HH]').value]).toEqual(['10', '18']);
    });

    test('strict: a half-filled pair of inputs gives no time', () => {
      const picker = createRange({ elementEnd: input() }, {}, { element: input('2019-11-05 10:00') });

      expect(picker.getStartDate()).toBeNull();
      expect(select(picker, 'start[HH]').value).toBe('0');
    });

    test('non-strict: only the start input filled', () => {
      const picker = createRange(
        { strict: false, elementEnd: input() },
        {},
        { element: input('2019-11-05 10:00') },
      );

      expect(fmt(picker.getStartDate())).toBe('2019-11-05 10:00');
      expect(select(picker, 'start[HH]').value).toBe('10');
    });

    test('non-strict: only a start in the single input', () => {
      const picker = createRange({ strict: false }, {}, { element: input('2019-11-05 10:00 - ') });

      expect(fmt(picker.getStartDate())).toBe('2019-11-05 10:00');
      expect(select(picker, 'start[HH]').value).toBe('10');
    });
  });

  describe('Apply button without autoApply', () => {
    const open = (rangeOptions: Record<string, unknown>) => {
      const picker = createRange(rangeOptions, {}, { autoApply: false });
      picker.show();
      return picker;
    };
    const startDate = new DateTime('2019-11-05 10:00', FORMAT);
    const endDate = new DateTime('2019-11-12 18:30', FORMAT);

    test('strict: a time change on a selected range enables Apply and is applied', () => {
      const picker = open({ startDate: startDate.clone(), endDate: endDate.clone() });
      expect(applyButton(picker).disabled).toBe(true);

      choose(picker, 'end[HH]', '20');
      expect(applyButton(picker).disabled).toBe(false);
      expect(value(picker)).toBe('2019-11-05 10:00 - 2019-11-12 18:30');

      click(applyButton(picker));
      expect(value(picker)).toBe('2019-11-05 10:00 - 2019-11-12 20:30');
    });

    test('strict: no range, or a single picked day, keeps Apply disabled', () => {
      const picker = open({});

      choose(picker, 'start[HH]', '9');
      expect(applyButton(picker).disabled).toBe(true);

      click(day(picker, 5));
      choose(picker, 'start[HH]', '10');
      expect(applyButton(picker).disabled).toBe(true);

      click(day(picker, 8));
      choose(picker, 'end[HH]', '11');
      expect(applyButton(picker).disabled).toBe(false);
    });

    test('non-strict: a lone start date or a single picked day enables Apply', () => {
      const withStart = open({ strict: false, startDate: startDate.clone() });
      choose(withStart, 'start[HH]', '9');
      expect(applyButton(withStart).disabled).toBe(false);

      const withPick = open({ strict: false });
      choose(withPick, 'start[HH]', '9');
      expect(applyButton(withPick).disabled).toBe(true);
      click(day(withPick, 5));
      choose(withPick, 'start[HH]', '10');
      expect(applyButton(withPick).disabled).toBe(false);
    });
  });
});

test('detaching removes the time UI and methods', () => {
  const picker = create({}, { date: '2019-11-23 14:35' });

  picker.PluginManager.removeInstance('TimePlugin');
  picker.renderAll();

  expect(picker.ui.container.querySelector('.time-plugin-container')).toBeNull();
  expect(picker.setTime).toBeUndefined();
  expect(picker.setStartTime).toBeUndefined();
  expect(picker.setEndTime).toBeUndefined();
  expect(picker.ui.container.classList.contains('time-plugin')).toBe(false);
});
