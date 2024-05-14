use crate::open::directory;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
pub struct CopyOption {
    dir: String,
    from: String,
    to_id: String,
}

pub fn copy(from: &str, to: &str) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new(to);
    let folder = path.parent().unwrap();
    if !folder.exists() {
        fs::create_dir_all(folder)?;
    }
    let _ = fs::copy(from, path)?;
    Ok(())
}

#[tauri::command]
pub fn copy_file(copy_option: CopyOption, app_handle: tauri::AppHandle) {
    let to = directory::format_dir(&copy_option.dir, &copy_option.to_id);

    match copy(&copy_option.from, &to) {
        Ok(_) => {
            app_handle.emit("file-copied", copy_option).unwrap();
        }
        Err(_) => {
            app_handle.emit("file-copy-error", "复制失败").unwrap();
        }
    }
}
