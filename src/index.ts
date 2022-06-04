import { exec } from "child_process";
import { MicrophoneStatusEmitter } from "./interactor";
import { WaveLinkEmitter } from "./emitters/WaveLinkEmitter";
import { WaveLinkWebSocketRPC } from "./emitters/WaveLinkWebSocketRPC";
import { WaveLinkRPC } from "./emitters/WaveLinkRPC";

(async () => {
  console.log("Connecting to WaveLink…");
  const waveLinkRPC: WaveLinkRPC = new WaveLinkWebSocketRPC();
  await waveLinkRPC.connect();
  console.log("Connected!");

  const micStatus: MicrophoneStatusEmitter = new WaveLinkEmitter(waveLinkRPC);

  micStatus.on("data", (status) => {
    if (status === "muted" || status === "unmuted") {
      console.log(`Microphone is ${status}`);
      const script = `Elgato Wave ${status}`;
      exec(
        `osascript -e 'tell application "Keyboard Maestro Engine" to do script "${script}"'`
      );
      return;
    }

    if (status === "disconnected") {
      console.log("Microphone is disconnected");
      return;
    }

    const assertExhaustive: never = status;
  });

  micStatus.on("error", (e) => {
    // TODO Error handling
  });
})();
