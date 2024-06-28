// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
use lazy_static::lazy_static;
use open::EpubContent;
use std::env::args;
use std::path::{self, Path, PathBuf};
use tauri::Manager;
use tokio::sync::mpsc::{channel, Receiver, Sender};
use warp::Filter;

mod async_proc;
mod clean;
mod command;
mod contents;
mod copy;
mod open;
mod read;
mod remove;
mod rename;
mod save;
mod searcher;
mod send;
mod write;

use read::TextDirectory;

use async_proc::AsyncProcInputTx;

pub enum Input {
    Setup(()),
    Read(TextDirectory),
    Open(String),
    Create(usize),
    Clean(String),
    Copy(copy::CopyOption),
    Remove(remove::RemoveOption),
    Rename(rename::RenameOption),
    Save(save::SaveOption),
    Search(searcher::SearchOption),
    Replace(searcher::ReplaceOption),
    Write(write::TextContents),
    GenContents(contents::GenContentsOption),
}

pub type OutputResult<T> = Result<T, String>;

pub enum Output {
    Setup(OutputResult<EpubContent>),
    Read(OutputResult<[String; 3]>),
    Open(OutputResult<EpubContent>),
    Create(OutputResult<EpubContent>),
    Clean(OutputResult<()>),
    Copy(OutputResult<()>),
    Remove(OutputResult<()>),
    Rename(OutputResult<()>),
    Save(OutputResult<String>),
    Search(OutputResult<Vec<(String, Vec<searcher::SearchResult>)>>),
    Replace(OutputResult<()>),
    Write(OutputResult<()>),
    GenContents(OutputResult<()>),
}

fn open_from_args() -> Result<EpubContent, String> {
    if let Some(path) = args().nth(1) {
        open::unzip(path.as_str()).map_err(move |_| path)
    } else {
        Err("0".to_string())
    }
}

fn get_available_port() -> u16 {
    std::net::TcpListener::bind("0.0.0.0:0")
        .unwrap()
        .local_addr()
        .unwrap()
        .port()
}

lazy_static! {
    static ref FOLDER: PathBuf = {
        let folder = format!(
            "{}{}.EBCode{}cache",
            dirs::home_dir().unwrap().to_str().unwrap(),
            path::MAIN_SEPARATOR,
            path::MAIN_SEPARATOR
        );
        let path = Path::new(&folder);
        if !path.exists() {
            std::fs::create_dir_all(path).unwrap();
        }
        path.to_path_buf()
    };
    static ref PORT: u16 = get_available_port();
}

#[tauri::command]
fn get_port(app_handle: tauri::AppHandle) -> u16 {
    app_handle.emit("port", *PORT).unwrap();
    *PORT
}

async fn async_process_model(
    mut input_rx: Receiver<Input>,
    output_tx: Sender<Output>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    while let Some(input) = input_rx.recv().await {
        let output = match input {
            Input::Setup(_) => Output::Setup(open_from_args()),
            Input::Read(text_directory) => Output::Read(read::read_file(text_directory)),
            Input::Open(path) => match open::unzip(&path) {
                Ok(epub_content) => Output::Open(Ok(epub_content)),
                Err(e) => Output::Open(Err(e.to_string())),
            },
            Input::Create(version) => open::create_epub(version)
                .map(|epub_content| Output::Create(Ok(epub_content)))
                .unwrap_or_else(|e| Output::Create(Err(e.to_string()))),
            Input::Clean(dir) => clean::clean_dir(&dir)
                .map(|_| Output::Clean(Ok(())))
                .unwrap_or_else(|e| Output::Clean(Err(e.to_string()))),
            Input::Copy(copy_option) => copy::copy_to(copy_option)
                .map(|_| Output::Copy(Ok(())))
                .unwrap_or_else(|e| Output::Copy(Err(e.to_string()))),
            Input::Remove(remove_option) => remove::remove(remove_option)
                .map(|_| Output::Remove(Ok(())))
                .unwrap_or_else(|e| Output::Remove(Err(e.to_string()))),
            Input::Rename(rename_option) => rename::rename_to(rename_option)
                .map(|_| Output::Rename(Ok(())))
                .unwrap_or_else(|e| Output::Rename(Err(e.to_string()))),
            Input::Save(save_options) => {
                save::save_to(&save_options.input_dir, &save_options.output_dir)
                    .map(|_| Output::Save(Ok(save_options.output_dir.clone())))
                    .unwrap_or_else(|_| Output::Save(Err(save_options.output_dir)))
            }
            Input::Search(search_options) => searcher::search(search_options)
                .map(|result| Output::Search(Ok(result)))
                .unwrap_or_else(|e| Output::Search(Err(e.to_string()))),
            Input::Replace(replace_options) => searcher::replace_file(replace_options)
                .map(|result| Output::Replace(Ok(result)))
                .unwrap_or_else(|e| Output::Replace(Err(e.to_string()))),
            Input::Write(text_contents) => write::write_to_cache(text_contents)
                .map(|_| Output::Write(Ok(())))
                .unwrap_or_else(|e| Output::Write(Err(e.to_string()))),
            Input::GenContents(gen_contents_option) => contents::replace_ids(gen_contents_option)
                .map(|_| Output::GenContents(Ok(())))
                .unwrap_or_else(|e| Output::GenContents(Err(e.to_string()))),
        };
        output_tx.send(output).await?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (async_proc_input_tx, async_proc_input_rx) = channel::<Input>(1);
    let (async_proc_output_tx, mut async_proc_output_rx) = channel(1);

    tauri::Builder::default()
        .manage(AsyncProcInputTx::new(async_proc_input_tx))
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let cors = warp::cors().allow_any_origin();
                let api = warp::path("static")
                    .and(warp::fs::dir(FOLDER.as_ref() as &Path))
                    .or(warp::any().map(|| "暂无预览".to_string()))
                    .with(cors);
                let server = warp::serve(api);
                server.run(([127, 0, 0, 1], *PORT as u16)).await;
            });

            // 异步线程
            tauri::async_runtime::spawn(async move {
                async_process_model(async_proc_input_rx, async_proc_output_tx).await
            });

            tauri::async_runtime::spawn(async move {
                while let Some(output) = async_proc_output_rx.recv().await {
                    send::rs2js(output, &app_handle);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_port,
            command::open_epub_on_setup,
            command::open_epub,
            command::create,
            command::get_text,
            command::write_text,
            command::clean_cache,
            command::save_epub,
            command::remove_file,
            command::copy_file,
            command::rename_file,
            command::find,
            command::replace,
            command::gen_contents,
        ])
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
