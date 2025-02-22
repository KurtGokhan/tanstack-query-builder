import { Prettify } from '../src/types/utils';

describe('playground', () => {
  it('unknown & type', () => {
    type T = { readonly sym: unique symbol };
    type TTest = T & unknown;

    expectTypeOf<TTest>().toEqualTypeOf<T>();
    expectTypeOf<Prettify<TTest>>().toEqualTypeOf<T>();
    expectTypeOf<number & unknown>().toEqualTypeOf<number>();
    expectTypeOf<number & unknown>().toMatchTypeOf<number>();
    expectTypeOf<number & unknown>().toEqualTypeOf<number & unknown>();
  });

  it('Record<string,unknown> & type', () => {
    type TRec = Record<string, unknown>;

    type T = { a: 5 };
    type TTest = T & TRec;

    expectTypeOf<TTest>().toMatchTypeOf<T>();
    expectTypeOf<Prettify<TTest>>().toEqualTypeOf<{
      [key: string]: unknown;
      a: 5;
    }>();
  });

  it('Record<never,never> & type', () => {
    type TRec = Record<never, never>;

    type T = { a: 5 };
    type TTest = T & TRec;

    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    expectTypeOf<TRec>().toEqualTypeOf<{}>();

    expectTypeOf<5>().toMatchTypeOf<TRec>();

    expectTypeOf<TTest>().toMatchTypeOf<T>();
    expectTypeOf<Prettify<TTest>>().toEqualTypeOf<{ a: 5 }>();
  });
});
