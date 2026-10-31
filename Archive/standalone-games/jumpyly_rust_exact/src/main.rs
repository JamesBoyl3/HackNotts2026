use eframe::egui::{self, Align2, Color32, FontId, Pos2, Rect, Stroke, Vec2};
use rand::prelude::*;
use std::{
    fs,
    path::PathBuf,
    time::{Duration, Instant},
};

const WIDTH: f32 = 400.0;
const HEIGHT: f32 = 600.0;
const GRID_PANEL_HEIGHT: f32 = 20.0;
const SCROLL_THRESHOLD: f32 = 200.0;
const MAX_PLATFORMS: usize = 10;
const FPS: f32 = 55.0;

const WHITE: Color32 = Color32::WHITE;
const BLACK: Color32 = Color32::BLACK;
const PANEL: Color32 = Color32::from_rgb(153, 217, 234);
const SKY_FALLBACK: Color32 = Color32::from_rgb(153, 217, 234);
const ROCK_FALLBACK: Color32 = Color32::from_rgb(100, 100, 100);

fn load_texture(
    ctx: &egui::Context,
    path: &str,
    name: &str,
) -> Option<egui::TextureHandle> {
    let bytes = fs::read(path).ok()?;
    let decoded = image::load_from_memory(&bytes).ok()?.to_rgba8();
    let size = [decoded.width() as usize, decoded.height() as usize];
    let pixels = decoded.into_raw();
    let image = egui::ColorImage::from_rgba_unmultiplied(size, &pixels);
    Some(ctx.load_texture(name, image, egui::TextureOptions::LINEAR))
}

#[derive(Clone)]
struct Platform {
    x: f32,
    y: f32,
    width: f32,
    moving: bool,
    move_counter: u32,
    direction: f32,
    speed: f32,
}

impl Platform {
    fn new(x: f32, y: f32, width: f32, moving: bool) -> Self {
        let mut rng = rand::rng();
        Self {
            x,
            y,
            width,
            moving,
            move_counter: rng.random_range(0..=50),
            direction: if rng.random_bool(0.5) { -1.0 } else { 1.0 },
            speed: rng.random_range(1.0..=2.0),
        }
    }

    fn update(&mut self, scroll: f32) {
        if self.moving {
            self.move_counter += 1;
            self.x += self.direction * self.speed;
        }

        if self.move_counter >= 100 || self.x < 0.0 || self.x + self.width > WIDTH {
            self.direction *= -1.0;
            self.move_counter = 0;
        }

        self.y += scroll;
    }

    fn off_screen(&self) -> bool {
        self.y > HEIGHT
    }
}

struct Jumpyly {
    player_x: f32,
    player_y: f32,
    player_w: f32,
    player_h: f32,
    velocity_y: f32,
    flip: bool,
    platforms: Vec<Platform>,
    score: i32,
    high_score: i32,
    bg_scroll: f32,
    game_over: bool,
    fade_counter: f32,
    last_frame: Instant,
    score_path: PathBuf,
    cloud_texture: Option<egui::TextureHandle>,
    player_texture: Option<egui::TextureHandle>,
    platform_texture: Option<egui::TextureHandle>,
    assets_checked: bool,
}

impl Default for Jumpyly {
    fn default() -> Self {
        let score_path = PathBuf::from("score.txt");
        let high_score = fs::read_to_string(&score_path)
            .ok()
            .and_then(|s| s.trim().parse::<i32>().ok())
            .unwrap_or(0);

        let mut game = Self {
            player_x: WIDTH / 2.0 - 15.0,
            player_y: HEIGHT - 150.0 - 20.0,
            player_w: 30.0,
            player_h: 40.0,
            velocity_y: 0.0,
            flip: false,
            platforms: Vec::new(),
            score: 0,
            high_score,
            bg_scroll: 0.0,
            game_over: false,
            fade_counter: 0.0,
            last_frame: Instant::now(),
            score_path,
            cloud_texture: None,
            player_texture: None,
            platform_texture: None,
            assets_checked: false,
        };
        game.reset();
        game
    }
}

impl Jumpyly {
    fn reset(&mut self) {
        self.player_x = WIDTH / 2.0 - self.player_w / 2.0;
        self.player_y = HEIGHT - 150.0 - self.player_h / 2.0;
        self.velocity_y = 0.0;
        self.flip = false;
        self.platforms.clear();
        self.platforms.push(Platform::new(WIDTH / 2.0 - 50.0, HEIGHT - 50.0, 100.0, false));
        self.score = 0;
        self.bg_scroll = 0.0;
        self.game_over = false;
        self.fade_counter = 0.0;
        self.last_frame = Instant::now();
    }

    fn save_high_score(&mut self) {
        if self.score > self.high_score {
            self.high_score = self.score;
            let _ = fs::write(&self.score_path, self.high_score.to_string());
        }
    }

    fn player_rect(&self) -> Rect {
        Rect::from_min_size(
            Pos2::new(self.player_x, self.player_y),
            Vec2::new(self.player_w, self.player_h),
        )
    }

    fn add_platforms(&mut self) {
        while self.platforms.len() < MAX_PLATFORMS {
            let highest_y = self.platforms.iter().map(|p| p.y).fold(HEIGHT, f32::min);
            let mut rng = rand::rng();
            let p_width = rng.random_range(40.0..=60.0);
            let p_x = rng.random_range(0.0..=(WIDTH - p_width));
            let p_y = highest_y - rng.random_range(80.0..=120.0);
            let moving = if self.score > 500 {
                rng.random_range(1..=2) == 1
            } else {
                false
            };
            self.platforms.push(Platform::new(p_x, p_y, p_width, moving));
        }
    }

    fn update_game(&mut self, ctx: &egui::Context) {
        if self.game_over {
            return;
        }

        let dt = self.last_frame.elapsed().as_secs_f32().min(0.04);
        self.last_frame = Instant::now();

        let (left, right) = ctx.input(|i| {
            (
                i.key_down(egui::Key::A),
                i.key_down(egui::Key::D),
            )
        });

        let mut dx = 0.0;
        if left {
            dx = -10.0;
            self.flip = true;
        }
        if right {
            dx = 10.0;
            self.flip = false;
        }

        let old_x = self.player_x;
        self.player_x += dx;
        self.player_x = self.player_x.clamp(0.0, WIDTH - self.player_w);

        let old_bottom = self.player_y + self.player_h;
        self.velocity_y += 1.0 * (dt * FPS).max(0.1);
        let dy = self.velocity_y * (dt * FPS).max(0.1);
        self.player_y += dy;

        // Match the original Python collision test: landing only when falling
        // and the player's previous bottom was above the platform's center.
        for platform in &self.platforms {
            let player_after = Rect::from_min_size(
                Pos2::new(self.player_x, self.player_y),
                Vec2::new(self.player_w, self.player_h),
            );
            let platform_rect = Rect::from_min_size(
                Pos2::new(platform.x, platform.y),
                Vec2::new(platform.width, 30.0),
            );
            if player_after.intersects(platform_rect)
                && old_bottom < platform.y + 15.0
                && self.velocity_y > 0.0
            {
                self.player_y = platform.y - self.player_h;
                self.velocity_y = -20.0;
            }
        }

        let mut scroll = 0.0;
        if self.player_y <= SCROLL_THRESHOLD && self.velocity_y < 0.0 {
            scroll = -dy;
        }

        self.player_y += scroll;

        // Keep the player's original screen position while the world scrolls.
        if scroll > 0.0 {
            self.bg_scroll += scroll;
            if self.bg_scroll >= HEIGHT {
                self.bg_scroll = 0.0;
            }
            self.score += scroll as i32;
        }

        for platform in &mut self.platforms {
            platform.update(scroll);
        }
        self.platforms.retain(|p| !p.off_screen());
        self.add_platforms();

        let _ = old_x;
        if self.player_y > HEIGHT {
            self.game_over = true;
            self.save_high_score();
        }
    }

    fn draw_background(&self, painter: &egui::Painter, rect: Rect) {
        painter.rect_filled(rect, 0.0, SKY_FALLBACK);

        if let Some(texture) = &self.cloud_texture {
            let offset = self.bg_scroll;
            painter.image(
                texture.id(),
                Rect::from_min_size(
                    Pos2::new(rect.left(), rect.top() + offset),
                    Vec2::new(WIDTH, HEIGHT),
                ),
                Rect::from_min_max(Pos2::ZERO, Pos2::new(1.0, 1.0)),
                WHITE,
            );
            painter.image(
                texture.id(),
                Rect::from_min_size(
                    Pos2::new(rect.left(), rect.top() - HEIGHT + offset),
                    Vec2::new(WIDTH, HEIGHT),
                ),
                Rect::from_min_max(Pos2::ZERO, Pos2::new(1.0, 1.0)),
                WHITE,
            );
        } else {
            // Clearly visible fallback if Jumpy/cloud.png has not been copied.
            for (x, y, r) in [
                (65.0, 90.0, 22.0),
                (285.0, 190.0, 20.0),
                (105.0, 360.0, 21.0),
                (300.0, 500.0, 23.0),
            ] {
                for base in [-HEIGHT, 0.0] {
                    let c = Pos2::new(rect.left() + x, rect.top() + base + y + self.bg_scroll);
                    let cloud = Color32::from_rgb(235, 249, 252);
                    painter.circle_filled(c, r, cloud);
                    painter.circle_filled(c + Vec2::new(-18.0, 5.0), r * 0.7, cloud);
                    painter.circle_filled(c + Vec2::new(18.0, 6.0), r * 0.75, cloud);
                }
            }
        }
    }

    fn draw_platform(&self, painter: &egui::Painter, origin: Pos2, platform: &Platform) {
        let rect = Rect::from_min_size(
            origin + Vec2::new(platform.x, platform.y),
            Vec2::new(platform.width, 30.0),
        );

        if let Some(texture) = &self.platform_texture {
            painter.image(
                texture.id(),
                rect,
                Rect::from_min_max(Pos2::ZERO, Pos2::new(1.0, 1.0)),
                WHITE,
            );
        } else {
            painter.rect_filled(rect, 2.0, ROCK_FALLBACK);
            painter.line_segment(
                [rect.left_top(), rect.right_top()],
                Stroke::new(3.0, Color32::from_rgb(180, 180, 180)),
            );
        }
    }

    fn draw_player(&self, painter: &egui::Painter, origin: Pos2) {
        let draw_size = Vec2::new(45.0, 50.0);
        let draw_rect = Rect::from_min_size(
            origin + Vec2::new(self.player_x - 8.0, self.player_y - 5.0),
            draw_size,
        );

        if let Some(texture) = &self.player_texture {
            let uv = if self.flip {
                Rect::from_min_max(Pos2::new(1.0, 0.0), Pos2::new(0.0, 1.0))
            } else {
                Rect::from_min_max(Pos2::ZERO, Pos2::new(1.0, 1.0))
            };
            painter.image(texture.id(), draw_rect, uv, WHITE);
        } else {
            painter.rect_filled(draw_rect, 5.0, Color32::from_rgb(255, 220, 70));
            painter.circle_filled(draw_rect.center() + Vec2::new(-7.0, -4.0), 2.5, BLACK);
            painter.circle_filled(draw_rect.center() + Vec2::new(7.0, -4.0), 2.5, BLACK);
        }

        // Original Python draws a white outline around the collision rectangle.
        painter.rect_stroke(
            Rect::from_min_size(
                origin + Vec2::new(self.player_x, self.player_y),
                Vec2::new(self.player_w, self.player_h),
            ),
            0.0,
            Stroke::new(1.0, WHITE),
            egui::StrokeKind::Inside,
        );
    }

    fn draw_text(painter: &egui::Painter, pos: Pos2, text: impl ToString, size: f32, color: Color32) {
        painter.text(pos, Align2::LEFT_TOP, text.to_string(), FontId::proportional(size), color);
    }

    fn draw_game_over(&mut self, painter: &egui::Painter, rect: Rect) {
        if self.fade_counter < WIDTH {
            self.fade_counter += 5.0;
            for y in (0..6).step_by(2) {
                let top1 = y as f32 * 100.0;
                let top2 = (y + 1) as f32 * 100.0;
                painter.rect_filled(
                    Rect::from_min_size(
                        Pos2::new(rect.left(), rect.top() + top1),
                        Vec2::new(self.fade_counter, 100.0),
                    ),
                    0.0,
                    BLACK,
                );
                painter.rect_filled(
                    Rect::from_min_size(
                        Pos2::new(rect.right() - self.fade_counter, rect.top() + top2),
                        Vec2::new(self.fade_counter, 100.0),
                    ),
                    0.0,
                    BLACK,
                );
            }
        } else {
            Self::draw_text(
                painter,
                Pos2::new(rect.left() + 140.0, rect.top() + 200.0),
                "Game Over!",
                35.0,
                WHITE,
            );
            Self::draw_text(
                painter,
                Pos2::new(rect.left() + 140.0, rect.top() + 250.0),
                format!("Score: {}", self.score),
                35.0,
                WHITE,
            );
            Self::draw_text(
                painter,
                Pos2::new(rect.left() + 70.0, rect.top() + 300.0),
                "Press space to play again",
                24.0,
                WHITE,
            );
        }
    }
}

impl eframe::App for Jumpyly {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        if !self.assets_checked {
            self.cloud_texture = load_texture(ctx, "Jumpy/cloud.png", "cloud");
            self.player_texture = load_texture(ctx, "Jumpy/player.png", "player");
            self.platform_texture = load_texture(ctx, "Jumpy/rock.png", "platform");
            self.assets_checked = true;
        }

        let restart = ctx.input(|i| i.key_pressed(egui::Key::Space));
        self.update_game(ctx);

        if self.game_over && restart && self.fade_counter >= WIDTH {
            self.reset();
        }

        ctx.request_repaint_after(Duration::from_secs_f32(1.0 / FPS));

        egui::CentralPanel::default()
            .frame(egui::Frame::default().fill(SKY_FALLBACK).inner_margin(0.0))
            .show(ctx, |ui| {
                let (rect, _) = ui.allocate_exact_size(Vec2::new(WIDTH, HEIGHT), egui::Sense::hover());
                let painter = ui.painter_at(rect);

                self.draw_background(&painter, rect);

                for platform in &self.platforms {
                    self.draw_platform(&painter, rect.min, platform);
                }

                self.draw_player(&painter, rect.min);

                painter.rect_filled(
                    Rect::from_min_size(rect.min, Vec2::new(WIDTH, GRID_PANEL_HEIGHT)),
                    0.0,
                    PANEL,
                );
                painter.line_segment(
                    [
                        Pos2::new(rect.left(), rect.top() + GRID_PANEL_HEIGHT),
                        Pos2::new(rect.right(), rect.top() + GRID_PANEL_HEIGHT),
                    ],
                    Stroke::new(2.0, BLACK),
                );
                Self::draw_text(
                    &painter,
                    rect.min,
                    format!("Score: {}", self.score),
                    30.0,
                    BLACK,
                );

                let high_score_y = rect.top() + self.score as f32 - self.high_score as f32 + SCROLL_THRESHOLD;
                if high_score_y >= rect.top() && high_score_y <= rect.bottom() {
                    painter.line_segment(
                        [Pos2::new(rect.left(), high_score_y), Pos2::new(rect.right(), high_score_y)],
                        Stroke::new(1.0, BLACK),
                    );
                    Self::draw_text(
                        &painter,
                        Pos2::new(rect.right() - 130.0, high_score_y),
                        "high score",
                        30.0,
                        BLACK,
                    );
                }

                if self.game_over {
                    self.draw_game_over(&painter, rect);
                }
            });
    }
}

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title("Jumpyly")
            .with_inner_size([420.0, 620.0])
            .with_min_inner_size([420.0, 620.0]),
        ..Default::default()
    };

    eframe::run_native(
        "Jumpyly",
        options,
        Box::new(|_cc| Ok(Box::new(Jumpyly::default()))),
    )
}
