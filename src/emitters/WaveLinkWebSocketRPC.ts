import {
  JSONRPCClient,
  JSONRPCServer,
  JSONRPCServerAndClient,
} from "json-rpc-2.0";
import WebSocket from "ws";
import {
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
    switch (method) {
      case "getMicrophoneSettings":
      case "getMicrophoneState":
        const payload = await this.rpc.request(method);
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
}
