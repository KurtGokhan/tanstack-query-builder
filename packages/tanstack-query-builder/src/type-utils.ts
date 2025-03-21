/** @deprecated */
export type TODO = any;

export type StringLiteral = string & {};

export type StringOr<T extends string> = StringLiteral | T;

/** See: https://www.totaltypescript.com/concepts/the-prettify-helper */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type WithOptional<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] };

export type WithRequired<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: T[P] };

export type FunctionType = (...args: any[]) => any;

/** Extracts the keys of a type that have a value of a specific type. */
export type KeysOfValue<T, TCondition> = {
  [K in keyof T]: T[K] extends TCondition ? K : never;
}[keyof T];

export type HasFlag<T extends string, TFlag extends string, TTrue = true, TFalse = never> = T extends TFlag ? TTrue : TFalse;

export type WhenRequired<T, TReq> = T extends undefined
  ? Partial<TReq>
  : unknown extends T
    ? Partial<TReq>
    : T extends null
      ? Partial<TReq>
      : Partial<T> extends T
        ? Partial<TReq>
        : TReq;
