import { exec } from "child_process";
import debug from "debug";

import { MicrophoneStatusEmitter } from "./interactor";
import { WaveLinkEmitter } from "./emitters/WaveLinkEmitter";
import { WaveLinkWebSocketRPC } from "./emitters/WaveLinkWebSocketRPC";
import { MicrophoneStatus } from "./domain";

const log = debug("wave-mute-sync");

const micStatus: MicrophoneStatusEmitter = new WaveLinkEmitter(
  new WaveLinkWebSocketRPC(),
  process.argv[2] === "--muted"
);

micStatus.on("data", (status: MicrophoneStatus) => {
  log(`Microphone is ${status}`);
  if (status === "muted" || status === "unmuted") {
    const macro = "Wave Mute Sync";
    const appleScript = `tell application "Keyboard Maestro Engine" to do script "${macro}" with parameter "${status}"`;
    exec(`osascript -e '${appleScript}'`);
    return;
  }
});

micStatus.on("error", (e: Error) => {
  // TODO Error handling
});

micStatus.connect();
