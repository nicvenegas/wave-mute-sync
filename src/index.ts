import { exec } from "child_process";
import { MicrophoneStatusEmitter } from "./interactor";
import { WaveLinkEmitter } from "./emitters/WaveLinkGateway";

const micStatus: MicrophoneStatusEmitter = new WaveLinkEmitter();

micStatus.on("data", (status) => {
  if (status === "muted" || status === "unmuted") {
    const script = `${status === "muted" ? "Mute" : "Unmute"} calls`;
    exec(
      `osascript -e 'tell application "Keyboard Maestro Engine" to do script "${script}"'`
    );
  }
});

micStatus.on("error", (e) => {
  // TODO Error handling
});
