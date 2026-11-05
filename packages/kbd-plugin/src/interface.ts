import { IBaseConfig } from '@gothassos/easepick-base-plugin';

export interface IKbdPlugin extends IBaseConfig {
  unitIndex?: number;
  dayIndex?: number;
  html?: string;
  locale?: {
    // Accessible name of the (icon-only) button that opens the picker.
    openButton?: string;
  };
}

declare module '@gothassos/easepick-core/dist/types' {
  interface IPickerConfig {
    KbdPlugin?: IKbdPlugin;
  }
}
