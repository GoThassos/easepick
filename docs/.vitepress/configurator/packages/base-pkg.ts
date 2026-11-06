import { Control } from '../control';
import { IOption, IOptionGroup, ISetup } from '../interface';

export class BasePkg {
  public name: string;
  public description: string;
  public optionKey: string;
  public url: string;
  public included: boolean = false;
  public options: IOptionGroup[] = [];
  public dependencies: string[] = [];
  public setup: ISetup;
  public app: HTMLElement;

  constructor() {
    if (typeof this['fillOptions'] === 'function') {
      this['fillOptions']();
    }

    this.app = document.getElementById('app-configurator');
  }

  public id() {
    return this.name.replace(/^@/, '').replace(/\//, '-');
  }

  public createConfig() {
    let config = {};

    this.options.forEach(group => {
      group.children.forEach(opt => {
        if (opt.modified) {
          if (group.name) {
            if (!(group.name in config)) {
              config[group.name] = {};
            }

            config[group.name][opt.name] = opt.value;
          } else {
            config[opt.name] = opt.value;
          }
        }
      });
    });

    if (this.optionKey) {
      const configCopy = { ...config };
      config = {};
      config[this.optionKey] = { ...configCopy };
    }

    return config;
  }

  public createTab() {
    const tab = document.createElement('div');
    tab.className = 'pkg-tab';
    tab.classList.toggle('active', this.name === '@gothassos/easepick-core');
    tab.classList.toggle('included', this.included);
    tab.addEventListener('click', (e) => {
      if (e.target instanceof HTMLElement && e.target.nodeName !== 'INPUT') {
        [...this.app.querySelectorAll('.pkg-tab')].forEach(x => x.classList.remove('active'));
        tab.classList.add('active');

        [...this.app.querySelectorAll('.pkg-options')].forEach(x => x.classList.remove('active'));
        const options = this.app.querySelector(`.${this.id()}-options`);
        options.classList.add('active');
      }
    });

    const tabName = document.createElement('div');
    tabName.className = 'pkg-tab-name';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = this.id();
    input.checked = this.included;
    input.disabled = this.name === '@gothassos/easepick-core';
    input.className = 'pkg-checkbox';
    input.addEventListener('change', (e) => {
      this.included = input.checked;
      tab.classList.toggle('included', input.checked);

      const detail = {
        pkg: this,
        included: input.checked,
      }
      this.app.dispatchEvent(new CustomEvent('options', { detail }));
    });
    tabName.appendChild(input);

    // `@gothassos/easepick-range-plugin` does not fit the column; show `range-plugin`.
    const span = document.createElement('span');
    span.innerText = this.name.replace(/^@gothassos\/easepick-/, '');
    span.title = this.name;
    tabName.appendChild(span);
    tab.appendChild(tabName);

    const tabInfo = document.createElement('div');
    tabInfo.className = 'pkg-tab-info';
    tabInfo.innerText = this.description;
    tab.appendChild(tabInfo);

    this.app.querySelector('.packages-list').appendChild(tab);
  }

  public createTabContent() {
    const options = document.createElement('div');
    options.className = `pkg-options ${this.id()}-options`;
    options.classList.toggle('active', this.name === '@gothassos/easepick-core');

    const control = new Control();
    for (let group of this.options) {
      let fieldSet = null;

      if (group.name) {
        fieldSet = document.createElement('fieldset');
        fieldSet.innerHTML = `<legend>${group.name}</legend>`;
        fieldSet.classList.toggle('configurable', group.configurable);
      }

      for (let opt of group.children) {
        const optBlock = document.createElement('div');
        optBlock.className = 'pkg-option';
        optBlock.classList.toggle('configurable', opt.configurable);

        const optName = document.createElement('div');
        optName.className = 'pkg-option-name';
        optName.innerHTML = opt.name;
        optBlock.appendChild(optName);

        const optButtons = document.createElement('div');
        optButtons.className = 'pkg-option-buttons';
        optName.appendChild(optButtons);

        if (!group.name) {
          const linkIcon = document.createElement('a');
          linkIcon.className = 'icon icon-link';
          linkIcon.href = `${this.url}#option-${opt.name}`;
          linkIcon.target = '_blank';
          optButtons.appendChild(linkIcon);
        }

        if (opt.info) {
          const infoIcon = document.createElement('div');
          infoIcon.className = 'icon icon-info';
          infoIcon.dataset.title = opt.info;
          optButtons.appendChild(infoIcon);
        }

        if (opt.requirements) {
          const warnIcon = document.createElement('div');
          warnIcon.className = 'icon icon-warn';

          if (opt.requirements.depends instanceof Array) {
            warnIcon.dataset.title = `Required: ${this.formatRequirements(opt.requirements.depends)}`;
          }
          else if (opt.requirements.conflict instanceof Array) {
            warnIcon.dataset.title = `Ignored due to: ${this.formatRequirements(opt.requirements.conflict)}`;
          }

          optButtons.appendChild(warnIcon);
        }

        if (typeof control[opt.type] == 'function') {
          const controlElement = control[opt.type](opt);

          this.addEventListener(controlElement, opt);

          optBlock.appendChild(controlElement);
        } else if (!opt.configurable) {
          const controlElement = control.unconfigurable(opt);
          optBlock.appendChild(controlElement);
        }

        opt.element = optBlock;

        if (fieldSet) {
          fieldSet.appendChild(optBlock);
          options.appendChild(fieldSet);
        } else {
          options.appendChild(optBlock);
        }
      }
    }
    this.app.querySelector('.pkg-options-content').appendChild(options);
  }

  private addEventListener(element: HTMLElement, opt: IOption) {
    if (typeof this[`${opt.type}Listener`] === 'function') {
      this[`${opt.type}Listener`](element, opt);
    }
  }

  private rangeListener(element: HTMLElement, opt: IOption) {
    element.addEventListener('input', (e) => {
      const el = e.target as HTMLInputElement;
      opt.modified = el.valueAsNumber !== opt.default;
      opt.value = el.valueAsNumber;
      (el.nextElementSibling as HTMLElement).innerText = el.value;

      const detail = { pkg: this, opt };
      this.app.dispatchEvent(new CustomEvent('options', { detail }));
    });
  }

  private dropdownListener(element: HTMLElement, opt: IOption) {
    element.addEventListener('change', (e) => {
      const el = e.target as HTMLSelectElement;
      let v: unknown = /^\d+$/.test(String(opt.default)) ? Number(el.value) : el.value;
      // Options that are off by default (false) but take strings too
      // (AmpPlugin's dropdown: false, true or 'grid').
      if (typeof opt.default === 'boolean' && (v === 'true' || v === 'false')) {
        v = v === 'true';
      }
      opt.modified = v !== opt.default;
      opt.value = v;

      const detail = { pkg: this, opt };
      this.app.dispatchEvent(new CustomEvent('options', { detail }));
    });
  }

  private numberListener(element: HTMLElement, opt: IOption) {
    element.addEventListener('input', (e) => {
      const target = e.target as HTMLElement;
      const el = target.nodeName === 'INPUT' ? target as HTMLInputElement : target.querySelector('input');
      opt.modified = typeof opt.default === 'string' ? el.value !== opt.default : Number(el.value) !== opt.default;
      opt.value = typeof opt.default === 'string' ? el.value : Number(el.value);

      const detail = { pkg: this, opt };
      this.app.dispatchEvent(new CustomEvent('options', { detail }));
    });
  }

  private booleanListener(element: HTMLElement, opt: IOption) {
    element.addEventListener('change', (e) => {
      const el = e.target as HTMLInputElement;
      opt.modified = el.checked !== opt.default;
      opt.value = el.checked;

      const detail = { pkg: this, opt };
      this.app.dispatchEvent(new CustomEvent('options', { detail }));
    });
  }

  private textListener(element: HTMLElement, opt: IOption) {
    element.addEventListener('input', (e) => {
      const el = e.target as HTMLInputElement;
      opt.modified = el.value !== opt.default;
      opt.value = el.value;

      const detail = { pkg: this, opt };
      this.app.dispatchEvent(new CustomEvent('options', { detail }));
    });
  }

  private dateListener(element: HTMLElement, opt: IOption) {
    element.addEventListener('change', (e) => {
      const el = e.target as HTMLInputElement;
      opt.modified = el.value !== opt.default;
      opt.value = el.valueAsDate;

      const detail = { pkg: this.name, key: this.optionKey };
      this.app.dispatchEvent(new CustomEvent('options', { detail }));
    });
  }

  private formatRequirements(array) {
    return JSON.stringify(array)
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .replace(/"([^"]+)":/g, '$1:');
  }
}