import { HttpQueryBuilder } from '../src/builder/HttpQueryBuilder';
import { HttpBuilderBaseVars } from '../src/builder/types';
import { PathParam } from '../src/http/types';
import { Prettify } from '../src/types/utils';

describe('HttpQueryBuilder', () => {
  it('should have correct types when types are explicitly passed', () => {
    const htp = new HttpQueryBuilder({})
      .withData<{ name: string }>()
      .withBody<{ name: string }>()
      .withHeaders<{ 'x-token': string }>()
      .withParams<{ id: number }>()
      .withSearch<{ q: string }>();

    expectTypeOf<Parameters<typeof htp.useQuery>[0]>().toEqualTypeOf<
      Prettify<
        HttpBuilderBaseVars & {
          body: { name: string };
          headers: { 'x-token': string };
          params: { id: number };
          search: { q: string };
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
