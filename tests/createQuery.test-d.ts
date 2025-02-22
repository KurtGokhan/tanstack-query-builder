import { createQuery } from '../src/create/createQuery';

describe('createQuery', () => {
  type TData = { readonly sym: unique symbol };
  type TVar = { readonly sym: unique symbol };
  type TErr = { readonly sym: unique symbol };

  const testCreated = createQuery<{
    data: TData;
    vars: TVar;
    error: TErr;
  }>({
    queryFn: () => null! as TData,
  });

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
