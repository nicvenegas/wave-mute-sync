export type EventMap = Record<string, any>;

export type EventReceiver<T> = (params: T) => void;

export interface Emitter<T extends EventMap> {
  on<N extends keyof T>(eventName: N, fn: (params: T[N]) => void): void;
  off<N extends keyof T>(eventName: N, fn: (params: T[N]) => void): void;
}
