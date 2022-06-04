import { EventEmitter } from "events";

import { Events, MicrophoneStatusEmitter } from "../interactor";
import { isEqual, MicrophoneSettingsPayload, WaveLinkRPC } from "./WaveLinkRPC";

export class WaveLinkEmitter implements MicrophoneStatusEmitter {
  private readonly eventEmitter = new EventEmitter();
  private previousMicrophoneSettings: MicrophoneSettingsPayload | undefined;

  /** Assumes we start the application with the microphone unmuted */
  private isMuted: boolean = false;

  constructor(private readonly waveLinkRPC: WaveLinkRPC) {
    this.init();
  }

  private async init(): Promise<void> {
    const { isMicrophoneConnected } = await this.waveLinkRPC.request(
      "getMicrophoneState"
    );
    if (isMicrophoneConnected) {
      const microphoneSettings = await this.waveLinkRPC.request(
        "getMicrophoneSettings"
      );
      this.previousMicrophoneSettings = { ...microphoneSettings };
      this.emit("data", this.isMuted ? "muted" : "unmuted");
    } else {
      this.emit("data", "disconnected");
    }

    this.waveLinkRPC.onNotification(
      "microphoneSettingsChanged",
      (microphoneSettings) => {
        if (
          this.previousMicrophoneSettings &&
          isEqual(this.previousMicrophoneSettings, microphoneSettings)
        ) {
          this.isMuted = !this.isMuted;
          this.emit("data", this.isMuted ? "muted" : "unmuted");
        }
        this.previousMicrophoneSettings = { ...microphoneSettings };
      }
    );

    this.waveLinkRPC.onNotification(
      "microphoneStateChanged",
      ({ isMicrophoneConnected }) => {
        if (!isMicrophoneConnected) {
          this.emit("data", "disconnected");
        }
      }
    );
  }

  on<N extends keyof Events>(
    eventName: N,
    fn: (params: Events[N]) => void
  ): void {
    this.eventEmitter.on(eventName, fn);
  }

  off<N extends keyof Events>(
    eventName: N,
    fn: (params: Events[N]) => void
  ): void {
    this.eventEmitter.off(eventName, fn);
  }

  private emit<N extends keyof Events>(eventName: N, param: Events[N]) {
    this.eventEmitter.emit(eventName, param);
  }
}
