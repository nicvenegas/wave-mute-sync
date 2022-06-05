# Elgato Wave Mute Sync

Bidirectional sync between the Elgato Wave hardware mute button and the
OS-level mute, including keeping Zoom's mute status in sync

## Installation

Requirements

- Elgato [Wave Link](https://www.elgato.com/en/downloads)
- [Keyboard Maestro](https://www.keyboardmaestro.com/)
- Zoom (optional)
  - Ensure the _Mute/Unmute My Audio_ keyboard shortcut is set to its default
    (⇧⌘A) and is enabled globally

Install NPM packages

```bash
npm install
npm install -g ts-node
```

## Launching

Ensure the Wave Link application is running and the microphone is connected,
then run

```bash
ts-node src/index.ts
```

Assumes the microphone is unmuted when launched, however, you can override
this with the `--muted` flag

When active, use ⌃⇧⌘A or the hardware mute button on the Elgato Wave to toggle
mute and they'll stay in sync (and keep Zoom in sync, too)

## Limitations

### Elgato Wave and Wave Link

Many actions that manipulate the Wave hardware are indistinguishable from
legitimately toggling the hardware mute button. This includes

- Pressing the dial button to cycle between gain and monitoring volume/balance
- Updating settings in the Wave Link application, e.g., Low impedance mode,
  Show clipguard indicator, and Wave gain lock
- Saving settings to hardware in the Wave Link application

As a workaround, you can ⌃C the `ts-node` process and restart it to match
the actual mute status by optionally passing the `--muted` flag

### Zoom

Muting via the Zoom UI itself isn't registered by the application nor
hardware: Zoom will be muted at the software level, but the hardware will
remain unmuted

Simply toggle mute via ⌃⇧⌘A or the hardware mute button a couple of times to
put everything back in sync
