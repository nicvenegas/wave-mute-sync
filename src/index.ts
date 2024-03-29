import { exec } from "node:child_process";
import process from "node:process";
import debug from "debug";

import { MicrophoneStatus } from "./domain";
import { WaveLinkEmitter } from "./WaveLinkEmitter";
import { WaveLinkWebSocketRPC } from "./WaveLinkWebSocketRPC";

const log = debug("wave-mute-sync");

process.on("uncaughtException", (e) => {
  if ((e as NodeJS.ErrnoException).code === "ECONNREFUSED") {
    log(`Ensure the WaveLink application is running.`);
    process.exit(1);
  } else {
    throw e;
  }
});

const micStatus = new WaveLinkEmitter(
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
