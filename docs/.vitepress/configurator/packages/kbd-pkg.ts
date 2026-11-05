import { BasePkg } from './base-pkg';
import { IPackage } from '../interface';

export class KbdPkg extends BasePkg implements IPackage {
  public name = '@gothassos/easepick-kbd-plugin';
  public description = 'Adds keyboard navigation.';
  public url = '/easepick/packages/kbd-plugin';
  public optionKey = 'KbdPlugin';
  public setup = {
    npm: [
      'npm install @gothassos/easepick-core',
      'npm install @gothassos/easepick-kbd-plugin',
    ],
    cdn: [
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-datetime@__VERSION__/dist/index.umd.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@__VERSION__/dist/index.umd.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-base-plugin@__VERSION__/dist/index.umd.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-kbd-plugin@__VERSION__/dist/index.umd.js',
    ],
  }

  public fillOptions() {
    this.options = [
      {
        configurable: true,
        children: [
          {
            name: 'unitIndex',
            default: 1,
            type: 'number',
            configurable: true,
          },
          {
            name: 'dayIndex',
            default: 2,
            type: 'number',
            configurable: true,
          },
          {
            name: 'html',
            configurable: false,
          },
        ],
      }
    ];
  }
}