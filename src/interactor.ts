import { MicrophoneStatus } from "./domain";
import { Emitter } from "./emitter";

export interface Events {
  data: MicrophoneStatus;
  end: void;
  error: Error;
}

export type MicrophoneStatusEmitter = Emitter<Events>;
