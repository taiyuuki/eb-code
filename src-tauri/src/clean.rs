use dirs;
use std::fs;
use std::io;
use std::path;
use tauri::Manager;

pub fn clean_dir(dir: &str) -> io::Result<()> {
    let cache_dir: String = format!(
        "{}{}.EBCode{}cache{}{}",
        dirs::home_dir().unwrap().to_str().unwrap(),
        path::MAIN_SEPARATOR,
        path::MAIN_SEPARATOR,
        path::MAIN_SEPARATOR,
        dir,
    );
    let cache_dir = path::Path::new(&cache_dir);
    if cache_dir.exists() {
        fs::remove_dir_all(cache_dir)?;
    }
    Ok(())
}

#[tauri::command]
pub fn clean_cache(dir: String, app_handle: tauri::AppHandle) {
    println!("clean cache: {}", &dir);
    let _ = clean_dir(&dir);
    let _ = app_handle.emit("clean-success", "清理成功");
}
