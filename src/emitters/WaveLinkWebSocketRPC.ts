import {
  JSONRPCClient,
  JSONRPCServer,
  JSONRPCServerAndClient,
} from "json-rpc-2.0";
import WebSocket from "ws";
import {
  isEqual,
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
  private readonly webSocket: WebSocket;
  private connectionPromise: Promise<void>;

  private readonly rpc = new JSONRPCServerAndClient(
    new JSONRPCServer(),
    new JSONRPCClient((request) => {
      try {
        this.webSocket.send(JSON.stringify(request));
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

  constructor(url = "ws://127.0.0.1:1824") {
    this.webSocket = new WebSocket(url);
    this.webSocket.onmessage = (event) => {
      this.rpc.receiveAndSend(JSON.parse(event.data.toString()));
    };
    this.webSocket.onclose = (event) => {
      this.rpc.rejectAllPendingRequests(
        `Connection is closed (${event.reason}).`
      );
    };

    this.connectionPromise = new Promise((resolve) => {
      this.webSocket.onopen = () => {
        resolve();
      };
    });
  }

  connect(): Promise<void> {
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
          if (
            !this.isDuplicatedMicrophoneSettingsNotification(
              payload as MicrophoneSettingsPayload
            )
          ) {
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
