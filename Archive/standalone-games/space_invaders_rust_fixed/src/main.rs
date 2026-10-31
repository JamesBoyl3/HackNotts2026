use eframe::egui::{self, Color32, Pos2, Rect, Vec2};
use rand::Rng;
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink};
use std::{
    fs,
    io::BufReader,
    path::Path,
    time::{Duration, Instant},
};

const W: f32 = 600.0;
const H: f32 = 800.0;
const FPS: f32 = 60.0;
const ASSETS: &str = "StarWars2.0";

#[derive(Clone)]
struct Bullet {
    x: f32,
    y: f32,
    w: f32,
    h: f32,
}

#[derive(Clone)]
struct Alien {
    x: f32,
    y: f32,
    w: f32,
    h: f32,
    direction: f32,
    counter: f32,
    texture: Option<egui::TextureHandle>,
}

struct Explosion {
    x: f32,
    y: f32,
    size: f32,
    frame: usize,
    ticks: u8,
}

struct Ship {
    x: f32,
    y: f32,
    w: f32,
    h: f32,
    health: i32,
    last_shot: Instant,
}

struct Sounds {
    _stream: Option<OutputStream>,
    handle: Option<OutputStreamHandle>,
}

impl Sounds {
    fn new() -> Self {
        match OutputStream::try_default() {
            Ok((stream, handle)) => Self {
                _stream: Some(stream),
                handle: Some(handle),
            },
            Err(_) => Self {
                _stream: None,
                handle: None,
            },
        }
    }

    fn play(&self, filename: &str, volume: f32) {
        let Some(handle) = &self.handle else {
            return;
        };

        let path = Path::new(ASSETS).join(filename);

        let Ok(file) = fs::File::open(path) else {
            return;
        };

        let Ok(source) = Decoder::new(BufReader::new(file)) else {
            return;
        };

        if let Ok(sink) = Sink::try_new(handle) {
            sink.set_volume(volume);
            sink.append(source);
            sink.detach();
        }
    }
}

struct Game {
    ship: Ship,
    player_bullets: Vec<Bullet>,
    alien_bullets: Vec<Bullet>,
    aliens: Vec<Alien>,
    explosions: Vec<Explosion>,

    ship_tex: Option<egui::TextureHandle>,
    bullet_tex: Option<egui::TextureHandle>,
    alien_bullet_tex: Option<egui::TextureHandle>,
    alien_textures: Vec<Option<egui::TextureHandle>>,
    bg_tex: Option<egui::TextureHandle>,
    explosion_textures: Vec<Option<egui::TextureHandle>>,

    countdown: i32,
    countdown_at: Instant,
    last_alien_shot: Instant,
    gameover: i32,
    last_frame: Instant,

    sounds: Sounds,
}

impl Game {
    fn load_texture(
        ctx: &egui::Context,
        path: impl AsRef<Path>,
    ) -> Option<egui::TextureHandle> {
        let bytes = fs::read(path).ok()?;
        let img = image::load_from_memory(&bytes).ok()?.to_rgba8();

        let size = [
            img.width() as usize,
            img.height() as usize,
        ];

        let color_image =
            egui::ColorImage::from_rgba_unmultiplied(size, img.as_raw());

        Some(ctx.load_texture(
            "game_asset",
            color_image,
            egui::TextureOptions::LINEAR,
        ))
    }

    fn new(cc: &eframe::CreationContext<'_>) -> Self {
        let ctx = &cc.egui_ctx;

        let ship_tex = Self::load_texture(
            ctx,
            Path::new(ASSETS).join("spaceship.png"),
        );

        let bullet_tex = Self::load_texture(
            ctx,
            Path::new(ASSETS).join("bullet.png"),
        );

        let alien_bullet_tex = Self::load_texture(
            ctx,
            Path::new(ASSETS).join("alien_bullet.png"),
        );

        let bg_tex = Self::load_texture(
            ctx,
            Path::new(ASSETS).join("bg.png"),
        );

        let alien_textures = (1..=5)
            .map(|i| {
                Self::load_texture(
                    ctx,
                    Path::new(ASSETS).join(format!("alien{i}.png")),
                )
            })
            .collect();

        let explosion_textures = (1..=5)
            .map(|i| {
                Self::load_texture(
                    ctx,
                    Path::new(ASSETS).join(format!("exp{i}.png")),
                )
            })
            .collect();

        let mut game = Self {
            ship: Ship {
                x: W / 2.0,
                y: H - 100.0,
                w: 64.0,
                h: 64.0,
                health: 3,
                last_shot: Instant::now() - Duration::from_secs(1),
            },

            player_bullets: Vec::new(),
            alien_bullets: Vec::new(),
            aliens: Vec::new(),
            explosions: Vec::new(),

            ship_tex,
            bullet_tex,
            alien_bullet_tex,
            alien_textures,
            bg_tex,
            explosion_textures,

            countdown: 3,
            countdown_at: Instant::now(),
            last_alien_shot: Instant::now(),
            gameover: 0,
            last_frame: Instant::now(),

            sounds: Sounds::new(),
        };

        game.create_aliens();
        game
    }

    fn create_aliens(&mut self) {
        self.aliens.clear();

        let mut rng = rand::rng();

        for row in 0..5 {
            for col in 0..5 {
                let texture_index = rng.random_range(0..5);

                self.aliens.push(Alien {
                    x: 100.0 + col as f32 * 100.0,
                    y: 100.0 + row as f32 * 70.0,
                    w: 48.0,
                    h: 42.0,
                    direction: 1.0,
                    counter: 0.0,
                    texture: self.alien_textures[texture_index].clone(),
                });
            }
        }
    }

    fn reset(&mut self) {
        self.ship = Ship {
            x: W / 2.0,
            y: H - 100.0,
            w: 64.0,
            h: 64.0,
            health: 3,
            last_shot: Instant::now() - Duration::from_secs(1),
        };

        self.player_bullets.clear();
        self.alien_bullets.clear();
        self.explosions.clear();

        self.create_aliens();

        self.countdown = 3;
        self.countdown_at = Instant::now();
        self.last_alien_shot = Instant::now();
        self.gameover = 0;
    }

    fn rect(x: f32, y: f32, w: f32, h: f32) -> Rect {
        Rect::from_center_size(
            Pos2::new(x, y),
            Vec2::new(w, h),
        )
    }

    fn add_explosion(&mut self, x: f32, y: f32, size: f32) {
        self.explosions.push(Explosion {
            x,
            y,
            size,
            frame: 0,
            ticks: 0,
        });
    }

    fn update_game(&mut self, ctx: &egui::Context) {
        let now = Instant::now();

        let dt = ((now - self.last_frame).as_secs_f32() * FPS)
            .min(3.0);

        self.last_frame = now;

        // Countdown
        if self.countdown > 0 {
            if now.duration_since(self.countdown_at)
                >= Duration::from_secs(1)
            {
                self.countdown -= 1;
                self.countdown_at = now;
            }

            return;
        }

        // Restart after victory or defeat.
        if self.gameover != 0 {
            if ctx.input(|i| i.key_pressed(egui::Key::Tab)) {
                self.reset();
            }

            return;
        }

        // Player movement
        if ctx.input(|i| i.key_down(egui::Key::ArrowLeft)) {
            self.ship.x =
                (self.ship.x - 8.0 * dt).max(self.ship.w / 2.0);
        }

        if ctx.input(|i| i.key_down(egui::Key::ArrowRight)) {
            self.ship.x =
                (self.ship.x + 8.0 * dt).min(W - self.ship.w / 2.0);
        }

        // Player shooting
        if ctx.input(|i| i.key_down(egui::Key::Space))
            && now.duration_since(self.ship.last_shot)
                > Duration::from_millis(500)
        {
            self.sounds.play("laser.wav", 0.25);

            self.player_bullets.push(Bullet {
                x: self.ship.x,
                y: self.ship.y - self.ship.h / 2.0,
                w: 8.0,
                h: 20.0,
            });

            self.ship.last_shot = now;
        }

        // Move player bullets
        for bullet in &mut self.player_bullets {
            bullet.y -= 5.0 * dt;
        }

        self.player_bullets
            .retain(|b| b.y + b.h / 2.0 >= 0.0);

        // Detect player bullet collisions.
        // Collect collisions first to avoid borrowing conflicts.
        let mut dead_bullets = Vec::new();
        let mut dead_aliens = Vec::new();
        let mut explosion_positions = Vec::new();

        for (bullet_index, bullet) in
            self.player_bullets.iter().enumerate()
        {
            let bullet_rect =
                Self::rect(bullet.x, bullet.y, bullet.w, bullet.h);

            if let Some((alien_index, _)) =
                self.aliens.iter().enumerate().find(|(_, alien)| {
                    bullet_rect.intersects(Self::rect(
                        alien.x,
                        alien.y,
                        alien.w,
                        alien.h,
                    ))
                })
            {
                dead_bullets.push(bullet_index);
                dead_aliens.push(alien_index);
                explosion_positions.push((bullet.x, bullet.y));
            }
        }

        dead_bullets.sort_unstable();
        dead_bullets.dedup();

        dead_aliens.sort_unstable();
        dead_aliens.dedup();

        for (x, y) in explosion_positions {
            self.sounds.play("explosion.wav", 0.25);
            self.add_explosion(x, y, 40.0);
        }

        for i in dead_bullets.into_iter().rev() {
            self.player_bullets.remove(i);
        }

        for i in dead_aliens.into_iter().rev() {
            if i < self.aliens.len() {
                self.aliens.remove(i);
            }
        }

        // Alien movement
        for alien in &mut self.aliens {
            alien.x += alien.direction * dt;
            alien.counter += dt;

            if alien.counter > 75.0 {
                alien.direction *= -1.0;
                alien.counter = 0.0;
            }
        }

        // Alien shooting
        if now.duration_since(self.last_alien_shot)
            > Duration::from_millis(1000)
            && self.alien_bullets.len() < 5
            && !self.aliens.is_empty()
        {
            let idx = rand::rng().random_range(0..self.aliens.len());
            let alien = &self.aliens[idx];

            self.alien_bullets.push(Bullet {
                x: alien.x,
                y: alien.y + alien.h / 2.0,
                w: 10.0,
                h: 20.0,
            });

            self.last_alien_shot = now;
        }

        // Move alien bullets
        for bullet in &mut self.alien_bullets {
            bullet.y += 2.0 * dt;
        }

        self.alien_bullets
            .retain(|b| b.y - b.h / 2.0 <= H);

        // Detect alien bullets hitting the ship.
        let ship_rect = Self::rect(
            self.ship.x,
            self.ship.y,
            self.ship.w * 0.75,
            self.ship.h * 0.75,
        );

        let mut hit_indices = Vec::new();
        let mut hit_positions = Vec::new();

        for (i, bullet) in self.alien_bullets.iter().enumerate() {
            if Self::rect(
                bullet.x,
                bullet.y,
                bullet.w,
                bullet.h,
            )
            .intersects(ship_rect)
            {
                hit_indices.push(i);
                hit_positions.push((bullet.x, bullet.y));
            }
        }

        for i in hit_indices.into_iter().rev() {
            self.alien_bullets.remove(i);
            self.ship.health -= 1;
        }

        for (x, y) in hit_positions {
            self.sounds.play("explosion2.wav", 0.25);
            self.add_explosion(x, y, 20.0);
        }

        // Check game state
        if self.ship.health <= 0 {
            self.gameover = -1;
            self.add_explosion(
                self.ship.x,
                self.ship.y,
                160.0,
            );
        } else if self.aliens.is_empty() {
            self.gameover = 1;
        }

        // Update explosion animation.
        for explosion in &mut self.explosions {
            explosion.ticks += 1;

            if explosion.ticks >= 3 {
                explosion.ticks = 0;

                if explosion.frame < 4 {
                    explosion.frame += 1;
                }
            }
        }

        self.explosions
            .retain(|e| !(e.frame == 4 && e.ticks >= 3));
    }

    fn draw_texture(
        painter: &egui::Painter,
        texture: &Option<egui::TextureHandle>,
        rect: Rect,
        fallback: Color32,
    ) {
        if let Some(texture) = texture {
            painter.image(
                texture.id(),
                rect,
                Rect::from_min_max(
                    Pos2::ZERO,
                    Pos2::new(1.0, 1.0),
                ),
                Color32::WHITE,
            );
        } else {
            painter.rect_filled(rect, 3.0, fallback);
        }
    }

    fn draw(&self, painter: &egui::Painter, origin: Pos2) {
        let area = Rect::from_min_size(
            origin,
            Vec2::new(W, H),
        );

        painter.rect_filled(area, 0.0, Color32::BLACK);

        // Background
        if let Some(bg) = &self.bg_tex {
            painter.image(
                bg.id(),
                area,
                Rect::from_min_max(
                    Pos2::ZERO,
                    Pos2::new(1.0, 1.0),
                ),
                Color32::WHITE,
            );
        } else {
            for i in 0..100 {
                let x = ((i * 97) % 600) as f32;
                let y = ((i * 137) % 800) as f32;

                painter.circle_filled(
                    origin + Vec2::new(x, y),
                    1.0,
                    Color32::WHITE,
                );
            }
        }

        let shifted = |rect: Rect| rect.translate(origin.to_vec2());

        // Ship
        let ship_rect = shifted(Self::rect(
            self.ship.x,
            self.ship.y,
            self.ship.w,
            self.ship.h,
        ));

        Self::draw_texture(
            painter,
            &self.ship_tex,
            ship_rect,
            Color32::LIGHT_BLUE,
        );

        // Health bar
        let health_bar = Rect::from_min_size(
            Pos2::new(
                ship_rect.left(),
                ship_rect.bottom() + 10.0,
            ),
            Vec2::new(self.ship.w, 15.0),
        );

        painter.rect_filled(
            health_bar,
            0.0,
            Color32::RED,
        );

        if self.ship.health > 0 {
            painter.rect_filled(
                Rect::from_min_size(
                    health_bar.min,
                    Vec2::new(
                        self.ship.w
                            * (self.ship.health as f32 / 3.0),
                        15.0,
                    ),
                ),
                0.0,
                Color32::GREEN,
            );
        }

        // Player bullets
        for bullet in &self.player_bullets {
            Self::draw_texture(
                painter,
                &self.bullet_tex,
                shifted(Self::rect(
                    bullet.x,
                    bullet.y,
                    bullet.w,
                    bullet.h,
                )),
                Color32::YELLOW,
            );
        }

        // Alien bullets
        for bullet in &self.alien_bullets {
            Self::draw_texture(
                painter,
                &self.alien_bullet_tex,
                shifted(Self::rect(
                    bullet.x,
                    bullet.y,
                    bullet.w,
                    bullet.h,
                )),
                Color32::RED,
            );
        }

        // Aliens
        for alien in &self.aliens {
            Self::draw_texture(
                painter,
                &alien.texture,
                shifted(Self::rect(
                    alien.x,
                    alien.y,
                    alien.w,
                    alien.h,
                )),
                Color32::from_rgb(100, 220, 100),
            );
        }

        // Explosions
        for explosion in &self.explosions {
            let texture =
                &self.explosion_textures[explosion.frame.min(4)];

            Self::draw_texture(
                painter,
                texture,
                shifted(Self::rect(
                    explosion.x,
                    explosion.y,
                    explosion.size,
                    explosion.size,
                )),
                Color32::YELLOW,
            );
        }

        // Countdown and end screens
        let white = Color32::WHITE;

        if self.countdown > 0 {
            painter.text(
                origin + Vec2::new(
                    W / 2.0 - 100.0,
                    H / 2.0 + 50.0,
                ),
                egui::Align2::LEFT_TOP,
                "GET READY!",
                egui::FontId::proportional(40.0),
                white,
            );

            painter.text(
                origin + Vec2::new(
                    W / 2.0 - 10.0,
                    H / 2.0 + 110.0,
                ),
                egui::Align2::LEFT_TOP,
                self.countdown.to_string(),
                egui::FontId::proportional(40.0),
                white,
            );
        } else if self.gameover != 0 {
            let message = if self.gameover < 0 {
                "GAME OVER!"
            } else {
                "YOU WIN!"
            };

            painter.text(
                origin + Vec2::new(
                    W / 2.0 - 110.0,
                    H / 2.0 + 50.0,
                ),
                egui::Align2::LEFT_TOP,
                message,
                egui::FontId::proportional(40.0),
                white,
            );

            painter.text(
                origin + Vec2::new(
                    W / 2.0 - 140.0,
                    H / 2.0 + 100.0,
                ),
                egui::Align2::LEFT_TOP,
                "Tab to restart",
                egui::FontId::proportional(30.0),
                white,
            );
        }
    }
}

impl eframe::App for Game {
    fn update(
        &mut self,
        ctx: &egui::Context,
        _frame: &mut eframe::Frame,
    ) {
        self.update_game(ctx);

        egui::CentralPanel::default()
            .frame(egui::Frame::NONE.fill(Color32::BLACK))
            .show(ctx, |ui| {
                let available = ui.available_size();

                let scale = (available.x / W)
                    .min(available.y / H)
                    .max(0.1);

                let size = Vec2::new(
                    W * scale,
                    H * scale,
                );

                let (rect, _) =
                    ui.allocate_exact_size(size, egui::Sense::hover());

                self.draw(&ui.painter_at(rect), rect.min);
            });

        ctx.request_repaint_after(
            Duration::from_secs_f32(1.0 / FPS),
        );
    }
}

fn main() -> eframe::Result {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([W, H])
            .with_min_inner_size([300.0, 400.0]),
        ..Default::default()
    };

    eframe::run_native(
        "Space Invenders",
        options,
        Box::new(|cc| Ok(Box::new(Game::new(cc)))),
    )
}