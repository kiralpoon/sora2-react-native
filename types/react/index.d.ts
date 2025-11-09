declare module 'react' {
  export type ReactNode = any;
  export interface FunctionComponent<P = {}> {
    (props: P): ReactNode | null;
  }
  export interface PropsWithChildren<P> extends P {
    children?: ReactNode;
  }
  export function createElement(type: any, props?: any, ...children: any[]): ReactNode;
  export function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useReducer<R extends (state: any, action: any) => any, I>(reducer: R, initialArg: I): [ReturnType<R>, (action: Parameters<R>[1]) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export const Fragment: any;
  export default any;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}
