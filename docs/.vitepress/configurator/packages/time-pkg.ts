import { BasePkg } from './base-pkg';
import { IPackage } from '../interface';

export class TimePkg extends BasePkg implements IPackage {
  public name = '@gothassos/easepick-time-plugin';
  public description = 'Adds time picker.';
  public url = '/easepick/packages/time-plugin';
  public optionKey = 'TimePlugin';
  public setup = {
    npm: [
      'npm install @gothassos/easepick-core',
      'npm install @gothassos/easepick-time-plugin',
    ],
    cdn: [
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-datetime@__VERSION__/dist/index.umd.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@__VERSION__/dist/index.umd.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-base-plugin@__VERSION__/dist/index.umd.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-time-plugin@__VERSION__/dist/index.umd.js',
    ],
  }

  public fillOptions() {
    this.options = [
      {
        configurable: true,
        children: [
          {
            name: 'native',
            info: 'Use the browser\'s time input instead of dropdowns',
            default: false,
            type: 'boolean',
            configurable: true,
          },
          {
            name: 'seconds',
            default: false,
            type: 'boolean',
            configurable: true,
          },
          {
            name: 'stepHours',
            default: 1,
            type: 'range',
            min: 1,
            max: 12,
            configurable: true,
          },
          {
            name: 'stepMinutes',
            default: 5,
            type: 'range',
            min: 1,
            max: 60,
            configurable: true,
          },
          {
            name: 'stepSeconds',
            default: 5,
            type: 'range',
            min: 1,
            max: 60,
            configurable: true,
          },
          {
            name: 'format12',
            default: false,
            type: 'boolean',
            configurable: true,
          },
        ],
      }
    ];
  }
}