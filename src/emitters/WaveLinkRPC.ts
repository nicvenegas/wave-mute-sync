export interface MicrophoneStatePayload {
  isMicrophoneConnected: boolean;
}

export function isMicrophoneStatePayload(
  payload: any
): payload is MicrophoneStatePayload {
  return !!payload && typeof payload.isMicrophoneConnected === "boolean";
}

export interface MicrophoneSettingsPayload {
  isMicrophoneClipguardOn: boolean;
  isMicrophoneLowcutOn: boolean;
  microphoneBalance: number;
  microphoneGain: number;
  microphoneOutputVolume: number;
}

export function isMicrophoneSettingsPayload(
  payload: any
): payload is MicrophoneSettingsPayload {
  return (
    !!payload &&
    typeof payload.isMicrophoneClipguardOn === "boolean" &&
    typeof payload.isMicrophoneLowcutOn === "boolean" &&
    typeof payload.microphoneBalance === "number" &&
    typeof payload.microphoneGain === "number" &&
    typeof payload.microphoneOutputVolume === "number"
  );
}

export function isEqual(
  a: MicrophoneSettingsPayload,
  b: MicrophoneSettingsPayload
) {
  return (
    a.isMicrophoneClipguardOn === b.isMicrophoneClipguardOn &&
    a.isMicrophoneLowcutOn === b.isMicrophoneLowcutOn &&
    a.microphoneBalance === b.microphoneBalance &&
    a.microphoneGain === b.microphoneGain &&
    a.microphoneOutputVolume === b.microphoneOutputVolume
  );
}

export type RequestMethods = "getMicrophoneSettings" | "getMicrophoneState";

export type ResponsePayload<M extends RequestMethods> =
  M extends "getMicrophoneSettings"
    ? MicrophoneSettingsPayload
    : M extends "getMicrophoneState"
    ? MicrophoneStatePayload
    : never;

export type NotificationMethods =
  | "microphoneSettingsChanged"
  | "microphoneStateChanged";

export type NotificatonPayload<M extends NotificationMethods> =
  M extends "microphoneSettingsChanged"
    ? MicrophoneSettingsPayload
    : M extends "microphoneStateChanged"
    ? MicrophoneStatePayload
    : never;

export function isValidResponsePayload<M extends RequestMethods>(
  method: M,
  payload: any
): payload is ResponsePayload<M> {
  switch (method) {
    case "getMicrophoneSettings":
      return isMicrophoneSettingsPayload(payload);
    case "getMicrophoneState":
      return isMicrophoneStatePayload(payload);
    default:
      const assertExhaustive: never = method;
      return false;
  }
}

export function isValidNotificationPayload<M extends NotificationMethods>(
  method: M,
  payload: any
): payload is NotificatonPayload<M> {
  switch (method) {
    case "microphoneSettingsChanged":
      return isMicrophoneSettingsPayload(payload);
    case "microphoneStateChanged":
      return isMicrophoneStatePayload(payload);
    default:
      const assertExhaustive: never = method;
      return false;
  }
}

export interface WaveLinkRPC {
  request<M extends RequestMethods>(method: M): Promise<ResponsePayload<M>>;
  onNotification<M extends NotificationMethods>(
    method: M,
    fn: (param: NotificatonPayload<M>) => void
  ): void;
}
