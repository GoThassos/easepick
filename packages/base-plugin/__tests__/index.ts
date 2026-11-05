import { Core } from '@gothassos/easepick-core';
import { BasePlugin, IPlugin } from '../src/index';
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

class SamplePlugin extends BasePlugin implements IPlugin {
  public options = {
    label: 'default',
    count: 1,
    nested: { a: 1, b: 2 },
    empty: {},
    nothing: null,
  };

  public attached = 0;
  public detached = 0;

  public getName(): string {
    return 'SamplePlugin';
  }

  public onAttach(): void {
    this.attached++;
  }

  public onDetach(): void {
    this.detached++;
  }
}

class NeedsSamplePlugin extends BasePlugin implements IPlugin {
  public dependencies = ['SamplePlugin', 'OtherPlugin'];
  public attached = 0;

  public getName(): string {
    return 'NeedsSamplePlugin';
  }

  public onAttach(): void {
    this.attached++;
  }

  public onDetach(): void {
    // nothing to clean up
  }
}

// A plugin without onDetach: detach() must not fail.
class NoDetachPlugin extends BasePlugin {
  public getName(): string {
    return 'NoDetachPlugin';
  }

  public onAttach(): void {
    // nothing to set up
  }
}

const createPicker = (extra: Record<string, unknown> = {}) => {
  const element = document.createElement('input');
  document.body.append(element);

  // Passed as a variable: plugin keys are not part of the core options type.
  const options = { element, ...extra };

  return new Core(options as any);
};

const attach = <T extends BasePlugin>(plugin: T, extra: Record<string, unknown> = {}): T => {
  plugin.attach(createPicker(extra) as any);
  return plugin;
};

afterEach(() => {
  jest.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('options', () => {
  test('keeps the defaults when the picker has no options for the plugin', () => {
    const plugin = attach(new SamplePlugin());

    expect(plugin.options).toEqual({
      label: 'default',
      count: 1,
      nested: { a: 1, b: 2 },
      empty: {},
      nothing: null,
    });
  });

  test('picker options override flat defaults', () => {
    const plugin = attach(new SamplePlugin(), { SamplePlugin: { label: 'custom' } });

    expect(plugin.options.label).toBe('custom');
    expect(plugin.options.count).toBe(1);
    expect(plugin.options.nested).toEqual({ a: 1, b: 2 });
  });

  test('a nested object with only known keys is merged into the defaults', () => {
    const plugin = attach(new SamplePlugin(), { SamplePlugin: { nested: { b: 20 } } });

    expect(plugin.options.nested).toEqual({ a: 1, b: 20 });
  });

  test('a nested object with an unknown key replaces the defaults', () => {
    const plugin = attach(new SamplePlugin(), { SamplePlugin: { nested: { b: 20, c: 30 } } });

    expect(plugin.options.nested).toEqual({ b: 20, c: 30 });
  });

  test('an empty nested object replaces the defaults', () => {
    const plugin = attach(new SamplePlugin(), { SamplePlugin: { nested: {} } });

    expect(plugin.options.nested).toEqual({});
  });

  test('a nested value can be replaced by a non-object', () => {
    const plugin = attach(new SamplePlugin(), { SamplePlugin: { nested: false } });

    expect(plugin.options.nested).toBe(false);
  });

  test('empty or null defaults are simply replaced', () => {
    const plugin = attach(new SamplePlugin(), {
      SamplePlugin: { empty: { x: 1 }, nothing: { y: 2 } },
    });

    expect(plugin.options.empty).toEqual({ x: 1 });
    expect(plugin.options.nothing).toEqual({ y: 2 });
  });

  test('merging does not mutate the plugin defaults or the picker options', () => {
    const pickerNested = { b: 20 };
    const plugin = new SamplePlugin();
    const defaults = plugin.options.nested;
    attach(plugin, { SamplePlugin: { nested: pickerNested } });

    expect(defaults).toEqual({ a: 1, b: 2 });
    expect(pickerNested).toEqual({ b: 20 });
    expect(plugin.options.nested).not.toBe(defaults);
  });
});

describe('attach / detach', () => {
  test('attach stores the picker, adds the kebab-case class and calls onAttach', () => {
    const plugin = new SamplePlugin();
    const picker = createPicker();
    plugin.attach(picker as any);

    expect(plugin.picker).toBe(picker);
    expect(picker.ui.container.classList.contains('sample-plugin')).toBe(true);
    expect(plugin.attached).toBe(1);
  });

  test('detach removes the class and calls onDetach', () => {
    const plugin = attach(new SamplePlugin());
    plugin.detach();

    expect(plugin.picker.ui.container.classList.contains('sample-plugin')).toBe(false);
    expect(plugin.detached).toBe(1);
  });

  test('detach works without onDetach', () => {
    const plugin = attach(new NoDetachPlugin());

    expect(plugin.picker.ui.container.classList.contains('no-detach-plugin')).toBe(true);
    expect(() => plugin.detach()).not.toThrow();
    expect(plugin.picker.ui.container.classList.contains('no-detach-plugin')).toBe(false);
  });

  test('missing dependencies: warns, and neither adds the class nor calls onAttach', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const plugin = attach(new NeedsSamplePlugin(), { plugins: [SamplePlugin] });

    expect(warn).toHaveBeenCalledWith('NeedsSamplePlugin: required dependencies (OtherPlugin).');
    expect(plugin.attached).toBe(0);
    expect(plugin.picker.ui.container.classList.contains('needs-sample-plugin')).toBe(false);
  });

  test('dependencies listed as constructors or names are found', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    // 'OtherPlugin' cannot be resolved by the plugin manager (warning), but
    // naming it in `plugins` is enough for the dependency check.
    const plugin = attach(new NeedsSamplePlugin(), { plugins: [SamplePlugin, 'OtherPlugin'] });

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('required dependencies'));
    expect(plugin.attached).toBe(1);
    expect(plugin.picker.ui.container.classList.contains('needs-sample-plugin')).toBe(true);
  });
});
