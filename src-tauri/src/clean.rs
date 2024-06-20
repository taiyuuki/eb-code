use crate::open::directory;
use std::fs;
use std::io;
use std::path;

pub fn clean_dir(dir: &str) -> io::Result<()> {
    let cache_dir: String = directory::format_dir(dir, "");
    let cache_dir = path::Path::new(&cache_dir);
    if cache_dir.exists() {
        fs::remove_dir_all(cache_dir)?;
    }
    Ok(())
}
