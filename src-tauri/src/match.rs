use epub::archive::EpubArchive;

fn test(path: &str) -> Result<bool, Box<dyn std::error::Error>> {
    let epub = EpubArchive::new(path)?;
    let mut epub_contents = EpubContents::new();
    let len = epub.spine.len();
    for _ in 1..len {
        let path = epub.get_current_path();
        if let Some(p) = path {
            epub_contents.chapters.push(p.to_str().unwrap().to_string());
        }
        epub.go_next();
    }
    Ok(true)
}
