use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{self, Path};
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
pub struct TextDirectory {
    dir: String,
    path: String,
}

#[tauri::command]
pub fn get_text(text_directory: TextDirectory, app_handle: tauri::AppHandle) {
    let dir = format!(
        "{}{}.EBCode{}cache{}{}{}{}",
        dirs::home_dir().unwrap().to_str().unwrap(),
        path::MAIN_SEPARATOR,
        path::MAIN_SEPARATOR,
        path::MAIN_SEPARATOR,
        &text_directory.dir,
        path::MAIN_SEPARATOR,
        &text_directory.path
    );
    let p: &Path = Path::new(&dir);
    let lang = match p.extension() {
        Some(ext) => match ext.to_str() {
            Some("txt") => "txt",
            Some("html") => "html",
            Some("xhtml") => "html",
            Some("opf") => "html",
            Some("ncx") => "html",
            Some("xml") => "html",
            Some("htm") => "html",
            Some("css") => "css",
            Some("js") => "javascript",
            Some("json") => "json",
            _ => "txt",
        },
        None => "txt",
    };
    if p.exists() {
        let text = fs::read_to_string(p).unwrap();
        app_handle
            .emit("get-text", [&text, lang, &text_directory.path])
            .unwrap();
    } else {
        app_handle.emit("get-text-error", "获取失败").unwrap();
    }
}
