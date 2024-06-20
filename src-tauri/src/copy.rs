use crate::open::directory;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize, Clone)]
pub struct CopyOption {
    pub dir: String,
    pub from: String,
    pub to_id: String,
}

pub fn copy_to(copy_option: CopyOption) -> Result<(), Box<dyn std::error::Error>> {
    let to = directory::format_dir(&copy_option.dir, &copy_option.to_id);
    let path = Path::new(&to);
    let folder = path.parent().unwrap();
    if !folder.exists() {
        fs::create_dir_all(folder)?;
    }
    let _ = fs::copy(&copy_option.from, path)?;
    Ok(())
}
