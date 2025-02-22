import { Deferred } from './deferred';

export type RequestConcurrencyOptions = {
  key?: string;
  limit?: number;
};

const waitingRequests = new Map<string, (() => void)[]>();
const runningRequests = new Map<string, number>();

/**
 * This function is used to limit the number of concurrent requests.
 * It returns a promise that resolves when the request can be made.
 * After the request is made, the returned object must be disposed to release the concurrency lock.
 */
export function requestConcurrency(opts: RequestConcurrencyOptions = {}) {
  const { limit = 0, key = '' } = opts;

  const ready = new Deferred<boolean>();

  let unlockFn: () => void = () => {
    throw new Error('Unlock called before ready');
  };
  const dispose = () => unlockFn();

  function startRunningRequest() {
    runningRequests.set(key, (runningRequests.get(key) || 0) + 1);

    unlockFn = () => {
      runningRequests.set(key, (runningRequests.get(key) || 0) - 1);

      const callbacks = waitingRequests.get(key) || [];
      for (const cb of callbacks) cb();
    };
  }

  function check() {
    if (limit && (runningRequests.get(key) || 0) >= limit) return false;

    const waiting = waitingRequests.get(key);
    waitingRequests.set(key, waiting?.filter((cb) => cb !== check) || []);
    startRunningRequest();
    ready.resolve(true);
    return true;
  }

  const callbacks = waitingRequests.get(key) || [];
  waitingRequests.set(key, [...callbacks, check]);

  check();

  return { ready, dispose };
}
