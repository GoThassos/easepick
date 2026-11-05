import * as easepick from '@gothassos/easepick-core';
import { KbdPlugin } from '@gothassos/easepick-kbd-plugin';
import { LockPlugin } from '@gothassos/easepick-lock-plugin';
import { RangePlugin } from '@gothassos/easepick-range-plugin';
const pkg = require('../../core/package.json');

type Config = ConstructorParameters<typeof easepick.create>[0];

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

beforeEach(() => {
  document.body.innerHTML = '';
  // Range pickers open on today's month; keep it fixed. Also lets
  // jest.runAllTimers() flush the plugin's setTimeout() focus moves.
  jest.useFakeTimers({ now: new Date(2019, 10, 23, 12, 0, 0) });
});

afterEach(() => {
  jest.useRealTimers();
});

const create = (options: Partial<Config> = {}) => {
  const element = document.createElement('input');
  document.body.append(element);

  // Passed as a variable: plugin options come from module augmentation.
  const config: Config = {
    element,
    date: '2019-11-23',
    plugins: [KbdPlugin],
    ...options,
  };

  const picker = new easepick.create(config);
  picker.show();

  return picker;
};

const day = (picker: easepick.Core, y: number, m: number, d: number) =>
  picker.ui.container.querySelector<HTMLElement>(`.day[data-time="${new Date(y, m, d).getTime()}"]`);

const focused = (picker: easepick.Core) => picker.ui.shadowRoot.activeElement as HTMLElement;

// Day of month of the focused element, prefixed with its month ("11-24").
const focusedDay = (picker: easepick.Core) => {
  const date = new Date(Number(focused(picker).dataset.time));
  return `${date.getMonth() + 1}-${date.getDate()}`;
};

const keydown = (target: Element, code: string) => {
  const event = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
};

// Focus a day, press a key on it and let the deferred focus moves run.
const press = (picker: easepick.Core, target: HTMLElement, code: string) => {
  target.focus();
  const event = keydown(target, code);
  jest.runAllTimers();
  return event;
};

const iconHost = (picker: easepick.Core) => (picker.options.element as HTMLElement).nextElementSibling as HTMLElement;

describe('calendar icon', () => {
  test('a button is added after the input, at its right edge', () => {
    const element = document.createElement('input');
    document.body.append(element);
    element.style.fontSize = '18px';
    element.getBoundingClientRect = () => ({ width: 200 }) as DOMRect;
    Object.defineProperty(element, 'offsetLeft', { value: 10 });
    Object.defineProperty(element, 'offsetTop', { value: 30 });

    const picker = create({ element });
    const host = iconHost(picker);
    const button = host.shadowRoot.querySelector('button');

    expect(host.tagName).toBe('SPAN');
    expect(host.style.position).toBe('absolute');
    expect(host.style.top).toBe('30px');
    expect(host.style.left).toBe('185px');
    expect(button.textContent).toBe('\u{1F4C5}');
    expect(host.shadowRoot.querySelector('style').textContent).toContain('font-size: 18px;');
  });

  test('clicking it opens the picker, Escape on it closes it', () => {
    const picker = create();
    picker.hide();
    const button = iconHost(picker).shadowRoot.querySelector('button');

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    button.dispatchEvent(clickEvent);
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(picker.isShown()).toBe(true);

    keydown(button, 'Enter');
    expect(picker.isShown()).toBe(true);

    keydown(button, 'Escape');
    expect(picker.isShown()).toBe(false);
  });

  test('html replaces the icon', () => {
    const picker = create({ KbdPlugin: { html: '<button class="custom">Open</button>' } });
    const button = iconHost(picker).shadowRoot.querySelector('button');

    expect(button.className).toBe('custom');
    expect(iconHost(picker).shadowRoot.querySelector('style')).toBeNull();

    picker.hide();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(picker.isShown()).toBe(true);
  });

  test('html without a button is rendered as is', () => {
    const picker = create({ KbdPlugin: { html: '<i>icon</i>' } });

    expect(iconHost(picker).shadowRoot.innerHTML).toBe('<i>icon</i>');
  });
});

describe('tab indexes', () => {
  test('days get dayIndex, other units get unitIndex', () => {
    const picker = create({ autoApply: false });
    const { container } = picker.ui;
    const days = Array.from(container.querySelectorAll<HTMLElement>('.day'));
    const units = Array.from(container.querySelectorAll<HTMLElement>('.unit:not(.day)'));

    expect(days.length).toBe(30);
    expect(days.every(d => d.tabIndex === 2)).toBe(true);
    expect(units.map(u => u.className).sort()).toEqual(
      ['apply-button unit', 'cancel-button unit', 'next-button unit', 'previous-button unit'],
    );
    expect(units.every(u => u.tabIndex === 1)).toBe(true);
  });

  test('custom dayIndex / unitIndex', () => {
    const picker = create({ KbdPlugin: { dayIndex: 5, unitIndex: 4 } });

    expect(day(picker, 2019, 10, 1).tabIndex).toBe(5);
    expect(picker.ui.container.querySelector<HTMLElement>('.next-button').tabIndex).toBe(4);
  });

  test('locked days are not focusable', () => {
    const picker = create({
      plugins: [KbdPlugin, LockPlugin],
      LockPlugin: { minDate: '2019-11-10' },
    });

    expect(day(picker, 2019, 10, 9).hasAttribute('tabindex')).toBe(false);
    expect(day(picker, 2019, 10, 10).tabIndex).toBe(2);
  });
});

describe('arrow keys', () => {
  test.each([
    ['ArrowRight', '11-24'],
    ['ArrowLeft', '11-22'],
    ['ArrowDown', '11-30'],
    ['ArrowUp', '11-16'],
  ])('%s moves the focus to %s', (code, expected) => {
    const picker = create();
    const event = press(picker, day(picker, 2019, 10, 23), code);

    expect(focusedDay(picker)).toBe(expected);
    expect(event.defaultPrevented).toBe(true);
  });

  test('ArrowDown in the last week keeps the focus', () => {
    const picker = create();
    press(picker, day(picker, 2019, 10, 28), 'ArrowDown');

    expect(focusedDay(picker)).toBe('11-28');
  });

  test('ArrowUp in the first week keeps the focus', () => {
    const picker = create();
    press(picker, day(picker, 2019, 10, 3), 'ArrowUp');

    expect(focusedDay(picker)).toBe('11-3');
  });

  test('ArrowRight on the last day goes to the first day of the next month', () => {
    const picker = create();
    press(picker, day(picker, 2019, 10, 30), 'ArrowRight');

    expect(day(picker, 2019, 11, 1)).not.toBeNull();
    expect(focusedDay(picker)).toBe('12-1');
  });

  test('ArrowLeft on the first day goes to the last day of the previous month', () => {
    const picker = create();
    press(picker, day(picker, 2019, 10, 1), 'ArrowLeft');

    expect(day(picker, 2019, 9, 1)).not.toBeNull();
    expect(focusedDay(picker)).toBe('10-31');
  });

  test('locked days are skipped', () => {
    const picker = create({
      plugins: [KbdPlugin, LockPlugin],
      LockPlugin: { filter: (date) => (date as Date).getDate() === 24 },
    });
    press(picker, day(picker, 2019, 10, 23), 'ArrowRight');

    expect(focusedDay(picker)).toBe('11-25');
  });

  test('no month change past LockPlugin maxDate', () => {
    const picker = create({
      plugins: [KbdPlugin, LockPlugin],
      LockPlugin: { maxDate: '2019-11-30' },
    });
    press(picker, day(picker, 2019, 10, 30), 'ArrowRight');

    expect(day(picker, 2019, 11, 1)).toBeNull();
    expect(focusedDay(picker)).toBe('11-30');
  });

  test('no month change before LockPlugin minDate', () => {
    const picker = create({
      plugins: [KbdPlugin, LockPlugin],
      LockPlugin: { minDate: '2019-11-01' },
    });
    press(picker, day(picker, 2019, 10, 1), 'ArrowLeft');

    expect(day(picker, 2019, 9, 31)).toBeNull();
    expect(focusedDay(picker)).toBe('11-1');
  });

  test('arrow keys outside the days are left alone', () => {
    const picker = create();
    const next = picker.ui.container.querySelector<HTMLElement>('.next-button');
    next.focus();

    for (const code of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Enter']) {
      expect(keydown(next, code).defaultPrevented).toBe(false);
    }
    jest.runAllTimers();

    expect(focused(picker)).toBe(next);
    expect(day(picker, 2019, 10, 1)).not.toBeNull();
  });
});

describe('Enter and Space', () => {
  test.each(['Enter', 'Space'])('%s selects the focused day', (code) => {
    const picker = create();
    const event = press(picker, day(picker, 2019, 10, 25), code);

    expect(event.defaultPrevented).toBe(true);
    expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-25');
    expect(picker.isShown()).toBe(false);
  });

  test('without autoApply the focus stays on the picked day', () => {
    const picker = create({ autoApply: false });
    press(picker, day(picker, 2019, 10, 25), 'Enter');

    // The calendar was re-rendered: the focus is on the new element.
    expect(focused(picker).classList.contains('selected')).toBe(true);
    expect(focusedDay(picker)).toBe('11-25');
    expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-23');
  });

  test('a range can be picked with the keyboard', () => {
    const picker = create({ plugins: [KbdPlugin, RangePlugin] });

    press(picker, day(picker, 2019, 10, 10), 'Enter');
    expect(focusedDay(picker)).toBe('11-10');

    press(picker, focused(picker), 'ArrowRight');
    press(picker, focused(picker), 'ArrowRight');
    press(picker, focused(picker), 'ArrowRight');

    // The focused day gets a `mouseenter`, which previews the range.
    expect(focusedDay(picker)).toBe('11-13');
    const inRange = Array.from(picker.ui.container.querySelectorAll<HTMLElement>('.day.in-range'))
      .map(d => new Date(Number(d.dataset.time)).getDate());
    expect(inRange).toEqual([11, 12]);
    expect(day(picker, 2019, 10, 13).classList.contains('end')).toBe(true);

    press(picker, focused(picker), 'Enter');
    expect((picker.options.element as HTMLInputElement).value).toBe('2019-11-10 - 2019-11-13');
    expect(picker.isShown()).toBe(false);
  });
});

test('Escape on a day closes the picker', () => {
  const picker = create();
  press(picker, day(picker, 2019, 10, 23), 'Escape');

  expect(picker.isShown()).toBe(false);
});

test('detaching removes the icon and the key handling', () => {
  const picker = create();
  const host = iconHost(picker);

  picker.PluginManager.removeInstance('KbdPlugin');
  expect(host.isConnected).toBe(false);

  picker.renderAll();
  const target = day(picker, 2019, 10, 23);
  expect(target.hasAttribute('tabindex')).toBe(false);

  const event = keydown(target, 'Escape');
  expect(event.defaultPrevented).toBe(false);
  expect(picker.isShown()).toBe(true);
});
