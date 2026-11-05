import { create } from '@gothassos/easepick-core';
import { RangePlugin } from '@gothassos/easepick-range-plugin';
import { LockPlugin } from '@gothassos/easepick-lock-plugin';
import { PresetPlugin } from '@gothassos/easepick-preset-plugin';
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

const newInput = () => {
  const element = document.createElement('input');
  document.body.append(element);
  return element;
};

// Options are passed as a variable: plugins add their options to the
// built core types (dist/types) through module augmentation.
const open = (extra: Record<string, unknown> = {}) => {
  const element = newInput();
  const options = {
    element,
    plugins: [RangePlugin, PresetPlugin],
    ...extra,
  };
  const picker = new create(options as any);
  picker.show();

  return { picker, element };
};

const ymd = (ms: string) => {
  const d = new Date(Number(ms));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const buttons = (picker) =>
  [...picker.ui.container.querySelectorAll('.preset-button')] as HTMLButtonElement[];

const button = (picker, label: string) => buttons(picker).find(b => b.textContent === label);

// { label: 'start - end' } as shown by the preset buttons.
const presets = (picker) => Object.fromEntries(
  buttons(picker).map(b => [b.textContent, `${ymd(b.dataset.start)} - ${ymd(b.dataset.end)}`]),
);

const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

// Presets are computed from "today".
const today = (y: number, m: number, d: number) => {
  jest.useFakeTimers().setSystemTime(new Date(y, m, d, 15, 30));
};

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('default presets', () => {
  test('are computed from today', () => {
    today(2019, 10, 23);
    const { picker } = open();

    expect(presets(picker)).toEqual({
      'Today': '2019-11-23 - 2019-11-23',
      'Yesterday': '2019-11-22 - 2019-11-22',
      'Last 7 Days': '2019-11-17 - 2019-11-23',
      'Last 30 Days': '2019-10-25 - 2019-11-23',
      'This Month': '2019-11-01 - 2019-11-30',
      'Last Month': '2019-10-01 - 2019-10-31',
    });
  });

  test('on the 31st, last month is the whole (shorter) previous month', () => {
    today(2020, 2, 31);
    const { picker } = open();
    const p = presets(picker);

    expect(p['This Month']).toBe('2020-03-01 - 2020-03-31');
    expect(p['Last Month']).toBe('2020-02-01 - 2020-02-29');
  });

  test('on the 31st after a 30-day month', () => {
    today(2019, 11, 31);
    const { picker } = open();
    const p = presets(picker);

    expect(p['This Month']).toBe('2019-12-01 - 2019-12-31');
    expect(p['Last Month']).toBe('2019-11-01 - 2019-11-30');
  });

  test('on the 1st of January, ranges cross into the previous year', () => {
    today(2020, 0, 1);
    const { picker } = open();

    expect(presets(picker)).toEqual({
      'Today': '2020-01-01 - 2020-01-01',
      'Yesterday': '2019-12-31 - 2019-12-31',
      'Last 7 Days': '2019-12-26 - 2020-01-01',
      'Last 30 Days': '2019-12-03 - 2020-01-01',
      'This Month': '2020-01-01 - 2020-01-31',
      'Last Month': '2019-12-01 - 2019-12-31',
    });
  });

  test('on the 1st of March of a leap year', () => {
    today(2020, 2, 1);
    const { picker } = open();
    const p = presets(picker);

    expect(p['Yesterday']).toBe('2020-02-29 - 2020-02-29');
    expect(p['Last 30 Days']).toBe('2020-02-01 - 2020-03-01');
    expect(p['Last Month']).toBe('2020-02-01 - 2020-02-29');
  });

  test('customLabels renames them, in order', () => {
    today(2019, 10, 23);
    const labels = ['Aujourd’hui', 'Hier', '7 jours', '30 jours', 'Ce mois', 'Mois dernier'];
    const { picker } = open({ PresetPlugin: { customLabels: labels } });
    const p = presets(picker);

    expect(Object.keys(p)).toEqual(labels);
    expect(p['Hier']).toBe('2019-11-22 - 2019-11-22');
    expect(p['Mois dernier']).toBe('2019-10-01 - 2019-10-31');
  });
});

describe('layout', () => {
  test('buttons are rendered in a container next to the calendars, on the left by default', () => {
    const { picker } = open();
    const main = picker.ui.container.querySelector('main');
    const container = main.querySelector(':scope > .preset-plugin-container');

    expect(container).toBeInstanceOf(HTMLElement);
    expect(container.querySelectorAll('button.preset-button').length).toBe(6);
    expect(main.classList.contains('preset-left')).toBe(true);
    expect(picker.ui.container.classList.contains('preset-plugin')).toBe(true);
  });

  test('position', () => {
    const { picker } = open({ PresetPlugin: { position: 'bottom' } });
    const main = picker.ui.container.querySelector('main');

    expect(main.classList.contains('preset-bottom')).toBe(true);
    expect(main.classList.contains('preset-left')).toBe(false);
  });

  test('announces the container and each button with view events', () => {
    const element = newInput();
    const views: string[] = [];
    const options = {
      element,
      plugins: [RangePlugin, PresetPlugin],
      setup(picker) {
        picker.on('view', (e: CustomEvent) => {
          if (e.detail.view.startsWith('PresetPlugin')) {
            views.push(`${e.detail.view}:${e.detail.target.textContent}`);
          }
        });
      },
      PresetPlugin: { customPreset: { A: [new Date(2019, 0, 1), new Date(2019, 0, 2)], B: [new Date(2019, 0, 3), new Date(2019, 0, 4)] } },
    };
    new create(options);

    expect(views).toEqual(['PresetPluginButton:A', 'PresetPluginButton:B', 'PresetPluginContainer:AB']);
  });

  test('requires RangePlugin', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { picker } = open({ plugins: [PresetPlugin] });

    expect(warn).toHaveBeenCalledWith('PresetPlugin: required dependencies (RangePlugin).');
    expect(picker.ui.container.querySelector('.preset-plugin-container')).toBeNull();
  });

  test('removing the plugin removes the buttons', () => {
    const { picker } = open();
    picker.PluginManager.removeInstance('PresetPlugin');
    picker.renderAll();

    expect(picker.ui.container.querySelector('.preset-plugin-container')).toBeNull();
    expect(picker.ui.container.classList.contains('preset-plugin')).toBe(false);
  });
});

describe('customPreset', () => {
  const customPreset = {
    'Christmas': [new Date(2019, 11, 24), new Date(2019, 11, 26)],
    'New Year': [new Date(2019, 11, 31), new Date(2020, 0, 1)],
  };

  test('replaces the default presets', () => {
    const { picker } = open({ PresetPlugin: { customPreset } });

    expect(presets(picker)).toEqual({
      'Christmas': '2019-12-24 - 2019-12-26',
      'New Year': '2019-12-31 - 2020-01-01',
    });
  });

  test('clicking a preset selects its range, fires select and hides the picker', () => {
    const { picker, element } = open({ PresetPlugin: { customPreset } });
    const select = jest.fn();
    picker.on('select', select);

    click(button(picker, 'Christmas'));

    expect(element.value).toBe('2019-12-24 - 2019-12-26');
    expect(select).toHaveBeenCalledTimes(1);
    const { start, end } = select.mock.calls[0][0].detail;
    expect([start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]).toEqual(['2019-12-24', '2019-12-26']);
    expect(picker.isShown()).toBe(false);
  });

  test('a click on markup inside a preset button selects that preset', () => {
    const { picker, element } = open({
      PresetPlugin: { customPreset: { '<b>Christmas</b>': customPreset.Christmas } },
    });

    click(picker.ui.container.querySelector('.preset-button b'));

    expect(element.value).toBe('2019-12-24 - 2019-12-26');
  });

  test('a click elsewhere in the preset container does nothing', () => {
    const { picker, element } = open({ PresetPlugin: { customPreset } });
    const select = jest.fn();
    picker.on('select', select);

    click(picker.ui.container.querySelector('.preset-plugin-container'));

    expect(element.value).toBe('');
    expect(select).not.toHaveBeenCalled();
    expect(picker.isShown()).toBe(true);
  });

  test('without autoApply, a preset is only preselected until Apply', () => {
    const { picker, element } = open({
      autoApply: false,
      date: '2019-12-01',
      PresetPlugin: { customPreset },
    });
    const select = jest.fn();
    picker.on('select', select);

    click(button(picker, 'Christmas'));

    expect(element.value).toBe('');
    expect(select).not.toHaveBeenCalled();
    expect(picker.isShown()).toBe(true);

    const dayEl = (d: number) => picker.ui.container
      .querySelector(`.day[data-time="${new Date(2019, 11, d).getTime()}"]`);
    expect(dayEl(24).classList.contains('start')).toBe(true);
    expect(dayEl(25).classList.contains('in-range')).toBe(true);
    expect(dayEl(26).classList.contains('end')).toBe(true);

    const apply = picker.ui.container.querySelector<HTMLButtonElement>('.apply-button');
    expect(apply.disabled).toBe(false);
    click(apply);

    expect(element.value).toBe('2019-12-24 - 2019-12-26');
    expect(select).toHaveBeenCalledTimes(1);
  });
});

describe('with LockPlugin', () => {
  const disabled = (extra: Record<string, unknown>) => {
    today(2019, 10, 23);
    const { picker } = open({ plugins: [RangePlugin, PresetPlugin, LockPlugin], ...extra });

    return buttons(picker).filter(b => b.disabled).map(b => b.textContent);
  };

  beforeEach(() => {
    // LockPlugin warns about RangePlugin when range options are used with
    // the RangePlugin class (it only looks for the string 'RangePlugin').
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  test('nothing is disabled without limits', () => {
    expect(disabled({ LockPlugin: {} })).toEqual([]);
  });

  test('minDays disables the shorter presets', () => {
    expect(disabled({ LockPlugin: { minDays: 2 } })).toEqual(['Today', 'Yesterday']);
  });

  test('maxDays disables the longer presets', () => {
    expect(disabled({ LockPlugin: { maxDays: 10 } }))
      .toEqual(['Last 30 Days', 'This Month', 'Last Month']);
  });

  test('minDate disables presets starting before it', () => {
    expect(disabled({ LockPlugin: { minDate: '2019-11-20' } }))
      .toEqual(['Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month']);
  });

  test('maxDate disables presets ending after it', () => {
    expect(disabled({ LockPlugin: { maxDate: '2019-11-22' } }))
      .toEqual(['Today', 'Last 7 Days', 'Last 30 Days', 'This Month']);
  });

  test('a locked day disables the presets containing it', () => {
    expect(disabled({ LockPlugin: { filter: (date: Date) => date.getDate() === 20 && date.getMonth() === 10 } }))
      .toEqual(['Last 7 Days', 'Last 30 Days', 'This Month']);
  });

  test('presets: false keeps every preset enabled', () => {
    expect(disabled({ LockPlugin: { minDays: 2, minDate: '2019-11-20', presets: false } })).toEqual([]);
  });
});
