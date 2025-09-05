// Zustand store type definitions

import { StateCreator } from 'zustand';

// Helper type for Zustand store selectors
export type StoreSelector<T, U> = (state: T) => U;

// Helper type for Zustand store actions
export type StoreActions = Record<string, (...args: any[]) => any>;

// Generic Zustand store type
export type ZustandStore<T> = T & {
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
};

// Type for store creation
export type CreateStore<T> = StateCreator<T, [], [], T>;
