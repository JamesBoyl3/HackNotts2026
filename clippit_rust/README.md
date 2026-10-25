# Clippit in Rust

Rust/egui desktop adaptation of the supplied Python Tkinter Clippit app.

## Requirements
- Rust toolchain (`rustc` and `cargo`)
- Internet connection for Cargo to download dependencies on first build

## Run
```bash
cargo run
```

Release build:
```bash
cargo run --release
```

Includes the retro-style interface, a vector-drawn paperclip character, simple blinking/bobbing animation, speech bubble, chat history, keyword responses, random tips, suggestions, Help/About, and Exit.

Responses are rule-based. This is not connected to an AI model or your team's API yet.
