import { HttpQueryVars, createHttpQuery } from '../src/http/createHttpQuery';
import { PathParam } from '../src/http/types';
import { Prettify } from '../src/types/utils';

describe('createHttpQuery', () => {
  it('should have correct types when types are explicitly passed', () => {
    const htp = createHttpQuery<{
      body: { name: string };
      headers: { 'x-token': string };
      params: { id: number };
      search: { q: string };
    }>();

    expectTypeOf<Parameters<typeof htp.useQuery>[0]>().toEqualTypeOf<
      Prettify<
        HttpQueryVars & {
          body: { name: string };
          headers: { 'x-token': string };
          params: { id: number };
          search: { q: string };
        }
      >
    >();
  });

  it('should have correct path params with url', () => {
    const htp = createHttpQuery().withUrl('/test/:id/:name/age/:age');

    expectTypeOf<Parameters<typeof htp.useQuery>[0]['params']>().toEqualTypeOf<{
      id?: PathParam;
      name?: PathParam;
      age?: PathParam;
    }>();
  });
});
