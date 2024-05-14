use crate::open::directory;
use anyhow::Context;
use std::fs;
use std::io;
use std::path;
use tauri::Manager;

pub fn clean_dir(dir: &str) -> io::Result<()> {
    let cache_dir: String = directory::format_dir(dir, "");
    let cache_dir = path::Path::new(&cache_dir);
    if cache_dir.exists() {
        fs::remove_dir_all(cache_dir)?;
    }
    Ok(())
}

#[tauri::command]
pub fn clean_cache(dir: String, app_handle: tauri::AppHandle) {
    clean_dir(&dir)
        .with_context(|| format!("缓存清理失败: {dir:?}"))
        .unwrap();
    app_handle.emit("clean-success", "清理成功").unwrap();
}
