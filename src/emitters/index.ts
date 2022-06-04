export type EventMap = Record<string, any>;

export interface Emitter<T extends EventMap> {
  on<N extends keyof T>(eventName: N, fn: (param: T[N]) => void): void;
  off<N extends keyof T>(eventName: N, fn: (param: T[N]) => void): void;
}
