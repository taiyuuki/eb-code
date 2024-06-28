use crate::async_proc::AsyncProcInputTx;
use crate::contents::GenContentsOption;
use crate::copy::CopyOption;
use crate::read::TextDirectory;
use crate::remove::RemoveOption;
use crate::rename::RenameOption;
use crate::save::SaveOption;
use crate::searcher::{ReplaceOption, SearchOption};
use crate::write::TextContents;
use crate::Input;

#[tauri::command]
pub async fn open_epub_on_setup(
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Setup(()))
        .await
        .map_err(|e| e.to_string())
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

#[tauri::command]
pub async fn open_epub(
    path: String,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Open(path))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create(
    version: usize,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Create(version))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_text(
    text_directory: TextDirectory,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Read(text_directory))
        .await
        .map_err(|e| e.to_string())
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

#[tauri::command]
pub async fn save_epub(
    save_option: SaveOption,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Save(save_option))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn find(
    search_option: SearchOption,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Search(search_option))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn replace(
    replace_option: ReplaceOption,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Replace(replace_option))
        .await
        .map_err(|e| e.to_string())
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

#[tauri::command]
pub async fn gen_contents(
    gen_contents_option: GenContentsOption,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::GenContents(gen_contents_option))
        .await
        .map_err(|e| e.to_string())
}
