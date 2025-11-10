import React, { createContext, useContext, useRef } from 'react';
import { StoreApi, UseBoundStore, create } from 'zustand';

/**
 * Creates a Zustand store wrapped in React Context
 * This pattern combines the benefits of Zustand (simple state management)
 * with React Context (scoped state per component tree)
 *
 *
 * @example
 * const [Provider, useStore] = createContextStore('MyStore', (set) => ({
 *   count: 0,
 *   increment: () => set((state) => ({ count: state.count + 1 }))
 * }));
 *
 * export const MyComponent = Provider(() => {
 *   const { count, increment } = useStore();
 *   return <button onClick={increment}>{count}</button>;
 * });
 */
export function createContextStore<T extends object>(
  name: string,
  createStore: (set: StoreApi<T>['setState'], get: StoreApi<T>['getState']) => T
): [
  (component: () => React.ReactElement) => () => React.ReactElement,
  UseBoundStore<StoreApi<T>>
] {
  const Context = createContext<UseBoundStore<StoreApi<T>> | null>(null);

  const withProvider = (Component: () => React.ReactElement) => {
    return () => {
      const storeRef = useRef<UseBoundStore<StoreApi<T>>>(create<T>(createStore));

      if (!storeRef.current) {
        storeRef.current = create<T>(createStore);
      }

      return (
        <Context.Provider value={storeRef.current}>
          <Component />
        </Context.Provider>
      );
    };
  };

  const useStore = ((selector?: (state: T) => any) => {
    const store = useContext(Context);

    if (!store) {
      throw new Error(
        `use${name}Store must be used within ${name}Provider. ` +
        `Make sure to wrap your component with the provider HOC.`
      );
    }

    if (!selector) {
      return store();
    }

    return store(selector);
  }) as UseBoundStore<StoreApi<T>>;

  return [withProvider, useStore];
}
