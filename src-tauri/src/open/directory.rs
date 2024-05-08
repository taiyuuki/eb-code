use dirs;

pub fn format_dir(dir: &str, path: &str) -> String {
    format!(
        "{}/.EBCode/cache/{}/{}",
        dirs::home_dir().unwrap().to_str().unwrap(),
        dir,
        path
    )
}
