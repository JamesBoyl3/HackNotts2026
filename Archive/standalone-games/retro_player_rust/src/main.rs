use eframe::egui::{self, Align, Color32, Layout, RichText, ScrollArea, Vec2};
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink, Source};
use std::{
    fs::File,
    io::BufReader,
    path::{Path, PathBuf},
    time::{Duration, Instant},
};

const BG: Color32 = Color32::from_rgb(23, 23, 23);
const PANEL: Color32 = Color32::from_rgb(37, 37, 37);
const GREEN: Color32 = Color32::from_rgb(124, 255, 107);
const DIM_GREEN: Color32 = Color32::from_rgb(57, 125, 54);
const WHITE: Color32 = Color32::from_rgb(230, 230, 230);
const GREY: Color32 = Color32::from_rgb(136, 136, 136);
const ORANGE: Color32 = Color32::from_rgb(255, 179, 71);
const SCREEN: Color32 = Color32::from_rgb(5, 9, 5);

#[derive(Clone, Copy, PartialEq, Eq)]
enum PlaybackState {
    Ready,
    Playing,
    Paused,
    Stopped,
    Error,
}

struct RetroPlayer {
    playlist: Vec<PathBuf>,
    current_index: Option<usize>,
    state: PlaybackState,
    status_message: String,
    stream: Option<OutputStream>,
    stream_handle: Option<OutputStreamHandle>,
    sink: Option<Sink>,
    track_duration: Option<Duration>,
    track_started: Option<Instant>,
    elapsed_before_pause: Duration,
    last_error: Option<String>,
}

impl Default for RetroPlayer {
    fn default() -> Self {
        let (stream, stream_handle, status_message) =
            match OutputStream::try_default() {
                Ok((stream, handle)) => (Some(stream), Some(handle), "READY".to_string()),
                Err(error) => (
                    None,
                    None,
                    format!("AUDIO UNAVAILABLE: {error}"),
                ),
            };

        Self {
            playlist: Vec::new(),
            current_index: None,
            state: PlaybackState::Ready,
            status_message,
            stream,
            stream_handle,
            sink: None,
            track_duration: None,
            track_started: None,
            elapsed_before_pause: Duration::ZERO,
            last_error: None,
        }
    }
}

impl RetroPlayer {
    fn add_files(&mut self) {
        let files = rfd::FileDialog::new()
            .set_title("Select audio files")
            .add_filter("Audio files", &["mp3", "wav", "ogg", "oga"])
            .add_filter("MP3 audio", &["mp3"])
            .pick_files();

        if let Some(files) = files {
            for file in files {
                if !self.playlist.contains(&file) {
                    self.playlist.push(file);
                }
            }
            if self.playlist.is_empty() {
                self.status_message = "READY".into();
            }
        }
    }

    fn play_index(&mut self, index: usize) {
        if index >= self.playlist.len() {
            return;
        }

        let Some(handle) = self.stream_handle.as_ref() else {
            self.state = PlaybackState::Error;
            self.status_message =
                "AUDIO UNAVAILABLE — CHECK YOUR OUTPUT DEVICE".into();
            return;
        };

        let path = self.playlist[index].clone();
        let file = match File::open(&path) {
            Ok(file) => file,
            Err(error) => {
                self.fail(format!("Could not open file: {error}"));
                return;
            }
        };

        let decoder = match Decoder::new(BufReader::new(file)) {
            Ok(decoder) => decoder,
            Err(error) => {
                self.fail(format!("Could not decode audio: {error}"));
                return;
            }
        };

        self.track_duration = decoder.total_duration();
        let sink = match Sink::try_new(handle) {
            Ok(sink) => sink,
            Err(error) => {
                self.fail(format!("Could not start audio: {error}"));
                return;
            }
        };

        sink.append(decoder);
        self.sink = Some(sink);
        self.current_index = Some(index);
        self.state = PlaybackState::Playing;
        self.status_message = "PLAYING".into();
        self.track_started = Some(Instant::now());
        self.elapsed_before_pause = Duration::ZERO;
        self.last_error = None;
    }

    fn fail(&mut self, message: String) {
        self.state = PlaybackState::Error;
        self.status_message = "PLAYBACK ERROR".into();
        self.last_error = Some(message);
        self.sink = None;
    }

    fn toggle_pause(&mut self) {
        match self.state {
            PlaybackState::Playing => {
                if let Some(sink) = &self.sink {
                    self.elapsed_before_pause =
                        self.elapsed_duration().unwrap_or(Duration::ZERO);
                    sink.pause();
                    self.state = PlaybackState::Paused;
                    self.status_message = "PAUSED".into();
                }
            }
            PlaybackState::Paused => {
                if let Some(sink) = &self.sink {
                    sink.play();
                    self.track_started = Some(Instant::now());
                    self.state = PlaybackState::Playing;
                    self.status_message = "PLAYING".into();
                }
            }
            _ => {
                if let Some(index) = self.current_index {
                    self.play_index(index);
                } else if !self.playlist.is_empty() {
                    self.play_index(0);
                } else {
                    self.add_files();
                    if !self.playlist.is_empty() {
                        self.play_index(0);
                    }
                }
            }
        }
    }

    fn stop(&mut self) {
        if let Some(sink) = self.sink.take() {
            sink.stop();
        }
        self.state = PlaybackState::Stopped;
        self.status_message = "STOPPED".into();
        self.track_started = None;
        self.elapsed_before_pause = Duration::ZERO;
    }

    fn next(&mut self) {
        if self.playlist.is_empty() {
            return;
        }
        let next = self.current_index.map_or(0, |i| (i + 1) % self.playlist.len());
        self.play_index(next);
    }

    fn previous(&mut self) {
        if self.playlist.is_empty() {
            return;
        }
        let previous = self.current_index.map_or(0, |i| {
            if i == 0 { self.playlist.len() - 1 } else { i - 1 }
        });
        self.play_index(previous);
    }

    fn remove_selected(&mut self, index: usize) {
        if index >= self.playlist.len() {
            return;
        }

        if self.current_index == Some(index) {
            self.stop();
            self.current_index = None;
        } else if let Some(current) = self.current_index {
            if index < current {
                self.current_index = Some(current - 1);
            }
        }

        self.playlist.remove(index);
        if self.playlist.is_empty() {
            self.current_index = None;
            self.state = PlaybackState::Ready;
            self.status_message = "READY".into();
            self.track_duration = None;
        }
    }

    fn elapsed_duration(&self) -> Option<Duration> {
        match self.state {
            PlaybackState::Paused => Some(self.elapsed_before_pause),
            PlaybackState::Playing => Some(
                self.elapsed_before_pause
                    + self.track_started.map(|t| t.elapsed()).unwrap_or_default(),
            ),
            _ => None,
        }
    }

    fn current_title(&self) -> String {
        self.current_index
            .and_then(|i| self.playlist.get(i))
            .and_then(|p| p.file_name())
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "NO TRACK LOADED".into())
    }

    fn tick(&mut self) {
        let finished = self.state == PlaybackState::Playing
            && self.sink.as_ref().is_some_and(|sink| sink.empty());

        if finished {
            if let Some(index) = self.current_index {
                if index + 1 < self.playlist.len() {
                    self.play_index(index + 1);
                } else {
                    self.state = PlaybackState::Stopped;
                    self.status_message = "PLAYLIST FINISHED".into();
                    self.track_started = None;
                }
            }
        }
    }
}

fn format_time(duration: Duration) -> String {
    let seconds = duration.as_secs();
    format!("{:02}:{:02}", seconds / 60, seconds % 60)
}

fn filename(path: &Path) -> String {
    path.file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string())
}

impl eframe::App for RetroPlayer {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.tick();
        ctx.request_repaint_after(Duration::from_millis(250));

        egui::TopBottomPanel::top("title_bar")
            .frame(egui::Frame::default().fill(Color32::from_rgb(48, 48, 48)).inner_margin(10.0))
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    ui.label(
                        RichText::new("◆ RETRO PLAYER 1999")
                            .color(GREEN)
                            .strong()
                            .monospace()
                            .size(17.0),
                    );
                    ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
                        ui.label(RichText::new("MP3").color(WHITE).strong().monospace());
                    });
                });
            });

        egui::CentralPanel::default()
            .frame(egui::Frame::default().fill(BG).inner_margin(12.0))
            .show(ctx, |ui| {
                // LCD-style track display.
                egui::Frame::group(ui.style())
                    .fill(SCREEN)
                    .stroke(egui::Stroke::new(2.0, DIM_GREEN))
                    .inner_margin(12.0)
                    .show(ui, |ui| {
                        ui.label(
                            RichText::new(self.current_title())
                                .color(GREEN)
                                .strong()
                                .monospace()
                                .size(16.0),
                        );
                        ui.add_space(3.0);

                        let status_color = match self.state {
                            PlaybackState::Playing => GREEN,
                            PlaybackState::Paused | PlaybackState::Error => ORANGE,
                            _ => GREY,
                        };

                        ui.label(
                            RichText::new(&self.status_message)
                                .color(status_color)
                                .monospace(),
                        );

                        let elapsed = self.elapsed_duration().unwrap_or_default();
                        let progress = match (self.track_duration, self.state) {
                            (Some(total), _) if total.as_secs_f32() > 0.0 => {
                                (elapsed.as_secs_f32() / total.as_secs_f32()).clamp(0.0, 1.0)
                            }
                            _ => 0.0,
                        };

                        ui.add_space(8.0);
                        ui.add(
                            egui::ProgressBar::new(progress)
                                .fill(GREEN)
                                .text(format!(
                                    "{} / {}",
                                    format_time(elapsed),
                                    self.track_duration.map(format_time).unwrap_or_else(|| "--:--".into())
                                )),
                        );

                        ui.add_space(8.0);
                        let available = ui.available_width();
                        let bars = 26;
                        let gap = 3.0;
                        let bar_width = ((available - gap * (bars as f32 - 1.0)) / bars as f32).max(2.0);
                        let (rect, _) = ui.allocate_exact_size(
                            Vec2::new(available, 34.0),
                            egui::Sense::hover(),
                        );
                        let painter = ui.painter_at(rect);
                        let heights = [7.0, 12.0, 19.0, 11.0, 24.0, 15.0, 8.0, 20.0];
                        for i in 0..bars {
                            let active_height = heights[(i + (elapsed.as_secs() as usize % 8)) % heights.len()];
                            let height = if self.state == PlaybackState::Playing {
                                active_height
                            } else {
                                heights[i % heights.len()] * 0.65
                            };
                            let x = rect.left() + i as f32 * (bar_width + gap);
                            let bar_rect = egui::Rect::from_min_size(
                                egui::pos2(x, rect.bottom() - height),
                                Vec2::new(bar_width, height),
                            );
                            painter.rect_filled(
                                bar_rect,
                                1.0,
                                if i % 4 == 0 { DIM_GREEN } else { GREEN },
                            );
                        }
                    });

                ui.add_space(8.0);

                ui.horizontal(|ui| {
                    if ui.button(RichText::new("|◀").color(GREEN).monospace().strong()).clicked() {
                        self.previous();
                    }
                    let play_text = if self.state == PlaybackState::Playing { "❚❚" } else { "▶" };
                    if ui.button(RichText::new(play_text).color(GREEN).monospace().strong()).clicked() {
                        self.toggle_pause();
                    }
                    if ui.button(RichText::new("■").color(GREEN).monospace().strong()).clicked() {
                        self.stop();
                    }
                    if ui.button(RichText::new("▶|").color(GREEN).monospace().strong()).clicked() {
                        self.next();
                    }
                    ui.separator();
                    ui.label(RichText::new("RETRO AUDIO SYSTEM").color(GREY).monospace().small());
                });

                ui.add_space(10.0);

                ui.horizontal(|ui| {
                    ui.label(RichText::new("PLAYLIST").color(WHITE).strong().monospace());
                    ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
                        ui.label(RichText::new("SELECT A TRACK TO PLAY").color(GREY).monospace().small());
                    });
                });

                ui.add_space(4.0);

                egui::Frame::group(ui.style())
                    .fill(Color32::from_rgb(8, 8, 8))
                    .stroke(egui::Stroke::new(1.0, Color32::from_rgb(85, 85, 85)))
                    .inner_margin(5.0)
                    .show(ui, |ui| {
                        ScrollArea::vertical().max_height(230.0).show(ui, |ui| {
                            if self.playlist.is_empty() {
                                ui.label(RichText::new("  Playlist is empty. Add some audio files below.").color(GREY).monospace());
                            }

                            let mut play_clicked = None;
                            let mut remove_clicked = None;

                            for (index, path) in self.playlist.iter().enumerate() {
                                let selected = self.current_index == Some(index);
                                let title = filename(path);

                                let row = ui.horizontal(|ui| {
                                    let marker = if selected { "▶" } else { " " };
                                    ui.label(
                                        RichText::new(marker)
                                            .color(if selected { GREEN } else { GREY })
                                            .monospace(),
                                    );

                                    let label = if selected {
                                        RichText::new(title).color(GREEN).strong().monospace()
                                    } else {
                                        RichText::new(title).color(WHITE).monospace()
                                    };

                                    let response = ui.selectable_label(selected, label);
                                    if response.double_clicked() {
                                        play_clicked = Some(index);
                                    }

                                    if response.clicked() {
                                        // Single click selects; double-click plays.
                                    }

                                    if ui.small_button("×").clicked() {
                                        remove_clicked = Some(index);
                                    }
                                });

                                let _ = row;
                            }

                            if let Some(index) = remove_clicked {
                                self.remove_selected(index);
                            } else if let Some(index) = play_clicked {
                                self.play_index(index);
                            }
                        });
                    });

                ui.add_space(10.0);

                ui.horizontal(|ui| {
                    if ui.button(RichText::new("+ ADD AUDIO").color(GREEN).strong().monospace()).clicked() {
                        self.add_files();
                    }
                    if ui.button(RichText::new("REMOVE SELECTED").color(WHITE).monospace()).clicked() {
                        // A row's × button removes a specific track. This button removes the current track.
                        if let Some(index) = self.current_index {
                            self.remove_selected(index);
                        }
                    }
                    if ui.button(RichText::new("CLEAR PLAYLIST").color(ORANGE).monospace()).clicked() {
                        self.stop();
                        self.playlist.clear();
                        self.current_index = None;
                        self.track_duration = None;
                        self.state = PlaybackState::Ready;
                        self.status_message = "READY".into();
                    }
                });

                if let Some(error) = &self.last_error {
                    ui.add_space(6.0);
                    ui.label(RichText::new(error).color(ORANGE).small());
                }
            });
    }
}

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title("Retro Player 1999")
            .with_inner_size([600.0, 700.0])
            .with_min_inner_size([500.0, 600.0]),
        ..Default::default()
    };

    eframe::run_native(
        "Retro Player 1999",
        options,
        Box::new(|_cc| Ok(Box::new(RetroPlayer::default()))),
    )
}
