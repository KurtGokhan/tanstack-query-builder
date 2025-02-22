export {};

declare module 'react' {
  interface Attributes {
    // [key: `$${string}`]: any;
    $withClickCount?: boolean;
    $tooltip?: ReactNode;
    $ripple?: boolean;
    $if?: any;
    $memo?: boolean;
  }

  interface DOMAttributes<T> {
    $onWheelActive?: WheelEventHandler<T> | undefined;
  }
}
