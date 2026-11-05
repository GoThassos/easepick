import { DateTime } from '@gothassos/easepick-datetime';
import { IBaseConfig } from '@gothassos/easepick-base-plugin';

export type MSelectDate = Date | string | number;

export interface IMSelectConfig extends IBaseConfig {
  dates?: MSelectDate[];
  max?: number;
  delimiter?: string;
  sort?: 'asc' | 'desc';
  inputFormat?: string;
  useWrapper?: boolean;
  locale?: {
    remove?: string;
    removeLabel?: string;
  };
  itemTemplate?: (date: DateTime) => HTMLElement;
}

declare module '@gothassos/easepick-core' {
  interface Core {
    getDates(): DateTime[];
    getDates(format: string): string[];
    setDates(dates: MSelectDate[], format?: string): void;
    addDates(dates: MSelectDate[], format?: string): void;
    addDate(date: MSelectDate, format?: string): void;
    removeDate(date: MSelectDate, format?: string): void;
  }
}

declare module '@gothassos/easepick-core/dist/types' {
  interface IPickerConfig {
    MSelectPlugin?: IMSelectConfig;
  }
}
