import { MicrophoneStatus } from "./domain";
import { Emitter } from "./emitters";

export interface Events {
  data: MicrophoneStatus;
  end: void;
  error: Error;
}

export type MicrophoneStatusEmitter = Emitter<Events>;
