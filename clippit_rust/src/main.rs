
use eframe::egui::{
    self, Align, Color32, Layout, Pos2, Rect, RichText, Sense, Stroke, Vec2,
};
use rand::prelude::*;
use std::time::{Duration, Instant};

const BLUE: Color32 = Color32::from_rgb(0, 0, 128);
const PANEL: Color32 = Color32::from_rgb(212, 208, 200);
const WHITE: Color32 = Color32::WHITE;
const BACKDROP: Color32 = Color32::from_rgb(181, 204, 227);
const GREEN: Color32 = Color32::from_rgb(0, 128, 96);

#[derive(Clone)]
struct ChatLine {
    speaker: String,
    message: String,
}

#[derive(Clone, Copy)]
enum Expression {
    Happy,
    Thinking,
    Concerned,
    Surprised,
}

struct ClippitApp {
    input: String,
    speech: String,
    expression: Expression,
    chat: Vec<ChatLine>,
    animation_until: Option<Instant>,
    animation_frame: usize,
    last_animation_tick: Instant,
}

impl Default for ClippitApp {
    fn default() -> Self {
        let welcome =
            "It looks like you're using a computer. Would you like some help?".to_string();

        Self {
            input: String::new(),
            speech: welcome.clone(),
            expression: Expression::Happy,
            chat: vec![ChatLine {
                speaker: "Clippit".into(),
                message: welcome,
            }],
            animation_until: None,
            animation_frame: 0,
            last_animation_tick: Instant::now(),
        }
    }
}

impl ClippitApp {
    fn show_message(&mut self, message: impl Into<String>, expression: Expression) {
        let message = message.into();
        self.speech = message.clone();
        self.expression = expression;
        self.chat.push(ChatLine {
            speaker: "Clippit".into(),
            message,
        });
    }

    fn send(&mut self) {
        let question = self.input.trim().to_string();

        if question.is_empty() {
            return;
        }

        self.input.clear();

        self.chat.push(ChatLine {
            speaker: "You".into(),
            message: question.clone(),
        });

        let (answer, expression) = Self::respond(&question.to_lowercase());
        self.show_message(answer, expression);
    }

    fn respond(text: &str) -> (String, Expression) {
        if ["hello", "hi", "hey"].iter().any(|w| text.contains(w)) {
            (
                "Hello there! How can I help you today?".into(),
                Expression::Happy,
            )
        } else if ["python", "code", "program"]
            .iter()
            .any(|w| text.contains(w))
        {
            (
                "Ah, programming! Remember to test your code. If you encounter an error, read the traceback from the bottom up.".into(),
                Expression::Thinking,
            )
        } else if text.contains("help") || text.contains("what can you do") {
            (
                "I can offer basic tips about programming, writing, and using your computer. Choose a suggestion or ask me a question!".into(),
                Expression::Happy,
            )
        } else if text.contains("tip") || text.contains("advice") {
            let tips = [
                "Break a large task into small, testable steps.",
                "Save your work regularly. Losing code is no fun!",
                "Test one change at a time so bugs are easier to find.",
                "Keep your functions small and give variables meaningful names.",
            ];

            (
                tips.choose(&mut rand::rng())
                    .unwrap_or(&tips[0])
                    .to_string(),
                Expression::Thinking,
            )
        } else if ["letter", "resume", "writing"]
            .iter()
            .any(|w| text.contains(w))
        {
            (
                "It looks like you're writing something! Start with a clear purpose, organise your ideas, and proofread before finishing.".into(),
                Expression::Happy,
            )
        } else if text.contains("print") {
            (
                "Before printing, check the page layout and preview the document. That can save paper!".into(),
                Expression::Thinking,
            )
        } else if text.contains("greek") || text.contains("language") {
            (
                "For another language, check your operating system's keyboard and language settings.".into(),
                Expression::Happy,
            )
        } else if ["crash", "error", "bug", "broken"]
            .iter()
            .any(|w| text.contains(w))
        {
            (
                "It looks like something went wrong. Read the error message, find the line mentioned, and test the smallest fix first.".into(),
                Expression::Concerned,
            )
        } else if text.contains("bye") || text.contains("goodbye") {
            (
                "Goodbye! Remember to save your work.".into(),
                Expression::Happy,
            )
        } else {
            let responses = [
                "It looks like you're writing a letter. Would you like help?",
                "It looks like you're trying to write a resume. Would you like some help?",
                "It looks like you're trying to print a document. Would you like some help?",
                "Would you like help with that?",
                "You seem to be typing in Greek. Do you want me to turn on Greek language support?",
            ];

            (
                responses
                    .choose(&mut rand::rng())
                    .unwrap_or(&responses[3])
                    .to_string(),
                Expression::Surprised,
            )
        }
    }

    fn start_animation(&mut self) {
        self.animation_until = Some(Instant::now() + Duration::from_secs(4));
        self.animation_frame = 0;
        self.last_animation_tick = Instant::now();

        self.show_message(
            "Hello! I'm Clippit, your office assistant.",
            Expression::Happy,
        );
    }

    fn suggestion(&mut self, text: &str) {
        self.chat.push(ChatLine {
            speaker: "You".into(),
            message: text.into(),
        });

        let (answer, expression) = Self::respond(text);
        self.show_message(answer, expression);
    }

    fn draw_character(ui: &mut egui::Ui, expression: Expression, frame: usize) {
        let (rect, _) =
            ui.allocate_exact_size(Vec2::new(260.0, 290.0), Sense::hover());

        let painter = ui.painter_at(rect);
        painter.rect_filled(rect, 4.0, BACKDROP);

        let cx = rect.center().x;
        let cy = rect.center().y
            + 12.0
            + if frame % 2 == 0 { 2.0 } else { -2.0 };

        // Stylised metallic paperclip.
        let points = [
            Pos2::new(cx - 35.0, cy - 75.0),
            Pos2::new(cx - 35.0, cy + 48.0),
            Pos2::new(cx - 25.0, cy + 72.0),
            Pos2::new(cx - 4.0, cy + 81.0),
            Pos2::new(cx + 15.0, cy + 58.0),
            Pos2::new(cx + 15.0, cy - 55.0),
        ];

        for pair in points.windows(2) {
            painter.line_segment(
                [pair[0], pair[1]],
                Stroke::new(18.0_f32, Color32::from_rgb(66, 78, 91)),
            );

            painter.line_segment(
                [pair[0], pair[1]],
                Stroke::new(11.0_f32, Color32::from_rgb(200, 214, 229)),
            );
        }

        painter.line_segment(
            [
                Pos2::new(cx - 39.0, cy - 72.0),
                Pos2::new(cx - 39.0, cy + 48.0),
            ],
            Stroke::new(3.0_f32, WHITE),
        );

        // Face.
        let face = Rect::from_min_max(
            Pos2::new(cx - 63.0, cy - 62.0),
            Pos2::new(cx + 57.0, cy + 4.0),
        );

        painter.rect_filled(face, 24.0, Color32::from_rgb(220, 231, 242));

        painter.rect_stroke(
            face,
            24.0,
            Stroke::new(3.0_f32, Color32::from_rgb(82, 100, 118)),
            egui::StrokeKind::Inside,
        );

        // Eyes and blinking.
        let blinking = frame % 8 == 0;

        for ex in [cx - 29.0, cx + 26.0] {
            if blinking {
                painter.line_segment(
                    [
                        Pos2::new(ex - 10.0, cy - 28.0),
                        Pos2::new(ex + 10.0, cy - 28.0),
                    ],
                    Stroke::new(4.0_f32, Color32::from_rgb(23, 37, 56)),
                );
            } else {
                let eye = Rect::from_min_max(
                    Pos2::new(ex - 13.0, cy - 44.0),
                    Pos2::new(ex + 13.0, cy - 12.0),
                );

                painter.rect_filled(eye, 12.0, WHITE);

                painter.rect_stroke(
                    eye,
                    12.0,
                    Stroke::new(2.0_f32, Color32::from_rgb(59, 70, 82)),
                    egui::StrokeKind::Inside,
                );

                let offset = if frame % 4 < 2 { 2.0 } else { -2.0 };

                painter.circle_filled(
                    Pos2::new(ex + offset, cy - 26.0),
                    5.0,
                    Color32::from_rgb(21, 35, 56),
                );
            }
        }

        // IMPORTANT FIX:
        // Every match arm now returns (), so their types match.
        match expression {
            Expression::Surprised => {
                painter.circle_filled(
                    Pos2::new(cx, cy + 2.0),
                    7.0,
                    Color32::from_rgb(36, 49, 66),
                );
            }

            Expression::Concerned => {
                draw_polyline(
                    &painter,
                    &[
                        Pos2::new(cx - 14.0, cy + 9.0),
                        Pos2::new(cx - 7.0, cy + 4.0),
                        Pos2::new(cx, cy + 3.0),
                        Pos2::new(cx + 7.0, cy + 4.0),
                        Pos2::new(cx + 14.0, cy + 9.0),
                    ],
                    Stroke::new(3.0_f32, Color32::from_rgb(36, 49, 66)),
                );
            }

            _ => {
                draw_polyline(
                    &painter,
                    &[
                        Pos2::new(cx - 15.0, cy - 3.0),
                        Pos2::new(cx - 9.0, cy + 5.0),
                        Pos2::new(cx, cy + 8.0),
                        Pos2::new(cx + 9.0, cy + 5.0),
                        Pos2::new(cx + 15.0, cy - 3.0),
                    ],
                    Stroke::new(3.0_f32, Color32::from_rgb(36, 49, 66)),
                );
            }
        }

        // Decorative paperclip details.
        painter.line_segment(
            [
                Pos2::new(cx - 51.0, cy + 18.0),
                Pos2::new(cx - 51.0, cy + 46.0),
            ],
            Stroke::new(3.0_f32, Color32::from_rgb(247, 251, 255)),
        );

        painter.line_segment(
            [
                Pos2::new(cx + 28.0, cy + 30.0),
                Pos2::new(cx + 28.0, cy + 49.0),
            ],
            Stroke::new(3.0_f32, Color32::from_rgb(247, 251, 255)),
        );
    }
}

fn draw_polyline(painter: &egui::Painter, points: &[Pos2], stroke: Stroke) {
    for pair in points.windows(2) {
        painter.line_segment([pair[0], pair[1]], stroke);
    }
}

impl eframe::App for ClippitApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        if self
            .animation_until
            .is_some_and(|until| Instant::now() < until)
        {
            if self.last_animation_tick.elapsed() >= Duration::from_millis(350) {
                self.animation_frame += 1;
                self.last_animation_tick = Instant::now();
            }

            ctx.request_repaint_after(Duration::from_millis(80));
        } else {
            self.animation_until = None;
        }

        // Retro title bar.
        egui::TopBottomPanel::top("title_bar")
            .frame(egui::Frame::default().fill(BLUE).inner_margin(8.0))
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    ui.label(
                        RichText::new("📎 Microsoft Office Assistant - Clippit")
                            .color(WHITE)
                            .strong()
                            .size(18.0),
                    );

                    ui.with_layout(
                        Layout::right_to_left(Align::Center),
                        |ui| {
                            if ui.button("About").clicked() {
                                self.show_message(
                                    "Clippit — a retro-inspired assistant built in Rust with egui.",
                                    Expression::Happy,
                                );
                            }

                            if ui.button("Help").clicked() {
                                self.show_message(
                                    "Type a message and press Enter or Send. Use suggestions for quick prompts, or Animate to see me blink.",
                                    Expression::Thinking,
                                );
                            }
                        },
                    );
                });
            });

        egui::CentralPanel::default()
            .frame(
                egui::Frame::default()
                    .fill(PANEL)
                    .inner_margin(10.0),
            )
            .show(ctx, |ui| {
                ui.columns(2, |columns| {
                    // Left column: Clippit and speech bubble.
                    let left = &mut columns[0];

                    left.heading(
                        RichText::new("YOUR OFFICE ASSISTANT")
                            .color(BLUE)
                            .strong(),
                    );

                    left.add_space(5.0);

                    egui::Frame::group(left.style())
                        .fill(Color32::from_rgb(255, 248, 216))
                        .show(left, |ui| {
                            ui.set_min_height(82.0);

                            ui.label(
                                RichText::new(&self.speech)
                                    .color(Color32::from_rgb(34, 34, 34))
                                    .size(14.0),
                            );
                        });

                    left.add_space(8.0);

                    Self::draw_character(
                        left,
                        self.expression,
                        self.animation_frame,
                    );

                    // Right column: conversation and controls.
                    let right = &mut columns[1];

                    right.heading(
                        RichText::new("Let's Talk")
                            .color(BLUE)
                            .strong(),
                    );

                    egui::Frame::group(right.style())
                        .fill(WHITE)
                        .show(right, |ui| {
                            ui.set_min_height(220.0);

                            egui::ScrollArea::vertical()
                                .stick_to_bottom(true)
                                .show(ui, |ui| {
                                    for line in &self.chat {
                                        let color = if line.speaker == "Clippit" {
                                            Color32::from_rgb(0, 51, 153)
                                        } else {
                                            GREEN
                                        };

                                        ui.label(
                                            RichText::new(format!("{}:", line.speaker))
                                                .color(color)
                                                .strong(),
                                        );

                                        ui.label(&line.message);
                                        ui.add_space(5.0);
                                    }
                                });
                        });

                    right.add_space(8.0);

                    right.heading(
                        RichText::new("Suggestions")
                            .color(BLUE)
                            .strong(),
                    );

                    egui::Grid::new("suggestions_grid")
                        .num_columns(2)
                        .spacing([6.0, 6.0])
                        .show(right, |ui| {
                            if ui.button("Help me with Python").clicked() {
                                self.suggestion("python");
                            }

                            if ui.button("Give me a random tip").clicked() {
                                self.suggestion("tip");
                            }

                            ui.end_row();

                            if ui.button("Help with writing").clicked() {
                                self.suggestion("letter");
                            }

                            if ui.button("What can you do?").clicked() {
                                self.suggestion("help");
                            }
                        });

                    right.add_space(8.0);
                    right.label(RichText::new("Type a message").strong());

                    let input_response = right.add(
                        egui::TextEdit::singleline(&mut self.input)
                            .hint_text("Ask Clippit...")
                            .desired_width(f32::INFINITY)
                            .id(egui::Id::new("clippit_input")),
                    );

                    let enter = input_response.lost_focus()
                        && ctx.input(|i| i.key_pressed(egui::Key::Enter));

                    if enter {
                        self.send();
                    }

                    if right.button(RichText::new("Send").strong()).clicked() {
                        self.send();
                    }
                });

                ui.separator();

                ui.horizontal(|ui| {
                    if ui.button("▶ Animate").clicked() {
                        self.start_animation();
                    }

                    if ui.button("💬 Talk").clicked() {
                        ctx.memory_mut(|m| {
                            m.request_focus(egui::Id::new("clippit_input"));
                        });
                    }

                    if ui.button("❔ Help").clicked() {
                        self.show_message(
                            "Welcome to Clippit! Type a question, use the suggestions, or press Animate. I'm a demo assistant and may not understand every question.",
                            Expression::Thinking,
                        );
                    }

                    if ui.button("✖ Exit").clicked() {
                        ctx.send_viewport_cmd(
                            egui::ViewportCommand::Close,
                        );
                    }
                });
            });
    }
}

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title("Microsoft Office Assistant - Clippit")
            .with_inner_size([900.0, 650.0])
            .with_min_inner_size([760.0, 560.0]),
        ..Default::default()
    };

    eframe::run_native(
        "Clippit",
        options,
        Box::new(|_cc| Ok(Box::new(ClippitApp::default()))),
    )
}
