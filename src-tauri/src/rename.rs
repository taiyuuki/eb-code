use crate::open::directory;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize, Clone)]
pub struct RenameOption {
    pub path: String,
    pub id: String,
    pub new_name: String,
}

pub fn rename_to(rename_option: RenameOption) -> Result<(), Box<dyn std::error::Error>> {
    let from = directory::format_dir(&rename_option.path, &rename_option.id);
    let to = directory::format_dir(&rename_option.path, &rename_option.new_name);
    let path = Path::new(&from);
    if path.exists() {
        fs::rename(&from, &to)?;
    }
    Ok(())
}
