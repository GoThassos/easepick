import { easepick, DateTime } from '@gothassos/easepick-bundle';
import { PackageManager } from './packageManager';
import { AmpPkg } from './packages/amp-pkg';
import { CorePkg } from './packages/core-pkg';
import { KbdPkg } from './packages/kbd-pkg';
import { LockPkg } from './packages/lock-pkg';
import { PresetPkg } from './packages/preset-pkg';
import { RangePkg } from './packages/range-pkg';
import { TimePkg } from './packages/time-pkg';
import { deepmerge } from 'deepmerge-ts';
// Styles (./scss/index.scss) are imported by the docs' Configurator.vue.

/**
 * Mount the configurator into `app` (the `#app-configurator` element rendered by
 * Configurator.vue). The original build exposed this as a `gh.configurator()` global
 * and loaded easepick from a CDN; here it uses this repo's bundle directly.
 *
 * @param css Bundle stylesheet text for the picker's shadow DOM.
 * @returns A function that destroys the picker.
 */
export function mountConfigurator(app: HTMLElement, css: string): () => void {

  const optionsElement = app.querySelector('.package-options');

  // show/hide unconfigurable options
  app.querySelector('.tip #yes-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const span = (e.target as HTMLElement).previousElementSibling;
    if (optionsElement.classList.contains('all-options')) {
      optionsElement.classList.remove('all-options');
      span.innerHTML = 'You want to display all options anyway ?';
    } else {
      optionsElement.classList.add('all-options');
      span.innerHTML = 'You want to hide these options ?';
    }
  });

  // hide question row
  app.querySelector('.tip #no-btn').addEventListener('click', (e) => {
    e.preventDefault();
    (e.target as HTMLElement).closest('p').style.display = 'none';
  });

  // tab handler
  [...app.querySelectorAll('.tabs-wrapper .tab')].forEach(tab => {
    tab.addEventListener('click', (e) => {
      const wrapper = tab.closest('.tabs-wrapper');
      const tabs = wrapper.firstElementChild
      const contents = wrapper.lastElementChild;

      [...tabs.children].forEach(x => {
        x.classList.remove('active');

        if (x.firstElementChild instanceof HTMLInputElement) {
          x.firstElementChild.checked = false;
        }
      });
      tab.classList.add('active');

      if (tab.firstElementChild instanceof HTMLInputElement) {
        tab.firstElementChild.checked = true;
      }

      const tabIndex = [...tabs.children].indexOf(tab);
      [...contents.children].forEach(x => x.classList.remove('active'));
      const tabContent = contents.children[tabIndex] as HTMLElement;
      tabContent.classList.add('active');
    });
  });

  const defaultConfig = {
    element: document.getElementById('app-picker'),
    css,
    zIndex: 10,
  }
  const picker = new easepick.create({ ...defaultConfig });
  const baseConfig = { ...picker.options };
  const baseConfigPlugin = {};

  const packageManager = new PackageManager();
  packageManager.add(new CorePkg());
  packageManager.add(new AmpPkg());
  packageManager.add(new RangePkg());
  packageManager.add(new LockPkg());
  packageManager.add(new PresetPkg());
  packageManager.add(new KbdPkg());
  packageManager.add(new TimePkg());

  // handler options
  app.addEventListener('options', (e: CustomEvent) => {
    const packages = packageManager.packages.filter(x => x.included);
    let config = {};
    let plugins = [];

    packages.forEach(pkg => {
      const pkgConfig = pkg.createConfig();
      config = deepmerge(config, pkgConfig);
      plugins.push(pkg.optionKey);
    });

    if ('LockPlugin' in config) {
      if ('minDate' in config['LockPlugin']) {
        config['LockPlugin']['minDate'] = new DateTime(config['LockPlugin']['minDate']);
      }

      if ('maxDate' in config['LockPlugin']) {
        config['LockPlugin']['maxDate'] = new DateTime(config['LockPlugin']['maxDate']);
      }
    }

    const pickerLayout = packageManager.app.querySelector('.app-picker-layout');

    // show/hide element end
    pickerLayout.classList.toggle('element-end', 'RangePlugin' in config && 'elementEnd' in config['RangePlugin']);

    // replace elementEnd placeholder to exists element
    if ('RangePlugin' in config && 'elementEnd' in config['RangePlugin']) {
      config['RangePlugin']['elementEnd'] = document.getElementById('app-picker-end');
    }

    // handle event.detail
    if ('detail' in e && e.detail !== null) {
      const { pkg, included } = e.detail;

      // on enable/disable plugin via checkbox
      if (pkg && typeof included !== 'undefined') {
        if (included) {
          pkg.dependencies.forEach(dep => {
            const dPkg = packageManager.get(dep);
            dPkg.included = true;

            const pkgCheckbox = document.querySelector(`input#${dPkg.id()}`) as HTMLInputElement;
            pkgCheckbox.disabled = true;
            pkgCheckbox.checked = true;

            plugins.unshift(dep);
          });

          plugins.push(pkg.optionKey);
        } else {
          picker.PluginManager.removeInstance(pkg.optionKey);

          pkg.dependencies.forEach(dep => {
            const dPkg = packageManager.get(dep);
            //dPkg.included = true;

            const pkgCheckbox = document.querySelector(`input#${dPkg.id()}`) as HTMLInputElement;
            pkgCheckbox.disabled = false;
            pkgCheckbox.checked = true;
          });
        }
      }
    }

    picker.options = deepmerge(baseConfig, config);
    plugins = [...new Set(plugins.filter(x => x))];
    picker.options.plugins = [...plugins];

    if (plugins.length) {
      config['plugins'] = [...plugins];
    }

    // remove all plugin instances
    for (const instance of Object.keys(picker.PluginManager.instances)) {
      picker.PluginManager.removeInstance(instance);
    }

    // add plugin instance and apply options
    plugins.forEach(pluginName => {
      picker.PluginManager.addInstance(pluginName);
      const instance = picker.PluginManager.getInstance(pluginName);

      if (!(pluginName in baseConfigPlugin)) {
        baseConfigPlugin[pluginName] = { ...instance['options'] };
      }

      instance['options'] = deepmerge(baseConfigPlugin[pluginName], config[pluginName] || {});
    });

    picker.updateValues();
    picker.renderAll();

    packageManager.setupInfo(picker.version, deepmerge(defaultConfig, config));
    packageManager.checkRequirements(config);

    if ('inline' in config) {
      picker.ui.container.classList.add('inline');
      picker.ui.container.style.removeProperty('position');
      picker.ui.container.style.removeProperty('top');
      picker.ui.container.style.removeProperty('left');
      picker.ui.wrapper.style.position = 'relative';
    } else {
      picker.ui.container.classList.remove('inline');
      picker.ui.wrapper.style.position = 'absolute';
    }

    (picker.options.element as HTMLInputElement).readOnly = !('readonly' in config);

    if ('zIndex' in config) {
      picker.ui.container.style.zIndex = config['zIndex'];
    }
  });

  packageManager.renderHTML();
  app.dispatchEvent(new CustomEvent('options'));

  return () => picker.destroy();
}