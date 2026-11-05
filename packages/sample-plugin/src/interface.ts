import { IBaseConfig } from '@gothassos/easepick-base-plugin';

export interface ISamplePlugin extends IBaseConfig {
  fgColor?: string;
  bgColor?: string;
}

declare module '@gothassos/easepick-core/dist/types' {
  interface IPickerConfig {
    SamplePlugin?: ISamplePlugin;
  }
}
