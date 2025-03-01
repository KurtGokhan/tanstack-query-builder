import { MutationBuilder } from '../src/builder/MutationBuilder';

describe('MutationBuilder', () => {
  type TData = { readonly sym: unique symbol };
  type TVar = { readonly sym: unique symbol };
  type TErr = { readonly sym: unique symbol };

  const mt = new MutationBuilder({ queryFn: async () => 0 }).withData<TData>().withVars<TVar>().withError<TErr>();

  describe('useQuery', () => {
    const query = mt.useMutation();

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

    it('var and data should have correct type', async () => {
      const mut = await query.mutateAsync({} as TVar);
      expectTypeOf(mut).toEqualTypeOf<TData>();
    });
  });
});
