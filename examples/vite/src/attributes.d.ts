export {};

declare module 'react' {
  interface Attributes {
    $tooltip?: string;
    $memo?: boolean;
  }
}
