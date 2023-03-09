import { IBaseConfig } from '@gothassos/easepick-base-plugin';

export interface IAmpPlugin extends IBaseConfig {
  dropdown?: {
    minYear?: number;
    maxYear?: number;
    months?: boolean;
    years?: boolean | string;
  }
  resetButton?: (() => boolean) | boolean;
  darkMode?: boolean;
  weekNumbers?: boolean;
  locale?: {
    resetButton?: string;
    week?: string;
  }
}

declare module '@gothassos/easepick-core/dist/types' {
  interface IPickerConfig {
    AmpPlugin?: IAmpPlugin;
  }
}
