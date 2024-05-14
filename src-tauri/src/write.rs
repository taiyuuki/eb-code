use serde::{Deserialize, Serialize};
use std::{fs, io::Write};
use tauri::Manager;

use crate::open::directory;

#[derive(Serialize, Deserialize, Clone)]
pub struct TextContents {
    dir: String,
    path: String,
    content: String,
}

pub fn write_to_cache(path: &str, content: &str) -> Result<(), Box<dyn std::error::Error>> {
    let mut file = fs::File::create(path)?;
    file.write_all(content.as_bytes())?;
    Ok(())
}

#[tauri::command]
pub fn write_text(text_contents: TextContents, app_handle: tauri::AppHandle) {
    let dir = directory::format_dir(&text_contents.dir, &text_contents.path);

    match write_to_cache(&dir, &text_contents.content) {
        Ok(_) => {
            app_handle.emit("write-success", "写入成功").unwrap();
        }
        Err(_) => {
            app_handle.emit("write-error", "写入失败").unwrap();
        }
    }
}
