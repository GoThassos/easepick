import { IBaseConfig } from '@gothassos/easepick-base-plugin';

export interface IKbdPlugin extends IBaseConfig {
  unitIndex?: number;
  dayIndex?: number;
  html?: string;
}

declare module '@gothassos/easepick-core/dist/types' {
  interface IKbdPlugin {
    KbdPlugin?: IKbdPlugin;
  }
}
