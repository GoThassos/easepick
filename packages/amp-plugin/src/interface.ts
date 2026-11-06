import { IBaseConfig } from '@gothassos/easepick-base-plugin';

export interface IAmpPlugin extends IBaseConfig {
  dropdown?: {
    minYear?: number;
    maxYear?: number;
    // 'grid': a button that shows the months (or years) in place of the days.
    months?: boolean | 'grid';
    // 'asc': the years dropdown in ascending order. 'grid': as for months.
    // (Kept as `string` so existing typed configs still compile.)
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
