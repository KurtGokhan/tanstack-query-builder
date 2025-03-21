import { HttpQueryBuilder } from '../src/http';

describe('QueryBuilder asBound', () => {
  // TODO: After a lot of trial and error, I couldn't get the following tests to work.
  // We can't enforce bound methods in the type level easily.
  // Keeping the tests here for future reference and with the hope that we can in the future, maybe with HKTs.

  // test('shouldnt allow calling builder methods', () => {
  //   const { withVars } = new HttpQueryBuilder();

  //   expectTypeOf(withVars).thisParameter.not.toBeNullable();

  //   // @ts-expect-error
  //   withVars(); // Shouldn't be allowed
  // });

  // test('shouldnt allow calling non-bound methods', () => {
  //   const { useMutation } = new HttpQueryBuilder();

  //   expectTypeOf(useMutation).thisParameter.not.toBeNullable();

  //   // @ts-expect-error
  //   useMutation(); // Shouldn't be allowed
  // });

  test('shouldnt allow calling methods after binding', () => {
    const { useMutation } = new HttpQueryBuilder().asBound();

    expectTypeOf(useMutation).thisParameter.toBeNullable();

    useMutation(); // Should be allowed
  });
});
