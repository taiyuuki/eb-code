use crate::async_proc::AsyncProcInputTx;
use crate::open::directory;
use crate::Input;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize, Clone)]
pub struct CopyOption {
    pub dir: String,
    pub from: String,
    pub to_id: String,
}

pub fn copy_to(copy_option: CopyOption) -> Result<(), Box<dyn std::error::Error>> {
    let to = directory::format_dir(&copy_option.dir, &copy_option.to_id);
    let path = Path::new(&to);
    let folder = path.parent().unwrap();
    if !folder.exists() {
        fs::create_dir_all(folder)?;
    }
    let _ = fs::copy(&copy_option.from, path)?;
    Ok(())
}

#[tauri::command]
pub async fn copy_file(
    copy_option: CopyOption,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Copy(copy_option))
        .await
        .map_err(|e| e.to_string())
}
