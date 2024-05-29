// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env::args;

use tauri::Manager;

mod clean;
mod copy;
mod open;
mod read;
mod remove;
mod rename;
mod save;
mod search;
mod write;

#[tauri::command]
fn open_epub_on_setup(app_handle: tauri::AppHandle) {
    if let Some(path) = args().nth(1) {
        match open::un_zip(path.as_str()) {
            Ok(epub_content) => {
                app_handle.emit("setup-open", epub_content).unwrap();
            }
            Err(_e) => {
                app_handle.emit("setup-error", &path).unwrap();
            }
        };
    } else {
        app_handle.emit("setup-error", "0").unwrap();
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_epub_on_setup,
            open::open_epub,
            open::create_epub,
            read::get_text,
            write::write_text,
            clean::clean_cache,
            save::save_epub,
            remove::remove_file,
            copy::copy_file,
            rename::rename_file,
            search::find,
            search::replace,
        ])
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    ebcode_lib::run()
}
