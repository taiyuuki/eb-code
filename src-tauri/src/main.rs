// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod clean;
mod copy;
mod open;
mod read;
mod remove;
mod rename;
mod save;
// mod search;
mod write;

fn main() {
    // let _ = search::find();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open::open_epub,
            read::get_text,
            write::write_text,
            clean::clean_cache,
            save::save_epub,
            remove::remove_file,
            copy::copy_file,
            rename::rename_file,
        ])
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    ebcode_lib::run()
}
