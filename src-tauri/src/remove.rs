use crate::async_proc::AsyncProcInputTx;
use crate::open::directory;
use crate::Input;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize, Clone)]
pub struct RemoveOption {
    path: String,
    id: String,
}

pub fn remove(remove_option: RemoveOption) -> Result<(), Box<dyn std::error::Error>> {
    let file = directory::format_dir(&remove_option.path, &remove_option.id);
    let path = Path::new(&file);
    if path.exists() {
        fs::remove_file(path)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn remove_file(
    remove_option: RemoveOption,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Remove(remove_option))
        .await
        .map_err(|e| e.to_string())
}
