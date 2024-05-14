use crate::open::directory;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
pub struct RemoveOption {
    path: String,
    id: String,
}

pub fn remove(path: &str, id: &str) -> Result<(), Box<dyn std::error::Error>> {
    let file = directory::format_dir(path, id);
    let path = Path::new(&file);
    if path.exists() {
        fs::remove_file(path)?;
    }
    Ok(())
}

#[tauri::command]
pub fn remove_file(remove_option: RemoveOption, app_handle: tauri::AppHandle) {
    match remove(&remove_option.path, &remove_option.id) {
        Ok(_) => {
            app_handle.emit("remove-success", "删除成功").unwrap();
        }
        Err(_) => {
            app_handle.emit("remove-error", "删除失败").unwrap();
        }
    };
}
