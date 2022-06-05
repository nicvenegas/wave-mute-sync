import { EventEmitter } from "events";

import { Events, MicrophoneStatusEmitter } from "../interactor";
import { isEqual, MicrophoneSettingsPayload, WaveLinkRPC } from "./WaveLinkRPC";

export class WaveLinkEmitter implements MicrophoneStatusEmitter {
  private readonly eventEmitter = new EventEmitter();

  private previousMicrophoneSettings: MicrophoneSettingsPayload | undefined;
  private lastMicrophoneSettingsNotificationMs: number = Date.now();

  constructor(
    private readonly waveLinkRPC: WaveLinkRPC,
    private isMuted = false
  ) {
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
        if (this.isDuplicateNotification(microphoneSettings)) {
          return;
        }

        const areSettingsUnchanged =
          this.previousMicrophoneSettings &&
          isEqual(this.previousMicrophoneSettings, microphoneSettings);
        if (areSettingsUnchanged) {
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

  /**
   * WaveLink sends 4× microphoneSettingsChanged notifications whenever
   * - Mute is toggled
   * - The dial is turned
   * - The dial button is pressed to jump between gain/volume/balance
   */
  private isDuplicateNotification(
    microphoneSettings: MicrophoneSettingsPayload
  ): boolean {
    const nowMs = Date.now();
    const timeSinceLastPayloadMs =
      nowMs - this.lastMicrophoneSettingsNotificationMs;

    if (
      this.previousMicrophoneSettings &&
      isEqual(this.previousMicrophoneSettings, microphoneSettings) &&
      timeSinceLastPayloadMs < 100
    ) {
      return true;
    }

    this.previousMicrophoneSettings = { ...microphoneSettings };
    this.lastMicrophoneSettingsNotificationMs = nowMs;
    return false;
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
