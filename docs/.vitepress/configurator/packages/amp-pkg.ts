import { BasePkg } from './base-pkg';
import { IPackage } from '../interface';

export class AmpPkg extends BasePkg implements IPackage {
  public name = '@gothassos/easepick-amp-plugin';
  public description = 'Adds extra options.';
  public url = '/easepick/packages/amp-plugin';
  public optionKey = 'AmpPlugin';
  public setup = {
    npm: [
      'npm install @gothassos/easepick-core',
      'npm install @gothassos/easepick-amp-plugin',
    ],
    cdn: [
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-datetime@__VERSION__/dist/index.umd.min.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-core@__VERSION__/dist/index.umd.min.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-base-plugin@__VERSION__/dist/index.umd.min.js',
      'https://cdn.jsdelivr.net/npm/@gothassos/easepick-amp-plugin@__VERSION__/dist/index.umd.min.js',
    ],
  }

  public fillOptions() {
    this.options = [
      {
        name: 'dropdown',
        configurable: true,
        children: [
          {
            name: 'months',
            default: false,
            type: 'boolean',
            configurable: true,
            requirements: {
              conflict: [{ viewMode: 'month' }, { viewMode: 'year' }],
            },
          },
          {
            name: 'years',
            default: false,
            type: 'boolean',
            configurable: true,
            requirements: {
              conflict: [{ viewMode: 'month' }, { viewMode: 'year' }],
            },
          },
          {
            name: 'minYear',
            default: 1950,
            type: 'number',
            configurable: true,
            requirements: {
              depends: [
                { AmpPlugin: { dropdown: { years: true } } },
              ],
            },
          },
          {
            name: 'maxYear',
            default: (new Date()).getFullYear(),
            type: 'number',
            configurable: true,
            requirements: {
              depends: [
                { AmpPlugin: { dropdown: { years: true } } },
              ],
            },
          },
        ]
      },
      {
        name: 'locale',
        configurable: true,
        children: [
          {
            name: 'resetButton',
            default: '<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>',
            type: 'text',
            configurable: true,
            requirements: {
              depends: [
                { AmpPlugin: { resetButton: true } }
              ],
            }
          },
          {
            name: 'week',
            default: 'Wk',
            type: 'text',
            configurable: true,
            requirements: {
              depends: [
                { AmpPlugin: { weekNumbers: true } }
              ],
            }
          },
        ],
      },
      {
        configurable: true,
        children: [
          {
            name: 'resetButton',
            default: false,
            type: 'boolean',
            configurable: true,
          },
          {
            name: 'darkMode',
            default: true,
            type: 'boolean',
            configurable: true,
          },
          {
            name: 'weekNumbers',
            default: false,
            type: 'boolean',
            configurable: true,
            requirements: {
              conflict: [{ viewMode: 'month' }, { viewMode: 'year' }],
            },
          },
        ],
      }
    ];
  }
}