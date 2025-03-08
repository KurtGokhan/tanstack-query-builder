import { QueryBuilder } from '../src/builder/QueryBuilder';

describe('QueryBuilder', () => {
  type TData = { readonly sym: unique symbol };
  type TVar = { readonly sym: unique symbol };
  type TErr = { readonly sym: unique symbol };

  const qb = new QueryBuilder({ queryFn: () => 0 }).withData<TData>().withVars<TVar>().withError<TErr>();

  describe('useQuery', () => {
    const query = qb.useQuery({} as TVar);

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

  describe('withClient', () => {
    it('shouldnt allow to use client without client', () => {
      expectTypeOf(qb.client).toBeNever();
    });

    it('should allow using client when withClient is called', () => {
      const nqb = qb.withClient(null!);
      expectTypeOf(nqb.client).not.toBeNever();
    });
  });

  describe('withPagination', () => {
    it('shouldnt allow to use pagination without pagination', () => {
      expectTypeOf(qb.useInfiniteQuery).toBeNever();
    });

    it('should allow using pagination when withPagination is called', () => {
      const nqb = qb.withPagination(null!);
      expectTypeOf(nqb.useInfiniteQuery).toBeFunction();
    });
  });
});
