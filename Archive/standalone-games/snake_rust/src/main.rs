use eframe::egui::{self, Align2, Color32, FontId, Pos2, Rect, Stroke, Vec2};
use rand::prelude::*;
use std::time::{Duration, Instant};

const BACKGROUND_COLOR: Color32 = Color32::from_rgb(10, 10, 10);
const GRID_COLOR: Color32 = Color32::from_rgb(34, 34, 34);
const SNAKE_COLOR: Color32 = Color32::from_rgb(130, 222, 137);
const FOOD_COLOR: Color32 = Color32::from_rgb(255, 85, 85);
const TEXT_COLOR: Color32 = Color32::WHITE;
const HEAD_COLOR: Color32 = Color32::from_rgb(181, 255, 188);

const GRID_WIDTH: i32 = 10;
const GRID_HEIGHT: i32 = 10;
const CELL_SIZE: f32 = 50.0;
const GAME_SPEED_MS: u64 = 200; // 5 moves per second

#[derive(Clone, Copy, PartialEq, Eq)]
enum Direction {
    Up,
    Down,
    Left,
    Right,
}

impl Direction {
    fn opposite(self) -> Self {
        match self {
            Self::Up => Self::Down,
            Self::Down => Self::Up,
            Self::Left => Self::Right,
            Self::Right => Self::Left,
        }
    }

    fn delta(self) -> (i32, i32) {
        match self {
            Self::Up => (0, -1),
            Self::Down => (0, 1),
            Self::Left => (-1, 0),
            Self::Right => (1, 0),
        }
    }
}

struct SnakeGame {
    snake: Vec<(i32, i32)>,
    current_direction: Direction,
    next_direction: Direction,
    food: Option<(i32, i32)>,
    score: u32,
    running: bool,
    game_over: bool,
    won: bool,
    last_step: Instant,
}

impl Default for SnakeGame {
    fn default() -> Self {
        let mut game = Self {
            snake: Vec::new(),
            current_direction: Direction::Right,
            next_direction: Direction::Right,
            food: None,
            score: 0,
            running: false,
            game_over: false,
            won: false,
            last_step: Instant::now(),
        };
        game.reset();
        game
    }
}

impl SnakeGame {
    fn reset(&mut self) {
        self.snake = vec![(4, 4), (3, 4), (2, 4)];
        self.current_direction = Direction::Right;
        self.next_direction = Direction::Right;
        self.score = 0;
        self.running = true;
        self.game_over = false;
        self.won = false;
        self.last_step = Instant::now();
        self.create_food();
    }

    fn create_food(&mut self) {
        let empty: Vec<(i32, i32)> = (0..GRID_WIDTH)
            .flat_map(|x| (0..GRID_HEIGHT).map(move |y| (x, y)))
            .filter(|cell| !self.snake.contains(cell))
            .collect();

        if empty.is_empty() {
            self.food = None;
            self.end_game(true);
        } else {
            self.food = Some(*empty.choose(&mut rand::rng()).unwrap());
        }
    }

    fn request_direction(&mut self, direction: Direction) {
        if direction != self.current_direction.opposite() {
            self.next_direction = direction;
        }
    }

    fn step(&mut self) {
        if !self.running {
            return;
        }

        self.current_direction = self.next_direction;
        let (dx, dy) = self.current_direction.delta();
        let (head_x, head_y) = self.snake[0];
        let new_head = (head_x + dx, head_y + dy);
        let eating = Some(new_head) == self.food;

        // Moving into the current tail is legal if the snake is not eating,
        // because the tail moves away during this step.
        let collision_body = if eating {
            self.snake.as_slice()
        } else {
            &self.snake[..self.snake.len().saturating_sub(1)]
        };

        if new_head.0 < 0
            || new_head.0 >= GRID_WIDTH
            || new_head.1 < 0
            || new_head.1 >= GRID_HEIGHT
            || collision_body.contains(&new_head)
        {
            self.end_game(false);
            return;
        }

        self.snake.insert(0, new_head);

        if eating {
            self.score += 10;
            self.create_food();
        } else {
            self.snake.pop();
        }
    }

    fn end_game(&mut self, won: bool) {
        self.running = false;
        self.game_over = true;
        self.won = won;
    }

    fn handle_keyboard(&mut self, ctx: &egui::Context) {
        ctx.input(|input| {
            let requested = if input.key_pressed(egui::Key::ArrowUp)
                || input.key_pressed(egui::Key::W)
            {
                Some(Direction::Up)
            } else if input.key_pressed(egui::Key::ArrowDown)
                || input.key_pressed(egui::Key::S)
            {
                Some(Direction::Down)
            } else if input.key_pressed(egui::Key::ArrowLeft)
                || input.key_pressed(egui::Key::A)
            {
                Some(Direction::Left)
            } else if input.key_pressed(egui::Key::ArrowRight)
                || input.key_pressed(egui::Key::D)
            {
                Some(Direction::Right)
            } else {
                None
            };

            if let Some(direction) = requested {
                self.request_direction(direction);
            }
        });
    }

    fn draw_board(&self, ui: &mut egui::Ui) {
        let board_size = Vec2::new(
            GRID_WIDTH as f32 * CELL_SIZE,
            GRID_HEIGHT as f32 * CELL_SIZE,
        );
        let (rect, _) = ui.allocate_exact_size(board_size, egui::Sense::hover());
        let painter = ui.painter_at(rect);

        painter.rect_filled(rect, 0.0, BACKGROUND_COLOR);

        for x in 0..=GRID_WIDTH {
            let x_pos = rect.left() + x as f32 * CELL_SIZE;
            painter.line_segment(
                [
                    Pos2::new(x_pos, rect.top()),
                    Pos2::new(x_pos, rect.bottom()),
                ],
                Stroke::new(1.0, GRID_COLOR),
            );
        }

        for y in 0..=GRID_HEIGHT {
            let y_pos = rect.top() + y as f32 * CELL_SIZE;
            painter.line_segment(
                [
                    Pos2::new(rect.left(), y_pos),
                    Pos2::new(rect.right(), y_pos),
                ],
                Stroke::new(1.0, GRID_COLOR),
            );
        }

        if let Some((food_x, food_y)) = self.food {
            let cell = Rect::from_min_size(
                Pos2::new(
                    rect.left() + food_x as f32 * CELL_SIZE,
                    rect.top() + food_y as f32 * CELL_SIZE,
                ),
                Vec2::splat(CELL_SIZE),
            );
            painter.circle_filled(cell.center(), CELL_SIZE * 0.28, FOOD_COLOR);
        }

        for (index, &(x, y)) in self.snake.iter().enumerate() {
            let padding = 3.0;
            let cell = Rect::from_min_max(
                Pos2::new(
                    rect.left() + x as f32 * CELL_SIZE + padding,
                    rect.top() + y as f32 * CELL_SIZE + padding,
                ),
                Pos2::new(
                    rect.left() + (x + 1) as f32 * CELL_SIZE - padding,
                    rect.top() + (y + 1) as f32 * CELL_SIZE - padding,
                ),
            );

            painter.rect_filled(
                cell,
                4.0,
                if index == 0 { HEAD_COLOR } else { SNAKE_COLOR },
            );
        }

        if self.game_over {
            painter.rect_filled(
                rect.shrink(24.0),
                8.0,
                Color32::from_rgba_unmultiplied(17, 17, 17, 235),
            );
            painter.rect_stroke(
                rect.shrink(24.0),
                8.0,
                Stroke::new(3.0, SNAKE_COLOR),
                egui::StrokeKind::Inside,
            );

            let title = if self.won { "YOU WIN!" } else { "GAME OVER" };
            painter.text(
                Pos2::new(rect.center().x, rect.center().y - 32.0),
                Align2::CENTER_CENTER,
                title,
                FontId::proportional(28.0),
                SNAKE_COLOR,
            );
            painter.text(
                Pos2::new(rect.center().x, rect.center().y + 4.0),
                Align2::CENTER_CENTER,
                format!("Final score: {}", self.score),
                FontId::proportional(18.0),
                TEXT_COLOR,
            );
            painter.text(
                Pos2::new(rect.center().x, rect.center().y + 38.0),
                Align2::CENTER_CENTER,
                "Press R to restart or Q to quit",
                FontId::proportional(13.0),
                Color32::from_rgb(170, 170, 170),
            );
        }
    }
}

impl eframe::App for SnakeGame {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.handle_keyboard(ctx);

        let quit_pressed = ctx.input(|input| input.key_pressed(egui::Key::Q));
        let restart_pressed = ctx.input(|input| input.key_pressed(egui::Key::R));

        if quit_pressed {
            ctx.send_viewport_cmd(egui::ViewportCommand::Close);
            return;
        }

        if restart_pressed && self.game_over {
            self.reset();
        }

        if self.running && self.last_step.elapsed() >= Duration::from_millis(GAME_SPEED_MS) {
            self.step();
            self.last_step = Instant::now();
        }

        ctx.request_repaint_after(Duration::from_millis(16));

        egui::CentralPanel::default()
            .frame(egui::Frame::default().fill(BACKGROUND_COLOR).inner_margin(10.0))
            .show(ctx, |ui| {
                ui.vertical_centered(|ui| {
                    ui.label(
                        egui::RichText::new(format!("SCORE: {}", self.score))
                            .color(TEXT_COLOR)
                            .strong()
                            .size(20.0),
                    );

                    ui.add_space(6.0);
                    self.draw_board(ui);
                    ui.add_space(6.0);

                    ui.label(
                        egui::RichText::new("Move: Arrow keys or WASD    |    Restart: R    |    Quit: Q")
                            .color(Color32::from_rgb(170, 170, 170))
                            .size(12.0),
                    );

                    if self.game_over && ui.button("Restart game").clicked() {
                        self.reset();
                    }
                });
            });
    }
}

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title("Snake Game")
            .with_inner_size([560.0, 600.0])
            .with_min_inner_size([540.0, 580.0]),
        ..Default::default()
    };

    eframe::run_native(
        "Snake Game",
        options,
        Box::new(|_cc| Ok(Box::new(SnakeGame::default()))),
    )
}
