import { Prettify } from '../types/utils';

export type PathParam = string | number | null | undefined;

export type ExtractPathParams<TPath> = Prettify<ExtractPathParamsInternal<TPath>>;

type ExtractPathParamsInternal<TPath> = TPath extends string
  ? string extends TPath
    ? unknown
    : TPath extends `${'http' | 'https'}://${infer TRest}`
      ? ExtractPathParamsInternal<TRest>
      : TPath extends `${string}:${infer TParam}/${infer TRest}`
        ? { [key in TParam]?: PathParam } & ExtractPathParamsInternal<TRest>
        : TPath extends `${string}:${infer TParam}`
          ? { [key in TParam]?: PathParam }
          : unknown
  : unknown;
