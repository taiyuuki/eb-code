use dirs;
use epub::archive::EpubArchive;
use epub::doc::EpubDoc;
use serde::{Deserialize, Serialize};
use std::path::{self, Path};
use std::time;
use std::{fs, io::Write};
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
struct EpubContents {
    chapters: Vec<String>,
    pathes: Vec<String>,
}

impl EpubContents {
    fn new() -> Self {
        EpubContents {
            chapters: Vec::new(),
            pathes: Vec::new(),
        }
    }
}

fn un_zip(path: &str) -> Result<EpubContents, Box<dyn std::error::Error>> {
    let mut epub = EpubDoc::new(path)?;
    let epub_archive = EpubArchive::new(path)?;
    let mut epub_contents = EpubContents::new();

    let len = epub.spine.len();
    for _ in 1..len {
        let path = epub.get_current_path();
        if let Some(p) = path {
            epub_contents.chapters.push(p.to_str().unwrap().to_string());
        }
        epub.go_next();
    }

    for path in epub_archive.files.iter() {
        match epub.get_resource_by_path(path) {
            Some(resource) => {
                let output_as_string = format!(
                    "{}{}.EBCode{}cache{}{}{}{}",
                    dirs::home_dir().unwrap().to_str().unwrap(),
                    path::MAIN_SEPARATOR,
                    path::MAIN_SEPARATOR,
                    path::MAIN_SEPARATOR,
                    "ANYNAME",
                    path::MAIN_SEPARATOR,
                    path
                );
                let output_path = Path::new(&output_as_string);
                if let Some(output_dir) = output_path.parent() {
                    if !Path::new(&output_dir).exists() {
                        fs::create_dir_all(&output_dir).expect(&output_as_string);
                    }
                }
                let mut f = fs::File::create(&output_as_string).expect(&output_as_string);
                f.write_all(&resource)?;
            }
            None => continue,
        }
    }
    epub_contents.pathes = epub_archive.files;
    Ok(epub_contents)
}

#[tauri::command]
pub fn open_epub(path: &str, app_handle: tauri::AppHandle) {
    match un_zip(path) {
        Ok(epub_contents) => {
            let _ = app_handle.emit("epub-opened", epub_contents);
        }
        Err(_) => {
            let _ = app_handle.emit("epub-error", "打开失败");
        }
    };
}

#[tauri::command]
pub fn get_text(path: &str, app_handle: tauri::AppHandle) {
    let dir = format!(
        "{}{}.EBCode{}cache{}{}{}{}",
        dirs::home_dir().unwrap().to_str().unwrap(),
        path::MAIN_SEPARATOR,
        path::MAIN_SEPARATOR,
        path::MAIN_SEPARATOR,
        "ANYNAME",
        path::MAIN_SEPARATOR,
        path
    );
    let p: &Path = Path::new(&dir);
    let lang = match p.extension() {
        Some(ext) => match ext.to_str() {
            Some("txt") => "txt",
            Some("html") => "html",
            Some("xhtml") => "html",
            Some("opf") => "html",
            Some("ncx") => "html",
            Some("xml") => "html",
            Some("htm") => "html",
            Some("css") => "css",
            Some("js") => "js",
            Some("json") => "json",
            _ => "txt",
        },
        None => "txt",
    };
    if p.exists() {
        let text = fs::read_to_string(p).unwrap();
        app_handle.emit("get_text", [&text, lang, path]).unwrap();
    }
}
