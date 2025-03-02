export type PreprocessorFn<TVars, TOriginalVars> = (vars: TVars) => TOriginalVars;

export const identityPreprocessor = <TVars = unknown, TOut = TVars>(vars: TVars): TOut => vars as unknown as TOut;

export const createPreprocessorFunction = <TVars, TOriginalVars>(
  preprocessor: PreprocessorFn<TVars, TOriginalVars>,
  originalFn: PreprocessorFn<TOriginalVars, any> = identityPreprocessor,
): PreprocessorFn<TVars, any> => {
  return (context) => originalFn(preprocessor(context));
};
