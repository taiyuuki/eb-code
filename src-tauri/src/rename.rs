use crate::open::directory;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
pub struct RenameOption {
    pub path: String,
    pub id: String,
    pub new_name: String,
}

pub fn rename(from: &str, to: &str) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new(&from);
    if path.exists() {
        fs::rename(from, to)?;
    }
    Ok(())
}

#[tauri::command]
pub fn rename_file(rename_option: RenameOption, app_handle: tauri::AppHandle) {
    let from = directory::format_dir(&rename_option.path, &rename_option.id);
    let to = directory::format_dir(&rename_option.path, &rename_option.new_name);
    match rename(&from, &to) {
        Ok(_) => {
            app_handle.emit("rename-success", rename_option).unwrap();
        }
        Err(_) => {
            app_handle.emit("rename-error", "重命名失败").unwrap();
        }
    }
}
