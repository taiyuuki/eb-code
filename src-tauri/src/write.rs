use crate::async_proc::AsyncProcInputTx;
use crate::Input;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::{fs, io::Write};

use crate::open::directory;

#[derive(Serialize, Deserialize, Clone)]
pub struct TextContents {
    dir: String,
    path: String,
    content: String,
}

pub fn write_to_cache(text_contents: TextContents) -> Result<(), Box<dyn std::error::Error>> {
    let dir = directory::format_dir(&text_contents.dir, &text_contents.path);
    let folder = Path::new(&dir).parent().unwrap();
    if !folder.exists() {
        fs::create_dir_all(folder)?;
    }
    let mut file = fs::File::create(&dir)?;
    file.write_all(text_contents.content.as_bytes())?;
    Ok(())
}

#[tauri::command]
pub async fn write_text(
    text_contents: TextContents,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Write(text_contents))
        .await
        .map_err(|e| e.to_string())
}
