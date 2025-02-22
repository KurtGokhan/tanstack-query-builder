import { useCallback } from 'react';
import type { FunctionType } from '../types/utils';
import { useStableValue } from './useStableValue';

/**
 * Returns a stable ref to a function
 */
export function useStableCallback<T extends FunctionType | null | undefined>(value: T): NonNullable<T> {
  const handlerRef = useStableValue(value);
  const res = useCallback(function (this: any, ...args: unknown[]) {
    return handlerRef.current?.apply(this, args);
  }, []);
  return res as NonNullable<T>;
}
