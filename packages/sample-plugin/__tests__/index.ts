import * as easepick from '@gothassos/easepick-core';
import { DateTime } from '@gothassos/easepick-datetime';
import { SamplePlugin } from '@gothassos/easepick-sample-plugin';
const pkg = require('../../core/package.json');

type Config = ConstructorParameters<typeof easepick.create>[0];

window['__VERSION__'] = pkg.version;

beforeEach(() => {
  document.body.innerHTML = '';
});

const create = (options: Partial<Config> = {}) => {
  const element = document.createElement('input');
  document.body.append(element);

  // Passed as a variable: plugin options come from module augmentation.
  const config: Config = {
    element,
    date: new DateTime(),
    plugins: [SamplePlugin],
    ...options,
  };

  return new easepick.create(config);
};

// The `.day` element of the given date, if it is shown.
const day = (picker: easepick.Core, date: DateTime) =>
  Array.from(picker.ui.container.querySelectorAll<HTMLElement>('.day'))
    .find(element => new DateTime(Number(element.dataset.time)).isSame(date, 'day'));

const today = () => new DateTime();

describe('SamplePlugin', () => {
  test('colors today with the default colors', () => {
    const picker = create();
    const element = day(picker, today());

    expect(element.style.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(element.style.color).toBe('rgb(255, 255, 255)');
  });

  test('uses the configured colors', () => {
    const picker = create({ SamplePlugin: { bgColor: 'red', fgColor: 'blue' } } as Partial<Config>);
    const element = day(picker, today());

    expect(element.style.backgroundColor).toBe('red');
    expect(element.style.color).toBe('blue');
  });

  test('leaves other days alone', () => {
    const picker = create();
    const tomorrow = today().add(1, 'day');
    const element = day(picker, tomorrow);

    // Today may be the last day of the month, so tomorrow may not be shown.
    if (element) {
      expect(element.style.backgroundColor).toBe('');
    }
    expect(picker.ui.container.querySelectorAll('.day[style*="background-color"]')).toHaveLength(1);
  });

  test('stops coloring once detached', () => {
    const picker = create();
    picker.PluginManager.removeInstance('SamplePlugin');
    picker.renderAll();

    expect(day(picker, today()).style.backgroundColor).toBe('');
  });
});
