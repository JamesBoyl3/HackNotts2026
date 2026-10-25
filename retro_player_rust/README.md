# Retro Player 1999 — Rust edition

A retro-styled desktop music player built with Rust, `eframe/egui`, `rodio`, and `rfd`.

## Features
- Add MP3, WAV, and OGG audio files through a native file picker
- Play, pause, stop, previous, and next controls
- Automatically advances to the next track when a track finishes
- Remove tracks from the playlist
- Green-on-black LCD-inspired display and decorative equalizer
- Playback status and elapsed-time display

## Requirements
- Rust and Cargo installed (`rustc --version`, `cargo --version`)
- A working system audio output device

## Run
From this directory:

```bash
cargo run
```

The first run downloads and compiles dependencies, so it may take several minutes.

## Notes
- Audio support depends on the host's audio setup and supported formats.
- The app is a desktop GUI, not a browser app.
