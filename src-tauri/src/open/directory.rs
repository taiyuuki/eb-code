use dirs;
use std::path;

pub fn format_dir(dir: &str, path: &str) -> String {
    format!(
        "{}{}.EBCode{}cache{}{}{}{}",
        dirs::home_dir().unwrap().to_str().unwrap(),
        path::MAIN_SEPARATOR,
        path::MAIN_SEPARATOR,
        path::MAIN_SEPARATOR,
        dir,
        path::MAIN_SEPARATOR,
        path
    )
}
