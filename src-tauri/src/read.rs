use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{self, Path};

#[derive(Serialize, Deserialize, Clone)]
pub struct TextDirectory {
    dir: String,
    path: String,
}

pub fn read_file(text_directory: TextDirectory) -> Result<[String; 3], String> {
    let dir = format!(
        "{}{}.EBCode{}cache{}{}{}{}",
        dirs::home_dir().unwrap().to_str().unwrap(),
        path::MAIN_SEPARATOR,
        path::MAIN_SEPARATOR,
        path::MAIN_SEPARATOR,
        &text_directory.dir,
        path::MAIN_SEPARATOR,
        &text_directory.path
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
            Some("js") => "javascript",
            Some("json") => "json",
            _ => "txt",
        },
        None => "txt",
    };
    if p.exists() {
        let text = fs::read_to_string(p).unwrap();
        return Ok([text, lang.to_string(), dir]);
    }
    Err("文件不存在".to_string())
}
