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
    // Accessible names of the dropdowns and the (icon-only) reset button.
    month?: string;
    year?: string;
    resetButtonLabel?: string;
  }
}

declare module '@gothassos/easepick-core/dist/types' {
  interface IPickerConfig {
    AmpPlugin?: IAmpPlugin;
  }
}
