import { exec } from "child_process";
import { MicrophoneStatusEmitter } from "./interactor";
import { WaveLinkEmitter } from "./emitters/WaveLinkEmitter";
import { WaveLinkWebSocketRPC } from "./emitters/WaveLinkWebSocketRPC";
import { MicrophoneStatus } from "./domain";

(async () => {
  console.log("Connecting to WaveLink…");
  const waveLinkRPC = new WaveLinkWebSocketRPC();
  await waveLinkRPC.connect();
  console.log("Connected!");

  const micStatus: MicrophoneStatusEmitter = new WaveLinkEmitter(
    waveLinkRPC,
    process.argv[2] === "--muted"
  );

  micStatus.on("data", (status: MicrophoneStatus) => {
    if (status === "muted" || status === "unmuted") {
      console.log(`Microphone is ${status}`);

      const macro = "Elgato Wave Mute Sync";
      const appleScript = `tell application "Keyboard Maestro Engine" to do script "${macro}" with parameter "${status}"`;
      exec(`osascript -e '${appleScript}'`);
      return;
    }

    if (status === "disconnected") {
      console.log("Microphone is disconnected");
      return;
    }

    const assertExhaustive: never = status;
  });

  micStatus.on("error", (e: Error) => {
    // TODO Error handling
  });
})();
