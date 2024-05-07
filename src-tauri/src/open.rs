use epub::archive::EpubArchive;
use epub::doc::EpubDoc;
use rand::distributions::{Alphanumeric, Distribution};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::{fs, io::Write};
use tauri::Manager;

pub mod directory;

#[derive(Serialize, Deserialize, Clone)]
struct EpubContents {
    dir: String,
    chapters: Vec<String>,
    pathes: Vec<String>,
}

impl EpubContents {
    fn new(dir: &str) -> Self {
        EpubContents {
            dir: dir.to_string(),
            chapters: Vec::new(),
            pathes: Vec::new(),
        }
    }
}

fn un_zip(path: &str) -> Result<EpubContents, Box<dyn std::error::Error>> {
    let mut epub = EpubDoc::new(path)?;
    let epub_archive = EpubArchive::new(path)?;

    let mut rng = rand::thread_rng();
    let rand_dir: String = Alphanumeric
        .sample_iter(&mut rng)
        .take(7)
        .map(char::from)
        .collect();

    let mut epub_contents = EpubContents::new(&rand_dir);

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
                let output_as_string = directory::format_dir(&rand_dir, path);
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
