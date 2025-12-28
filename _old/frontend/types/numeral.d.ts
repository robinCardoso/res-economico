declare module 'numeral' {
  interface Numeral {
    format(pattern?: string): string;
    value(): number | null;
    set(value: number | string): Numeral;
    add(value: number | string): Numeral;
    subtract(value: number | string): Numeral;
    multiply(value: number | string): Numeral;
    divide(value: number | string): Numeral;
    difference(value: number | string): number;
  }

  interface NumeralConstructor {
    (value?: number | string | null): Numeral;
    defaultFormat(format: string): void;
    reset(): void;
    options: {
      currentLocale: string;
      zeroFormat: string | null;
      nullFormat: string | null;
      defaultFormat: string;
      scalePercentBy100: boolean;
    };
    locale(key?: string, locale?: object): string | object;
    register(type: string, name: string, format: object): void;
    validate(value: string, culture: string): boolean;
  }

  const numeral: NumeralConstructor;
  export = numeral;
}

