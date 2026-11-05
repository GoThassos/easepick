import { DateTime } from '@gothassos/easepick-datetime';
import { RangePlugin } from '@gothassos/easepick-range-plugin';
import { AmpPlugin } from '@gothassos/easepick-amp-plugin';
import { TimePlugin } from '@gothassos/easepick-time-plugin';
import * as easepick from '../src/index';
const pkg = require('../package.json');

// 23 Nov, 2019 - repository creation date
const date = new DateTime(new Date(2019, 10, 23, 0, 0, 0, 0));

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

document.body.innerHTML = '<input id="datepicker"/>';

test('date', () => {
  const d = date.clone();
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    date: d,
  });

  expect(picker.getDate() instanceof DateTime && picker.getDate().format('D MMM YYYY') === '23 Nov 2019').toBe(true);
});

test('firstDay', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    firstDay: 0,
  });

  expect(picker.ui.container.querySelector('.dayname').textContent === 'Sun').toBe(true);
});

test('format', () => {
  const d = date.clone();
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    date: d.format('D MMM YYYY'),
    format: 'D MMM YYYY',
  });

  expect(picker.getDate() instanceof DateTime && picker.getDate().format('D MMM YYYY') === '23 Nov 2019').toBe(true);
});

test('grid', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    grid: 2,
  });

  expect(picker.ui.container.querySelector('.calendars').classList.contains('grid-2')).toBe(true);
});

test('calendars', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    calendars: 2,
  });

  expect(picker.ui.container.querySelectorAll('.calendar').length === 2).toBe(true);
});

test('lang', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    lang: 'ru-RU',
  });

  expect(picker.ui.container.querySelector('.dayname').textContent === 'пн').toBe(true);
});

describe('showOffsetDays', () => {
  // Nov 2019 starts on a Friday and has 30 days: with Monday first, there are
  // 4 leading cells (28–31 Oct) and 1 trailing cell (1 Dec).
  const offsetCells = (showOffsetDays: boolean) => {
    const picker = new easepick.create({
      element: document.getElementById('datepicker'),
      date: date.clone(),
      firstDay: 1,
      showOffsetDays,
    });

    return [...picker.ui.container.querySelectorAll('.days-grid > .offset')] as HTMLElement[];
  };

  test('disabled: only empty leading cells', () => {
    const cells = offsetCells(false);

    expect(cells.map(x => x.textContent)).toEqual(['', '', '', '']);
  });

  test('enabled: numbered leading and trailing cells', () => {
    const cells = offsetCells(true);

    expect(cells.map(x => x.textContent)).toEqual(['28', '29', '30', '31', '1']);
  });

  test('offset cells are never days', () => {
    for (const cell of offsetCells(true)) {
      expect(cell.classList.contains('day')).toBe(false);
      expect(cell.classList.contains('unit')).toBe(false);
      expect(cell.dataset.time).toBeUndefined();
    }
  });
});

describe('month title', () => {
  const monthName = (lang: string) => {
    const picker = new easepick.create({
      element: document.getElementById('datepicker'),
      date: date.clone(),
      lang,
    });

    return picker.ui.container.querySelector('.month-name');
  };

  test('uses the nominative form, not the genitive (Greek)', () => {
    expect(monthName('el-GR').querySelector('span').textContent).toBe('Νοέμβριος');
  });

  test('Russian', () => {
    expect(monthName('ru-RU').querySelector('span').textContent.toLowerCase()).toBe('ноябрь');
  });

  test('English', () => {
    expect(monthName('en-US').textContent).toBe('November 2019');
  });

  test('numeric-month languages keep the month suffix (Japanese)', () => {
    expect(monthName('ja-JP').querySelector('span').textContent).toBe('11月');
  });

  test('AmpPlugin month dropdown uses the nominative form (Greek)', () => {
    // Passed as a variable: plugins add their options to the built
    // core types (dist/types), and this file tests core from src.
    const options = {
      element: document.getElementById('datepicker'),
      date: date.clone(),
      lang: 'el-GR',
      plugins: [AmpPlugin],
      AmpPlugin: {
        dropdown: { months: true, years: true },
      },
    };
    const picker = new easepick.create(options);
    const select = picker.ui.container.querySelector('.month-name--dropdown') as HTMLSelectElement;
    const months = Array.from(select.options).map(o => o.text);

    expect(months.length).toBe(12);
    expect(months[10]).toBe('Νοέμβριος');
    expect(months[0]).toBe('Ιανουάριος');
    expect(select.value).toBe('10');
  });

  test('keeps the [span, year] structure AmpPlugin relies on', () => {
    const nodes = monthName('el-GR').childNodes;

    expect(nodes.length).toBe(2);
    expect(nodes[0].nodeName).toBe('SPAN');
    expect(nodes[1].textContent).toBe(' 2019');
  });
});

test('readonly', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    readonly: false,
  });

  expect((picker.options.element as HTMLInputElement).readOnly).toBe(false);
});

test('autoApply', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    autoApply: false,
  });

  expect(picker.ui.container.querySelector('footer') instanceof HTMLElement).toBe(true);
});

test('locale', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    autoApply: false,
    locale: {
      apply: 'OK',
    }
  });

  expect(picker.ui.container.querySelector('.apply-button').textContent === 'OK').toBe(true);
});

test('plugins', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    plugins: [RangePlugin],
  });

  expect(picker.ui.container.querySelector('.range-plugin-tooltip') instanceof HTMLElement).toBe(true);
});

// easepick/easepick#81: without autoApply, changing only the time of an
// already selected date must enable Apply, and Cancel must discard it.
describe('TimePlugin without autoApply', () => {
  const open = (native: boolean) => {
    const element = document.createElement('input');
    document.body.append(element);

    // Passed as a variable, like the AmpPlugin test above.
    const options = {
      element,
      date: '2019-11-23',
      autoApply: false,
      plugins: [TimePlugin],
      TimePlugin: { native },
    };
    const picker = new easepick.create(options);
    picker.show();

    const { container } = picker.ui;
    const applyButton = () => container.querySelector<HTMLButtonElement>('.apply-button');
    const setHours = (hours: string) => {
      if (native) {
        const input = container.querySelector<HTMLInputElement>('input.time-plugin-input');
        input.value = `${hours}:00`;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        const select = container.querySelector<HTMLSelectElement>('select[name="input[HH]"]');
        select.value = hours;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
    const click = (button: HTMLElement) => button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    return { picker, applyButton, setHours, click, container };
  };

  for (const native of [false, true]) {
    describe(native ? 'native input' : 'select inputs', () => {
      test('a time change enables Apply and is applied', () => {
        const { picker, applyButton, setHours, click } = open(native);

        expect(applyButton().disabled).toBe(true);
        setHours('15');
        expect(applyButton().disabled).toBe(false);

        click(applyButton());
        expect(picker.getDate().format('YYYY-MM-DD HH:mm')).toBe('2019-11-23 15:00');
      });

      test('Cancel discards the time change', () => {
        const { picker, applyButton, setHours, click, container } = open(native);

        setHours('15');
        click(container.querySelector<HTMLElement>('.cancel-button'));
        picker.show();
        click(applyButton());

        expect(picker.getDate().format('YYYY-MM-DD HH:mm')).toBe('2019-11-23 00:00');
      });
    });
  }
});

// easepick/easepick#213 and #231. jsdom has no layout, so the boxes are
// mocked. The wrapper is a 0×0 span right after the input; the viewport is
// jsdom's 1024×768 unless overridden.
describe('position', () => {
  const box = (left: number, top: number, width: number, height: number) =>
    ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect;

  const position = (input: DOMRect, width = 300, height = 350) => {
    const element = document.createElement('input');
    document.body.append(element);

    const picker = new easepick.create({ element });
    element.getBoundingClientRect = () => input;
    picker.ui.wrapper.getBoundingClientRect = () => box(input.right, input.top, 0, 0);
    picker.ui.container.getBoundingClientRect = () => box(0, 0, width, height);
    picker.show();

    // Back to viewport coordinates, for readability.
    return {
      left: parseFloat(picker.ui.container.style.left) + input.right,
      top: parseFloat(picker.ui.container.style.top) + input.top,
    };
  };

  const withViewportWidth = (width: number, fn: () => void) => {
    const original = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
    try {
      fn();
    } finally {
      Object.defineProperty(window, 'innerWidth', { value: original, configurable: true });
    }
  };

  test('below the input, left-aligned', () => {
    expect(position(box(100, 100, 200, 30))).toEqual({ left: 100, top: 130 });
  });

  test('above the input when there is no room below', () => {
    expect(position(box(100, 600, 200, 30))).toEqual({ left: 100, top: 250 });
  });

  test('stays below when there is no room above either', () => {
    expect(position(box(100, 300, 200, 30), 300, 500)).toEqual({ left: 100, top: 330 });
  });

  test('right-aligned when there is no room on the right', () => {
    expect(position(box(900, 100, 100, 30))).toEqual({ left: 700, top: 130 });
  });

  test('kept inside a narrow viewport', () => {
    withViewportWidth(320, () => {
      expect(position(box(150, 100, 100, 30))).toEqual({ left: 20, top: 130 });
    });
  });

  test('pinned to the left edge when wider than the viewport', () => {
    withViewportWidth(320, () => {
      expect(position(box(150, 100, 100, 30), 400)).toEqual({ left: 0, top: 130 });
    });
  });
});

// easepick/easepick#191 and #194: with `autoApply: false`, a repicked range
// waiting for the Apply button must survive the mouse leaving and re-entering.
describe('RangePlugin repick without autoApply', () => {
  const repick = (from: 'start' | 'end', day: number) => {
    const start = document.createElement('input');
    const end = document.createElement('input');
    document.body.append(start, end);

    // Passed as a variable, like the AmpPlugin test above.
    const options = {
      element: start,
      autoApply: false,
      plugins: [RangePlugin],
      RangePlugin: {
        elementEnd: end,
        repick: true,
        startDate: '2019-11-10',
        endDate: '2019-11-20',
      },
    };
    const picker = new easepick.create(options);
    const { container } = picker.ui;
    const time = String(new Date(2019, 10, day).getTime());

    picker.show({ target: from === 'start' ? start : end });
    container.querySelector<HTMLElement>(`.day[data-time="${time}"]`)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    container.dispatchEvent(new MouseEvent('mouseleave'));
    container.dispatchEvent(new MouseEvent('mouseenter'));
    container.querySelector<HTMLElement>('.apply-button')
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    return [start.value, end.value];
  };

  test('repicking the start keeps the end', () => {
    expect(repick('start', 5)).toEqual(['2019-11-05', '2019-11-20']);
  });

  test('repicking the end keeps the start', () => {
    expect(repick('end', 25)).toEqual(['2019-11-10', '2019-11-25']);
  });

  test('repicking the end before the start swaps them', () => {
    expect(repick('end', 5)).toEqual(['2019-11-05', '2019-11-10']);
  });
});

test('documentClick default', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
  });
  (picker.options.element as HTMLElement).dispatchEvent(new Event('click'));
  expect(picker.ui.container.classList.contains('show')).toBe(true);

  document.dispatchEvent(new Event('click'));
  expect(picker.ui.container.classList.contains('show')).toBe(false);
});


test('documentClick false', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    documentClick: false,
  });

  (picker.options.element as HTMLElement).dispatchEvent(new Event('click'));
  expect(picker.ui.container.classList.contains('show')).toBe(true);

  document.dispatchEvent(new Event('click'));
  expect(picker.ui.container.classList.contains('show')).toBe(true);
});

test('setup', () => {
  let picker = new easepick.create({
    element: document.getElementById('datepicker'),
    setup(picker) {
      picker.setDate(date);
    }
  });

  expect(picker.getDate() instanceof DateTime && picker.getDate().format('D MMM YYYY') === '23 Nov 2019').toBe(true);
});
