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
  [K in keyof T]?: T[K] extends TCondition ? K : never;
}[keyof T];

type IsRequired<T, TFalsy = never, TTruthy = T> = T extends undefined
  ? TFalsy
  : unknown extends T
    ? TFalsy
    : T extends null
      ? TFalsy
      : TTruthy;

type RequiredKeys<T extends Record<string, any>> = {
  [K in keyof T]: IsRequired<T[K], never, K>;
}[keyof T];

export type MakeRequiredIfNecessary<T extends Record<string, any>> = WithRequired<T, RequiredKeys<T>>;
