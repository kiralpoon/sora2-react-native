declare module 'node:test' {
  export interface TestOptions {
    only?: boolean;
    skip?: boolean | string;
    timeout?: number;
  }
  export type TestFn = (
    name: string,
    fn: (t: { plan: (count: number) => void }) => Promise<void> | void,
    options?: TestOptions
  ) => void;
  export const test: TestFn;
  export default test;
}

declare module 'node:assert/strict' {
  import assert = require('assert');
  export = assert;
}
