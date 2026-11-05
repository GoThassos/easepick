import { BasePlugin, IPlugin } from '@gothassos/easepick-base-plugin';
import { Core } from '../src/index';
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

// Order in which plugins were attached, across all pickers of a test.
let attachLog: string[] = [];

abstract class LoggingPlugin extends BasePlugin implements IPlugin {
  public attachedTo: Core = null;
  public detachCount = 0;

  abstract getName(): string;

  public onAttach(): void {
    attachLog.push(this.getName());
    this.attachedTo = this.picker as unknown as Core;
  }

  public onDetach(): void {
    this.detachCount++;
  }
}

class AlphaPlugin extends LoggingPlugin {
  getName() { return 'AlphaPlugin'; }
}

class BetaPlugin extends LoggingPlugin {
  getName() { return 'BetaPlugin'; }
}

class HighPriorityPlugin extends LoggingPlugin {
  public priority = 10;
  getName() { return 'HighPriorityPlugin'; }
}

class DependentPlugin extends LoggingPlugin {
  public dependencies = ['AlphaPlugin'];
  getName() { return 'DependentPlugin'; }
}

class TwoDepsPlugin extends LoggingPlugin {
  public dependencies = ['AlphaPlugin', 'BetaPlugin'];
  getName() { return 'TwoDepsPlugin'; }
}

class MissingDepPlugin extends LoggingPlugin {
  public dependencies = ['NowherePlugin'];
  getName() { return 'MissingDepPlugin'; }
}

const createPicker = (plugins: Core['options']['plugins'] = []) => {
  const element = document.createElement('input');
  document.body.append(element);

  return new Core({ element, plugins });
};

let warn: jest.SpyInstance;

beforeEach(() => {
  attachLog = [];
  warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  warn.mockRestore();
  delete window['easepick'];
  document.body.innerHTML = '';
});

describe('initialize', () => {
  test('creates and attaches plugins given as constructors', () => {
    const picker = createPicker([AlphaPlugin, BetaPlugin]);
    const alpha = picker.PluginManager.getInstance<AlphaPlugin>('AlphaPlugin');

    expect(alpha).toBeInstanceOf(AlphaPlugin);
    expect(alpha.attachedTo).toBe(picker);
    expect(picker.PluginManager.getInstance('BetaPlugin')).toBeInstanceOf(BetaPlugin);
    expect(picker.ui.container.classList.contains('alpha-plugin')).toBe(true);
    expect(picker.ui.container.classList.contains('beta-plugin')).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  test('resolves plugins given as names from the global easepick bundle', () => {
    window['easepick'] = { AlphaPlugin };
    const picker = createPicker(['AlphaPlugin']);

    expect(picker.PluginManager.getInstance('AlphaPlugin')).toBeInstanceOf(AlphaPlugin);
    expect(attachLog).toEqual(['AlphaPlugin']);
  });

  test('warns about names that are not in the bundle', () => {
    window['easepick'] = { AlphaPlugin };
    const picker = createPicker(['AlphaPlugin', 'GhostPlugin']);

    expect(warn).toHaveBeenCalledWith('easepick: GhostPlugin not found.');
    expect(Object.keys(picker.PluginManager.instances)).toEqual(['AlphaPlugin']);
  });

  test('warns about names when there is no global bundle', () => {
    const picker = createPicker(['AlphaPlugin']);

    expect(warn).toHaveBeenCalledWith('easepick: AlphaPlugin not found.');
    expect(picker.PluginManager.instances).toEqual({});
  });

  test('warns about values that are neither constructors nor names', () => {
    // Deliberately invalid: not allowed by the `plugins` type.
    const picker = createPicker([42] as unknown as Core['options']['plugins']);

    expect(warn).toHaveBeenCalledWith('easepick: 42 not found.');
    expect(picker.PluginManager.instances).toEqual({});
  });

  test('attaches by descending priority, then by number of dependencies', () => {
    createPicker([TwoDepsPlugin, DependentPlugin, BetaPlugin, AlphaPlugin, HighPriorityPlugin]);

    expect(attachLog).toEqual([
      'HighPriorityPlugin',
      'BetaPlugin',
      'AlphaPlugin',
      'DependentPlugin',
      'TwoDepsPlugin',
    ]);
  });

  test('a plugin with a missing dependency is registered but not set up', () => {
    const picker = createPicker([MissingDepPlugin]);
    const plugin = picker.PluginManager.getInstance<MissingDepPlugin>('MissingDepPlugin');

    expect(warn).toHaveBeenCalledWith('MissingDepPlugin: required dependencies (NowherePlugin).');
    expect(plugin).toBeInstanceOf(MissingDepPlugin);
    expect(attachLog).toEqual([]);
    expect(picker.ui.container.classList.contains('missing-dep-plugin')).toBe(false);
  });

  test('a satisfied dependency lets the plugin attach', () => {
    const picker = createPicker([DependentPlugin, AlphaPlugin]);

    expect(attachLog).toEqual(['AlphaPlugin', 'DependentPlugin']);
    expect(picker.ui.container.classList.contains('dependent-plugin')).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('getInstance', () => {
  test('returns undefined for unknown plugins', () => {
    const picker = createPicker([AlphaPlugin]);

    expect(picker.PluginManager.getInstance('BetaPlugin')).toBeUndefined();
  });
});

describe('addInstance', () => {
  test('adds a plugin from the global bundle by name', () => {
    window['easepick'] = { BetaPlugin };
    const picker = createPicker([AlphaPlugin]);
    const beta = picker.PluginManager.addInstance<BetaPlugin>('BetaPlugin');

    expect(beta).toBeInstanceOf(BetaPlugin);
    expect(beta.attachedTo).toBe(picker);
    expect(picker.PluginManager.getInstance('BetaPlugin')).toBe(beta);
    expect(picker.ui.container.classList.contains('beta-plugin')).toBe(true);
  });

  test('re-adds a removed plugin from its constructor in the plugins option', () => {
    const picker = createPicker([AlphaPlugin, BetaPlugin]);
    const first = picker.PluginManager.getInstance('BetaPlugin');
    picker.PluginManager.removeInstance('BetaPlugin');
    const second = picker.PluginManager.addInstance<BetaPlugin>('BetaPlugin');

    expect(second).toBeInstanceOf(BetaPlugin);
    expect(second).not.toBe(first);
    expect(second.attachedTo).toBe(picker);
    expect(picker.PluginManager.getInstance('BetaPlugin')).toBe(second);
  });

  test('warns and returns null for an unknown plugin', () => {
    const picker = createPicker([AlphaPlugin]);

    expect(picker.PluginManager.addInstance('GhostPlugin')).toBeNull();
    expect(warn).toHaveBeenCalledWith('easepick: GhostPlugin not found.');
    expect(picker.PluginManager.getInstance('GhostPlugin')).toBeUndefined();
  });

  test('warns and returns null when the plugin is already added', () => {
    const picker = createPicker([AlphaPlugin]);
    const existing = picker.PluginManager.getInstance('AlphaPlugin');

    expect(picker.PluginManager.addInstance('AlphaPlugin')).toBeNull();
    expect(warn).toHaveBeenCalledWith('easepick: AlphaPlugin already added.');
    expect(picker.PluginManager.getInstance('AlphaPlugin')).toBe(existing);
  });
});

describe('removeInstance', () => {
  test('detaches and forgets the plugin', () => {
    const picker = createPicker([AlphaPlugin]);
    const alpha = picker.PluginManager.getInstance<AlphaPlugin>('AlphaPlugin');

    expect(picker.PluginManager.removeInstance('AlphaPlugin')).toBe(true);
    expect(alpha.detachCount).toBe(1);
    expect(picker.PluginManager.getInstance('AlphaPlugin')).toBeUndefined();
    expect(picker.ui.container.classList.contains('alpha-plugin')).toBe(false);
  });

  test('unknown plugins are ignored', () => {
    const picker = createPicker([AlphaPlugin]);

    expect(picker.PluginManager.removeInstance('BetaPlugin')).toBe(true);
    expect(Object.keys(picker.PluginManager.instances)).toEqual(['AlphaPlugin']);
  });
});

describe('reloadInstance', () => {
  test('replaces the plugin with a freshly attached one', () => {
    const picker = createPicker([AlphaPlugin]);
    const before = picker.PluginManager.getInstance<AlphaPlugin>('AlphaPlugin');
    const after = picker.PluginManager.reloadInstance<AlphaPlugin>('AlphaPlugin');

    expect(after).toBeInstanceOf(AlphaPlugin);
    expect(after).not.toBe(before);
    expect(before.detachCount).toBe(1);
    expect(attachLog).toEqual(['AlphaPlugin', 'AlphaPlugin']);
    expect(picker.PluginManager.getInstance('AlphaPlugin')).toBe(after);
    expect(picker.ui.container.classList.contains('alpha-plugin')).toBe(true);
  });

  test('works for plugins from the global bundle', () => {
    window['easepick'] = { AlphaPlugin };
    const picker = createPicker(['AlphaPlugin']);
    const before = picker.PluginManager.getInstance('AlphaPlugin');
    const after = picker.PluginManager.reloadInstance('AlphaPlugin');

    expect(after).toBeInstanceOf(AlphaPlugin);
    expect(after).not.toBe(before);
  });
});

describe('destroy', () => {
  test('detaches every plugin', () => {
    const picker = createPicker([AlphaPlugin, BetaPlugin]);
    const alpha = picker.PluginManager.getInstance<AlphaPlugin>('AlphaPlugin');
    const beta = picker.PluginManager.getInstance<BetaPlugin>('BetaPlugin');
    picker.destroy();

    expect(alpha.detachCount).toBe(1);
    expect(beta.detachCount).toBe(1);
    expect(picker.PluginManager.instances).toEqual({});
  });
});
