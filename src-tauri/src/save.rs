use crate::open::directory::format_dir;
use anyhow::Context;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{Read, Write};
use std::path::Path;
use walkdir::WalkDir;
use zip::write::FileOptions;

#[derive(Serialize, Deserialize, Clone)]
pub struct SaveOption {
    pub input_dir: String,
    pub output_dir: String,
}

pub fn save_to(input_dir: &str, output_dir: &str) -> Result<(), Box<dyn std::error::Error>> {
    let full_path = format_dir(input_dir, "");
    let output_path = Path::new(&output_dir);
    let folder = output_path.parent().unwrap();
    if !folder.exists() {
        fs::create_dir_all(&folder)?;
    }

    let it = WalkDir::new(&full_path);

    let option_zip = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .compression_level(Some(1));
    let option_store = FileOptions::default().compression_method(zip::CompressionMethod::Stored);

    let zip_file = fs::File::create(&output_path)?;
    let mut zip = zip::ZipWriter::new(zip_file);
    let prefix = Path::new(&full_path);
    let mut buffer = vec![];

    for entry in it {
        match entry {
            Ok(dir_entry) => {
                let entry_path = dir_entry.path();
                let name = entry_path.strip_prefix(prefix)?;
                let dir = name
                    .to_str()
                    .map(str::to_owned)
                    .with_context(|| format!("{name:?} Is a Non UTF-8 Path"))?
                    .replace("\\", "/");
                let compress = match name.to_str().unwrap() {
                    "mimetype" => option_store,
                    _ => option_zip,
                };
                if entry_path.is_file() {
                    zip.start_file(dir, compress)?;
                    let mut f = fs::File::open(entry_path)?;
                    f.read_to_end(&mut buffer)?;
                    zip.write_all(&buffer)?;
                    buffer.clear();
                } else if !name.as_os_str().is_empty() {
                    zip.add_directory(dir, option_store)?;
                }
            }
            Err(e) => println!("{:?}", e),
        }
    }

    zip.finish()?;

    Ok(())
}
