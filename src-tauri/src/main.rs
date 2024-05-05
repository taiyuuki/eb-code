// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod open;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open::open_epub])
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    tauri_quasar_lib::run()
}
