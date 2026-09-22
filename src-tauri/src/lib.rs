mod files;

use std::sync::Mutex;
use tauri::{Emitter, Manager};

struct LaunchState {
    path: Mutex<Option<String>>,
}

fn document_path_from_args(args: &[String]) -> Option<String> {
    args.iter()
        .skip(1)
        .map(|arg| arg.trim().trim_matches('"'))
        .find(|arg| {
            if arg.is_empty() || arg.starts_with('-') {
                return false;
            }
            let lower = arg.to_ascii_lowercase();
            lower.ends_with(".docx")
                || lower.ends_with(".txt")
                || lower.ends_with(".md")
                || lower.ends_with(".markdown")
        })
        .map(ToString::to_string)
}

fn focus_main(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[tauri::command]
fn take_launch_path(state: tauri::State<LaunchState>) -> Option<String> {
    state.path.lock().ok()?.clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(path) = document_path_from_args(&argv) {
                let _ = app.emit("open-file", path);
            }
            focus_main(app);
        }))
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            app.manage(LaunchState {
                path: Mutex::new(document_path_from_args(&args)),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            files::read_file_b64,
            files::write_file_b64,
            take_launch_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running Doclight");
}
