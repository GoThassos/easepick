export interface ISetup {
  npm: string[];
  cdn: string[];
}

export interface IOptionGroup {
  name?: string;
  description?: string;
  configurable: boolean;
  children: IOption[];
}

export interface IOption {
  name: string;
  info?: string;
  element?: HTMLElement;
  default?: unknown;
  value?: unknown;
  values?: any[];
  min?: number;
  max?: number;
  type?: string;
  configurable: boolean;
  modified?: boolean;
  requirements?: {
    depends?: unknown;
    conflict?: unknown;
  };
}

export interface IPackage {
  fillOptions?(): void;
}
