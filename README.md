# Wave Mute Sync

Bidirectional sync between the Elgato Wave hardware mute button and OS-level
mute (via a keyboard shortcut)

## Installation

Requirements

- Elgato [Wave Link](https://www.elgato.com/en/downloads)
- [Keyboard Maestro](https://www.keyboardmaestro.com/)
  - Import the macros in the `macros` directory
- [nvm](https://github.com/nvm-sh/nvm)
- [pnpm](https://pnpm.io/)
- Zoom (optional)
  - Ensure the _Mute/Unmute My Audio_ keyboard shortcut is set to its default
    (⇧⌘A) and is enabled globally

Install packages

```bash
nvm use
corepack enable
pnpm install
```

## Launching

Ensure the Wave Link application is running and the microphone is connected,
then run

```bash
DEBUG='wave-mute-sync*' pnpm exec ts-node src/index.ts
```

Assumes the microphone is unmuted when launched, however, you can override
this with the `--muted` flag

When active, use ⌃⇧⌘A or the hardware mute button on the Elgato Wave to toggle
mute and they'll stay in sync (and keep Zoom in sync, too)

## Limitations

### Elgato Wave and Wave Link

Many actions that manipulate the Wave hardware are indistinguishable from
legitimately toggling the hardware mute button, e.g.,

- Pressing the dial button to cycle between gain/monitoring volume/monitoring
  balance adjustment
- Updating some settings in the Wave Link application, e.g., Wave gain lock
- Saving settings to hardware in the Wave Link application

As a workaround, you can ⌃C the `ts-node` process and restart it to match
the actual hardware mute status by optionally passing the `--muted` flag

### Zoom

Muting via the Zoom UI itself isn't registered by the application nor
hardware: Zoom will be muted at the software level, but the hardware will
remain unmuted

Simply toggle mute via ⌃⇧⌘A or the hardware mute button a couple of times to
put everything back in sync

## Credits

Thanks to

- Stephen Millard ([@techflare][1]) — [Mute Your Microphone with Keyboard Maestro][2]
  (2018)
- Matt Aitchison — https://github.com/mattatcha/touchportal_elgato-wave (2020)

[1]: https://twitter.com/techflare
[2]: https://www.thoughtasylum.com/2018/02/04/Mute-Your-Microphone-with-Keyboard-Maestro/
