use crate::open::directory;
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
