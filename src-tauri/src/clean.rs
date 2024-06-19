use crate::async_proc::AsyncProcInputTx;
use crate::open::directory;
use crate::Input;
use std::fs;
use std::io;
use std::path;

pub fn clean_dir(dir: &str) -> io::Result<()> {
    let cache_dir: String = directory::format_dir(dir, "");
    let cache_dir = path::Path::new(&cache_dir);
    if cache_dir.exists() {
        fs::remove_dir_all(cache_dir)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn clean_cache(
    dir: String,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Clean(dir))
        .await
        .map_err(|e| e.to_string())
}
