import { BasePkg } from './packages/base-pkg';
import { ISetup } from './interface';

/** Version of the upstream @easepick/configurator source this was ported from. */
export const CONFIGURATOR_VERSION = '1.0.8';

export class PackageManager {
  public app: HTMLElement;
  public packages: BasePkg[] = [];
  public bundle: ISetup = {
    npm: [
      'npm install @gothassos/easepick-bundle',
    ],
    cdn: [
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@__VERSION__/dist/index.umd.js',
    ],
  }

  constructor() {
    this.app = document.getElementById('app-configurator');
  }

  public add(pkg: BasePkg) {
    this.packages.push(pkg);
  }

  public get(optionKey: string) {
    const idx = this.packages.findIndex(x => x.optionKey === optionKey);
    return this.packages[idx];
  }

  public renderHTML() {
    this.packages.forEach(pkg => {
      pkg.createTab();
      pkg.createTabContent();
    });
  }

  /**
   * Build a code block styled like VitePress's own. The original read Prism-highlighted
   * samples hidden in the page and string-replaced placeholders inside them; VitePress
   * highlights with Shiki, so the snippets are built as plain text instead.
   */
  public createCodeHighlight(text: string, lang = 'html') {
    const language = document.createElement('div');
    language.className = `language-${lang}`;

    const label = document.createElement('span');
    label.className = 'lang';
    label.textContent = lang;

    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = text;
    pre.appendChild(code);

    language.append(label, pre);

    return language;
  }

  public npm2text(array: string[]) {
    return array.join("\n");
  }

  public cdn2text(array: string[], version: string) {
    return array.map(x => `<script src="${x}"></script>`)
      .join("\n")
      .replace(/__VERSION__/g, version);
  }

  public npm() {
    let list = [];

    for (let pkg of this.packages) {
      if (!pkg.setup || !pkg.included) continue;

      list.push(...pkg.setup.npm);
    }

    return [...new Set(list)];
  }

  public cdn() {
    let list = [];

    for (let pkg of this.packages) {
      if (!pkg.setup || !pkg.included) continue;

      list.push(...pkg.setup.cdn);
    }

    return [...new Set(list)];
  }

  public quickExample(version, config) {
    if (typeof config.element !== 'string') {
      config.element = '#datepicker';
    }

    // The live picker gets the stylesheet inline; the example links it from the CDN.
    config.css = [`https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@${version}/dist/index.css`];

    Object.keys(config).forEach(k => {
      if (/Plugin$/.test(k) && Object.keys(config[k]).length === 0) {
        delete config[k];
      }
    });

    let inputs = '<input id="datepicker"/>';

    if ('RangePlugin' in config && 'elementEnd' in config['RangePlugin']) {
      config['element'] = '#checkin';
      config['RangePlugin']['elementEnd'] = '#checkout';
      inputs = '<input id="checkin"/>\n    <input id="checkout"/>';
    }

    const config_json = JSON.stringify(config, null, 2)
      .replace(/"([^"]+)":/g, '$1:');

    const code = document.getElementById('quick-example-code');
    code.textContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>easepick ${version} | configurator ${CONFIGURATOR_VERSION}</title>
    <script src="https://cdn.jsdelivr.net/npm/@gothassos/easepick-bundle@${version}/dist/index.umd.js"></script>
  </head>
  <body>
    ${inputs}
    <script>
      const picker = new easepick.create(${config_json.replace(/\n/g, '\n      ')});
    </script>
  </body>
</html>`;
  }

  public setupInfo(version: string, config) {
    const bundleNpm = document.getElementById('bundle-npm');
    bundleNpm.innerHTML = '';
    const bundleNpmCode = this.createCodeHighlight(this.npm2text(this.bundle.npm), 'bash');
    bundleNpm.appendChild(bundleNpmCode);

    const bundleCdn = document.getElementById('bundle-cdn');
    bundleCdn.innerHTML = '';
    const bundleCdnCode = this.createCodeHighlight(this.cdn2text(this.bundle.cdn, version));
    bundleCdn.appendChild(bundleCdnCode);

    const modularNpm = document.getElementById('modular-npm');
    modularNpm.innerHTML = '';
    const modularNpmCode = this.createCodeHighlight(this.npm2text(this.npm()), 'bash');
    modularNpm.appendChild(modularNpmCode);

    const modularCdn = document.getElementById('modular-cdn');
    modularCdn.innerHTML = '';
    const modularCdnCode = this.createCodeHighlight(this.cdn2text(this.cdn(), version));
    modularCdn.appendChild(modularCdnCode);

    this.quickExample(version, config);
  }

  public checkRequirements(config) {
    for (const pkg of this.packages) {
      if (!pkg.included) continue;

      for (const group of pkg.options) {
        if (!group.configurable) continue;

        for (const opt of group.children) {
          if (!opt.configurable) continue;
          if (!opt.requirements) continue;

          let reqValid = true;

          if (opt.requirements.depends instanceof Array) {
            for (const req of opt.requirements.depends) {
              reqValid = reqValid && this.objIncludes(config, req);
            }
          }

          if (opt.requirements.conflict instanceof Array) {
            for (const req of opt.requirements.conflict) {
              if (typeof req === 'function') {
                reqValid = reqValid && req(config);
              } else {
                reqValid = reqValid && !this.objIncludes(config, req);
              }
            }
          }

          opt.element.classList.toggle('unavailable', !reqValid);
        }
      }
    }
  }

  private objIncludes(obj, searchObj): boolean {
    for (const key of Object.keys(searchObj)) {
      if (searchObj[key] !== null
        && typeof searchObj[key] === 'object'
        && Object.keys(searchObj[key]).length > 0) {
        return key in obj && this.objIncludes(obj[key], searchObj[key]);
      }

      if (searchObj[key] !== null
        && typeof searchObj[key] === 'object'
        && Object.keys(searchObj[key]).length === 0) {
        return key in obj;
      }

      return key in obj && obj[key] === searchObj[key];
    }
  }
}