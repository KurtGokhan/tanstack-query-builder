import { QueryBuilder } from '../src/builder/QueryBuilder';

describe('QueryBuilder', () => {
  type TData = { readonly sym: unique symbol };
  type TVar = { readonly sym: unique symbol };
  type TErr = { readonly sym: unique symbol };

  const testCreated = new QueryBuilder({ queryFn: () => null! as TData })
    .withData<TData>()
    .withVars<TVar>()
    .withError<TErr>();

  describe('useQuery', () => {
    const query = testCreated.useQuery({} as TVar);

    it('data should have correct type', () => {
      expectTypeOf(query.data).toEqualTypeOf<TData | undefined>();
      if (query.isSuccess) expectTypeOf(query.data).toEqualTypeOf<TData>();
      if (query.isPending) expectTypeOf(query.data).toEqualTypeOf<undefined>();
    });

    it('error should have correct type', () => {
      expectTypeOf(query.error).toEqualTypeOf<TErr | null>();
      if (query.isSuccess) expectTypeOf(query.error).toEqualTypeOf<null>();
      if (query.isError) expectTypeOf(query.error).toEqualTypeOf<TErr>();
    });
  });
});
