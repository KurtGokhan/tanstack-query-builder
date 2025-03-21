import { HttpQueryBuilder } from '../src/http';

describe('QueryBuilder asBound', () => {
  test('shouldnt allow calling builder methods', () => {
    const { withVars } = new HttpQueryBuilder();

    expectTypeOf(withVars).thisParameter.not.toBeNullable();

    // @ts-expect-error
    withVars(); // Shouldn't be allowed
  });

  test('shouldnt allow calling non-bound methods', () => {
    const { useMutation } = new HttpQueryBuilder();

    expectTypeOf(useMutation).thisParameter.not.toBeNullable();

    // @ts-expect-error
    useMutation(); // Shouldn't be allowed
  });

  test('shouldnt allow calling methods after binding', () => {
    const { useMutation } = new HttpQueryBuilder().asBound();

    expectTypeOf(useMutation).thisParameter.toBeNullable();

    useMutation(); // Should be allowed
  });
});
