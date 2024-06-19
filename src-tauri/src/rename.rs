use crate::async_proc::AsyncProcInputTx;
use crate::open::directory;
use crate::Input;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize, Clone)]
pub struct RenameOption {
    pub path: String,
    pub id: String,
    pub new_name: String,
}

pub fn rename_to(rename_option: RenameOption) -> Result<(), Box<dyn std::error::Error>> {
    let from = directory::format_dir(&rename_option.path, &rename_option.id);
    let to = directory::format_dir(&rename_option.path, &rename_option.new_name);
    let path = Path::new(&from);
    if path.exists() {
        fs::rename(&from, &to)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn rename_file(
    rename_option: RenameOption,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Rename(rename_option))
        .await
        .map_err(|e| e.to_string())
}
