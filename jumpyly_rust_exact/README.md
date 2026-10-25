# Jumpyly — Rust port matching the Python version

This version uses Rust with `eframe/egui`, and now attempts to load the same three images as the Python code:
- `Jumpy/cloud.png`
- `Jumpy/player.png`
- `Jumpy/rock.png`

## Important: copy your original assets
From the folder containing your Python version, copy the `Jumpy` folder (with those three PNG files) into this Rust project's root folder. The expected layout is:

```text
jumpyly_rust/
├── Cargo.toml
├── score.txt        # created automatically when a new high score is saved
├── Jumpy/
│   ├── cloud.png
│   ├── player.png
│   └── rock.png
└── src/
    └── main.rs
```

The code falls back to simple drawn shapes if the image files are absent, but for the closest match, use the original PNG assets.

## Run
```bash
cargo run
```

Controls match the Python game: `A` and `D` move left/right; `Space` restarts after game over. The game saves the high score to `score.txt`.
