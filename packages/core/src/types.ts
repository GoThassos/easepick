import { DateTime } from '@gothassos/easepick-datetime';
import { Core } from './core';

export interface IEventDetail {
  view?: string;
  date?: DateTime;
  target?: HTMLElement;
  index?: number;
}

/**
 * Minimal shape of a plugin instance, as used by the core.
 * (The full interface lives in base-plugin, which depends on core.)
 */
export interface IPluginInstance {
  priority: number;
  dependencies: string[];
  getName(): string;
  // `unknown`, not `Core`: a plugin is typed against the Core it was built
  // with (e.g. core's dist/ types), which TypeScript treats as another type.
  attach(picker: unknown): void;
}

export type PluginConstructor = new () => IPluginInstance;

export interface IPickerElements {
  container: HTMLElement;
  shadowRoot: ShadowRoot;
  wrapper: HTMLElement;
}

export interface IPickerConfig {
  element: HTMLElement | string;
  doc?: Document | ShadowRoot;
  css?: string | string[] | ((picker: Core) => void);
  firstDay?: number;
  lang?: string;
  date?: Date | string | number;
  format?: string;
  grid?: number;
  calendars?: number;
  readonly?: boolean;
  autoApply?: boolean;
  header?: boolean | string | HTMLElement;
  locale?: {
    previousMonth?: string;
    nextMonth?: string;
    cancel?: string;
    apply?: string;
    // Accessible names of the previous/next buttons, by viewMode.
    previousMonthLabel?: string;
    nextMonthLabel?: string;
    previousYearLabel?: string;
    nextYearLabel?: string;
    previousDecadeLabel?: string;
    nextDecadeLabel?: string;
  }
  plugins?: (PluginConstructor | string)[];
  documentClick?: boolean | (() => void);
  zIndex?: number;
  inline?: boolean;
  scrollToDate?: boolean;
  viewMode?: 'day' | 'month' | 'year';
  showOffsetDays?: boolean;
  setup?(picker: Core): void;
}
