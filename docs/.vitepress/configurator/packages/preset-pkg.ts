import { BasePkg } from './base-pkg';
import { IPackage } from '../interface';

export class PresetPkg extends BasePkg implements IPackage {
  public name = '@gothassos/easepick-preset-plugin';
  public description = 'Adds predefined ranges.';
  public url = '/easepick/packages/preset-plugin';
  public optionKey = 'PresetPlugin';
  public dependencies = ['RangePlugin'];
  public setup = {
    npm: [
      'npm install @gothassos/easepick-core',
      'npm install @gothassos/easepick-range-plugin',
      'npm install @gothassos/easepick-preset-plugin',
    ],
    cdn: [
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-datetime@__VERSION__/dist/index.umd.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@__VERSION__/dist/index.umd.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-base-plugin@__VERSION__/dist/index.umd.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-range-plugin@__VERSION__/dist/index.umd.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-preset-plugin@__VERSION__/dist/index.umd.js',
    ],
  }

  public fillOptions() {
    this.options = [
      {
        configurable: true,
        children: [
          {
            name: 'customPreset',
            configurable: false,
          },
          {
            name: 'customLabels',
            configurable: false,
          },
          {
            name: 'position',
            default: 'left',
            type: 'dropdown',
            values: [
              'left',
              'top',
              'right',
              'bottom',
            ],
            configurable: true,
          },
        ],
      }
    ];
  }
}