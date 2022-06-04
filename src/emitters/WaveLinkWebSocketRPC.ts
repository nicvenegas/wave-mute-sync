import {
  JSONRPCClient,
  JSONRPCServer,
  JSONRPCServerAndClient,
} from "json-rpc-2.0";
import WebSocket from "ws";
import {
  isEqual,
  isMicrophoneSettingsPayload,
  isValidNotificationPayload,
  isValidResponsePayload,
  MicrophoneSettingsPayload,
  NotificationMethods,
  NotificatonPayload,
  RequestMethods,
  ResponsePayload,
  WaveLinkRPC,
} from "./WaveLinkRPC";

export class WaveLinkWebSocketRPC implements WaveLinkRPC {
  private webSocket: WebSocket | undefined;
  private connectionPromiseResolve = () => {};
  private connectionPromise: Promise<void> = new Promise((resolve) => {
    this.connectionPromiseResolve = resolve;
  });

  private readonly rpc = new JSONRPCServerAndClient(
    new JSONRPCServer(),
    new JSONRPCClient(async (request) => {
      try {
        await this.connectionPromise;
        this.webSocket!.send(JSON.stringify(request));
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    })
  );

  private previousMicrophoneSettingsNotification:
    | MicrophoneSettingsPayload
    | undefined;
  private lastMicrophoneSettingsNotificationMs: number = Date.now();

  constructor(private readonly webSocketURL = "ws://127.0.0.1:1824") {}

  connect(): Promise<void> {
    this.webSocket = new WebSocket(this.webSocketURL);
    this.webSocket.onmessage = (event) => {
      this.rpc.receiveAndSend(JSON.parse(event.data.toString()));
    };
    this.webSocket.onclose = (event) => {
      this.rpc.rejectAllPendingRequests(
        `Connection is closed (${event.reason}).`
      );
    };
    this.webSocket.onopen = () => {
      this.connectionPromiseResolve();
    };
    return this.connectionPromise;
  }

  async request<M extends RequestMethods>(
    method: M
  ): Promise<ResponsePayload<M>> {
    const payload = await this.rpc.request(method);
    switch (method) {
      case "getMicrophoneSettings":
      case "getMicrophoneState":
        if (!isValidResponsePayload(method, payload)) {
          throw new Error(`Payload for method ${method} type mismatch`);
        }

        return payload;
      default:
        const assertExhaustive: never = method;
        throw new Error("Unreachable code (never)");
    }
  }

  onNotification<M extends NotificationMethods>(
    method: M,
    fn: (param: NotificatonPayload<M>) => void
  ): void {
    switch (method) {
      case "microphoneSettingsChanged":
        this.rpc.addMethod(method, (payload) => {
          if (!isValidNotificationPayload(method, payload)) {
            throw new Error(`Payload for method ${method} type mismatch`);
          }

          // TODO Unsure why this cast is required:
          //
          // typeof payload is inferred as M extends "microphoneSettingsChanged"
          //   ? MicrophoneSettingsPayload
          //   : MicrophoneStatePayload
          const p = payload as MicrophoneSettingsPayload;
          if (!this.isDuplicatedMicrophoneSettingsNotification(p)) {
            fn(payload);
          }
        });
        return;
      case "microphoneStateChanged":
        this.rpc.addMethod(method, (payload) => {
          if (!isValidNotificationPayload(method, payload)) {
            throw new Error(`Payload for method ${method} type mismatch`);
          }

          fn(payload);
        });
        return;
      default:
        const assertExhaustive: never = method;
    }
  }

  /**
   * WaveLink sends 4× microphoneSettingsChanged notifications whenever
   * - Mute is toggled
   * - The dial is turned
   * - The dial button is pressed to jump between gain/volume/balance
   */
  private isDuplicatedMicrophoneSettingsNotification(
    payload: MicrophoneSettingsPayload
  ): boolean {
    const nowMs = Date.now();
    const timeSinceLastPayloadMs =
      nowMs - this.lastMicrophoneSettingsNotificationMs;

    if (
      this.previousMicrophoneSettingsNotification &&
      isEqual(this.previousMicrophoneSettingsNotification, payload) &&
      timeSinceLastPayloadMs < 100
    ) {
      return true;
    }

    this.previousMicrophoneSettingsNotification = { ...payload };
    this.lastMicrophoneSettingsNotificationMs = nowMs;
    return false;
  }
}
