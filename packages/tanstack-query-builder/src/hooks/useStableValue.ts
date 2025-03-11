import { useMemo, useRef } from 'react';

/**
 * Returns a stable ref that always has the latest value of the passed value.
 * The value will be updated immediately in the render phase.
 */
export function useStableValue<T>(value: T) {
  const ref = useRef(value);
  useMemo(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
