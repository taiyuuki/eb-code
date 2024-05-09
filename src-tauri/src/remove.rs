use crate::open::directory;
use std::fs;
use std::path::Path;
use tauri::Manager;

pub fn remove(path: &str, id: &str) -> Result<(), Box<dyn std::error::Error>> {
    let file = directory::format_dir(path, id);
    let file_path = Path::new(&file);
    if file_path.exists() {
        fs::remove_file(&file)?;
    }
    Ok(())
}

#[tauri::command]
pub fn remove_file(path: String, app_handle: tauri::AppHandle) {
    let _ = remove(&path, "");
    let _ = app_handle.emit("remove-success", "删除成功");
}
