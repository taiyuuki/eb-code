use std::path::{self, Path};
use std::{fs, io::Write};
use epub::archive::EpubArchive;
use epub::doc::EpubDoc;
use dirs;

#[tauri::command]
pub fn open_epub(path: &str) {
    let mut epub = EpubDoc::new(path).unwrap();
    let epub_archive = EpubArchive::new(path).unwrap();
    let pathes = epub_archive.files;

    for path in pathes {
        match epub.get_resource_by_path(path.as_str()) {
            Some(resource) => {
                let output_as_string = format!(
                    "{}{}.EBCode{}cache{}{}{}{}",
                    dirs::home_dir().unwrap().to_str().unwrap(),
                    path::MAIN_SEPARATOR,
                    path::MAIN_SEPARATOR,
                    path::MAIN_SEPARATOR,
                    "ANYNAME",
                    path::MAIN_SEPARATOR,
                     &path
                    );
                let output_path = Path::new(&output_as_string);
                if let Some(output_dir) = output_path.parent() {
                    if!Path::new(&output_dir).exists() {
                        fs::create_dir_all(&output_dir).expect(&output_as_string);
                    }
                }
                let mut f = fs::File::create(&output_as_string).expect(&output_as_string);
                f.write_all(&resource).unwrap();
            }
            None => continue,
        }
    }
}