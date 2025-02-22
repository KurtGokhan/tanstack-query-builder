export type StringLiteral = string & {};

/** See: https://www.totaltypescript.com/concepts/the-prettify-helper */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type EnumValues<T extends string> = `${T}`;

export type ValueOf<T extends Record<any, any>> = T[keyof T];

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type DeepPartial<T> = T extends FunctionType
  ? T
  : T extends object
    ? {
        [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

// /**
//  * Creates a union of all possible concatenations of the given union `U` with the separator `Sep`.
//  * For example, `UnionConcat<['a', 'b', 'c'], '.'>` will result in `'a' | 'b' | 'c' | 'a.b' | 'a.c' | 'b.c' | 'a.b.c'
//  */
export type TupleConcat<U extends string[], Sep extends string = ','> = U extends [infer Head, ...infer Tail]
  ? Head extends string
    ? Tail extends []
      ? Head
      : Tail extends string[]
        ? Head | TupleConcat<Tail, Sep> | `${Head}${Sep}${TupleConcat<Tail, Sep>}`
        : ''
    : ''
  : '';

export type FunctionType = (...args: any[]) => any;
export type Func<TArgs extends any[] = [], TRet = void> = (...val: TArgs) => TRet;
export type Action<TArgs extends any[] = []> = Func<TArgs, void>;
export type Predicate<TArgs extends any[] = []> = Func<TArgs, boolean>;
export type EqualityFn<T = unknown> = Predicate<[T, T]>;
