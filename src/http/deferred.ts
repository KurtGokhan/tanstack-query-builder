export type DeferredExecutor<T> = (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void) => void;

/**
 * A Promise that can be resolved or rejected by external code.
 * It also exposes the status of the promise, and resolved value or the rejection error.
 */
export class Deferred<T = unknown> extends Promise<T> {
  status: 'pending' | 'resolved' | 'rejected' = 'pending';

  /**
   * A method to resolve the associated Promise with the value passed.
   * If the promise is already settled it does nothing.
   *
   * @param {anything} value : This value is used to resolve the promise
   * If the value is a Promise then the associated promise assumes the state
   * of Promise passed as value.
   */
  resolve: (value: T | PromiseLike<T>) => void;

  /**
   * A method to reject the assocaited Promise with the value passed.
   * If the promise is already settled it does nothing.
   *
   * @param {anything} reason: The reason for the rejection of the Promise.
   * Generally its an Error object. If however a Promise is passed, then the Promise
   * itself will be the reason for rejection no matter the state of the Promise.
   */
  reject: (reason?: unknown) => void;

  /**
   * Required when extending Promise class
   */
  static get [Symbol.species]() {
    return Promise;
  }

  /**
   * The value with which the promise was resolved
   */
  value?: T;

  /**
   * The error with which the promise was rejected
   */
  error?: unknown;

  /**
   * Creates a promise that is resolved after {amount} milliseconds
   */
  static timeout<T = void>(amount?: number, executor?: DeferredExecutor<T | void>) {
    const df = new Deferred(executor);
    if (Number.isFinite(amount)) setTimeout(() => df.resolve(), amount);
    return df;
  }

  /**
   * Creates a promise that periodically checks if a condition returns true and then returns true.
   * If the condition does not return true within the given timeout duration, returns false.
   */
  static async polling(checkCondition: (passedTime: number) => boolean, interval: number, timeout?: number) {
    const df = new Deferred<boolean>();

    const initTime = Date.now();

    if (checkCondition(0)) df.resolve(true);

    const intervalInstance = setInterval(() => {
      if (checkCondition(Date.now() - initTime)) df.resolve(true);
    }, interval);

    const res = timeout ? Promise.race<boolean>([Deferred.timeout(timeout).then(() => false), df]) : df;
    res.catch().then(() => clearInterval(intervalInstance));
    return res;
  }

  /**
   * A newly created Promise object.
   * Initially in pending state.
   */
  constructor(executor?: DeferredExecutor<T>) {
    let rs: (value: T | PromiseLike<T>) => void;
    let rj: (reason?: unknown) => void;

    super((resolve, reject) => {
      rs = resolve;
      rj = reject;
      return executor?.(resolve, reject);
    });

    this.resolve = rs!;
    this.reject = rj!;

    (async () => {
      try {
        const res = await this;
        this.value = res;
        this.status = 'resolved';
      } catch (e) {
        this.error = e;
        this.status = 'rejected';
      }
    })();
  }
}
