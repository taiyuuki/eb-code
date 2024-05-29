// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use lazy_static::lazy_static;
use std::env::args;
use std::path::{self, Path, PathBuf};
use tauri::Manager;
use warp::Filter;

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

fn get_available_port() -> u16 {
    std::net::TcpListener::bind("0.0.0.0:0")
        .unwrap()
        .local_addr()
        .unwrap()
        .port()
}

lazy_static! {
    static ref FOLDER: PathBuf = {
        let folder = format!(
            "{}{}.EBCode{}cache",
            dirs::home_dir().unwrap().to_str().unwrap(),
            path::MAIN_SEPARATOR,
            path::MAIN_SEPARATOR
        );
        let path = Path::new(&folder);
        if !path.exists() {
            std::fs::create_dir_all(path).unwrap();
        }
        path.to_path_buf()
    };
    static ref PORT: u16 = get_available_port();
}

#[tauri::command]
fn get_port(app_handle: tauri::AppHandle) {
    app_handle.emit("port", *PORT).unwrap();
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            tauri::async_runtime::spawn(async move {
                let api = warp::path("static").and(warp::fs::dir(FOLDER.as_ref() as &Path));
                let server = warp::serve(api);
                server.run(([127, 0, 0, 1], *PORT as u16)).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_port,
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
    ebcode_lib::run();
}
