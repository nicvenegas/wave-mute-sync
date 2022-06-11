import { MicrophoneStatus } from "./domain";
import { Emitter } from "./emitters";

export interface Events {
  data: MicrophoneStatus;
  error: Error;
}

export interface MicrophoneStatusEmitter extends Emitter<Events> {
  connect(): Promise<void>;
}
