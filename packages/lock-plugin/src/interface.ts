import { DateTime } from '@gothassos/easepick-datetime';
import { IBaseConfig } from '@gothassos/easepick-base-plugin';

export interface ILockConfig extends IBaseConfig {

  minDate?: Date | string | number;
  maxDate?: Date | string | number;
  minDays?: number;
  maxDays?: number;
  selectForward?: boolean;
  selectBackward?: boolean;
  presets?: boolean;
  inseparable?: boolean;
  filter?: (date: DateTime | DateTime[], picked: DateTime[]) => boolean;
}

declare module '@gothassos/easepick-core/dist/types' {
  interface IPickerConfig {
    LockPlugin?: ILockConfig;
  }
}
