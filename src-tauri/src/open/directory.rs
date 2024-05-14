use std::path;

use dirs;

pub fn format_dir(dir: &str, path: &str) -> String {
    let separator = path::MAIN_SEPARATOR.to_string();
    format!(
        "{}{}.EBCode{}cache{}{}{}{}",
        dirs::home_dir().unwrap().to_str().unwrap(),
        path::MAIN_SEPARATOR,
        path::MAIN_SEPARATOR,
        path::MAIN_SEPARATOR,
        dir.replace("/", &separator),
        path::MAIN_SEPARATOR,
        path.replace("/", &separator),
    )
}
