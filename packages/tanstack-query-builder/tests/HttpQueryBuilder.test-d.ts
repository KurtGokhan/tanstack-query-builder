import { HttpQueryBuilder } from '../src/http/HttpQueryBuilder';
import { HttpBuilderBaseVars } from '../src/http/builder-types';
import { PathParam } from '../src/http/request-types';
import { Prettify } from '../src/type-utils';

describe('HttpQueryBuilder', () => {
  it('should have correct types when types are explicitly passed', () => {
    const htp = new HttpQueryBuilder({})
      .withData<{ name: string }>()
      .withBody<{ name: string }>()
      .withHeaders<{ 'x-token': string }>()
      .withParams<{ id: number }>()
      .withSearch<{ q: string }>()
      .withMeta<{ mt: string }>();

    type TVars = Parameters<typeof htp.useQuery>[0];
    expectTypeOf<TVars['params']>().toEqualTypeOf<{ id: number }>();
    expectTypeOf<TVars['search']>().toEqualTypeOf<{ q: string }>();
    expectTypeOf<TVars['body']>().toEqualTypeOf<{ name: string }>();
    expectTypeOf<TVars['headers']>().toEqualTypeOf<{ 'x-token': string }>();

    expectTypeOf<TVars>().toEqualTypeOf<
      Prettify<
        HttpBuilderBaseVars & {
          body: { name: string };
          headers: { 'x-token': string };
          params: { id: number };
          search: { q: string };
          meta: { mt: string };
        }
      >
    >();

    expectTypeOf<ReturnType<typeof htp.useQuery>['data']>().toEqualTypeOf<{ name: string } | undefined>();
  });

  it('should have correct path params with url', () => {
    const htp = new HttpQueryBuilder().withPath('/test/:id/:name/age/:age');

    expectTypeOf<Parameters<typeof htp.useQuery>[0]['params']>().toEqualTypeOf<{
      id: PathParam;
      name: PathParam;
      age: PathParam;
    }>();
  });
});
