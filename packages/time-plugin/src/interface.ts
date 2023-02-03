import { DateTime } from '@gothassos/easepick-datetime';
import { IBaseConfig } from '@gothassos/easepick-base-plugin';

export interface ITimeConfig extends IBaseConfig {
  native?: boolean;
  seconds?: boolean;
  stepHours?: number;
  stepMinutes?: number;
  stepSeconds?: number;
  format12?: boolean;
}

declare module '@gothassos/easepick-core' {
  interface Core {
    getDate(): DateTime;
    getStartDate(): DateTime;
    getEndDate(): DateTime;
    setTime(value: string): void;
    setStartTime(value: string): void;
    setEndTime(value: string): void;
  }
}

declare module '@gothassos/easepick-core/dist/types' {
  interface IPickerConfig {
    TimePlugin?: ITimeConfig;
  }
}
