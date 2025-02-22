export type StringLiteral = string & {};

/** See: https://www.totaltypescript.com/concepts/the-prettify-helper */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type FunctionType = (...args: any[]) => any;
