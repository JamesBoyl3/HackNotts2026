# Space Invenders — Rust port (compile fixes)

## Assets
Copy the original `StarWars2.0` directory into this project's root, beside `Cargo.toml`.
It should contain `bg.png`, `spaceship.png`, `bullet.png`, `alien_bullet.png`,
`alien1.png` through `alien5.png`, `exp1.png` through `exp5.png`, and the WAV sounds
`explosion.wav`, `explosion2.wav`, and `laser.wav`.

## Run
```bash
cargo run
```

Controls: Left/Right arrows move, Space fires, and Tab restarts after a win or loss.
Missing assets fall back to simple shapes; missing sounds are skipped.

This fixes the compile errors from the supplied terminal output. It has not been run
on your Mac, so if Cargo reports another error, send the new output.
