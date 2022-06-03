import { Events, MicrophoneStatusEmitter } from "../interactor";

export class WaveLinkEmitter implements MicrophoneStatusEmitter {
  on<N extends keyof Events>(
    eventName: N,
    fn: (params: Events[N]) => void
  ): void {
    throw new Error("Method not implemented.");
  }
  off<N extends keyof Events>(
    eventName: N,
    fn: (params: Events[N]) => void
  ): void {
    throw new Error("Method not implemented.");
  }
}
