mod files;

use std::sync::Mutex;
use tauri::{Emitter, Manager};

struct LaunchState {
    paths: Mutex<Vec<String>>,
}

fn document_paths_from_args(args: &[String]) -> Vec<String> {
    args.iter()
        .skip(1)
        .map(|arg| arg.trim().trim_matches('"'))
        .filter(|arg| {
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
        .collect()
}

fn focus_main(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[tauri::command]
fn take_launch_paths(state: tauri::State<LaunchState>) -> Vec<String> {
    state
        .paths
        .lock()
        .map(|mut paths| std::mem::take(&mut *paths))
        .unwrap_or_default()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            let paths = document_paths_from_args(&argv);
            if !paths.is_empty() {
                let _ = app.emit("open-files", paths);
            }
            focus_main(app);
        }))
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            app.manage(LaunchState {
                paths: Mutex::new(document_paths_from_args(&args)),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            files::read_file_b64,
            files::write_file_b64,
            take_launch_paths
        ])
        .run(tauri::generate_context!())
        .expect("error while running Doclight");
}
