use anyhow::Context;
use epub::archive::EpubArchive;
use epub::doc::EpubDoc;
use rand::distributions::{Alphanumeric, Distribution};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{self, Path};
use std::{fs, io::Write};

pub mod directory;
mod epub2_template;
mod epub3_template;
mod template;

use self::directory::format_dir;

#[derive(Serialize, Deserialize, Clone)]
pub struct EpubContent {
    dir: String,
    chapters: Vec<String>,
    paths: Vec<String>,
    base_path: String,
    container: String,
    save_path: String,
}

impl EpubContent {
    fn new(dir: &str) -> Self {
        let path = "";
        EpubContent {
            dir: dir.to_string(),
            chapters: Vec::new(),
            paths: Vec::new(),
            base_path: format_dir(dir, path),
            container: String::new(),
            save_path: String::new(),
        }
    }

    fn set_container(&mut self, container: String) {
        self.container = container;
    }

    fn set_save_path(&mut self, save_path: String) {
        self.save_path = save_path;
    }

    fn epub2(dir: &str) -> Self {
        let mut epub_content = EpubContent::new(dir);

        epub_content
            .chapters
            .push("OEBPS/Text/Section0001.xhtml".to_string());

        epub_content
            .paths
            .push("OEBPS/Text/Section0001.xhtml".to_string());
        epub_content.paths.push("OEBPS/toc.ncx".to_string());
        epub_content.paths.push("OEBPS/ebook.opf".to_string());
        epub_content
            .paths
            .push("META-INF/container.xml".to_string());
        epub_content.paths.push("mimetype".to_string());
        epub_content
    }

    fn epub3(dir: &str) -> Self {
        let mut epub_content = EpubContent::new(dir);

        epub_content
            .chapters
            .push("OEBPS/Text/Section0001.xhtml".to_string());

        epub_content
            .paths
            .push("OEBPS/Text/Section0001.xhtml".to_string());
        epub_content.paths.push("OEBPS/ebook.opf".to_string());
        epub_content.paths.push("OEBPS/Styles/nav.css".to_string());
        epub_content
            .paths
            .push("META-INF/container.xml".to_string());
        epub_content.paths.push("mimetype".to_string());
        epub_content
    }
}

pub fn unzip(path: &str) -> Result<EpubContent, Box<dyn std::error::Error>> {
    let epub_archive = EpubArchive::new(path)?;
    let mut epub = EpubDoc::new(path)?;

    let mut rng = rand::thread_rng();
    let rand_dir: String = Alphanumeric
        .sample_iter(&mut rng)
        .take(7)
        .map(char::from)
        .collect();

    let mut epub_content = EpubContent::new(&rand_dir);
    epub_content.set_save_path(path.to_string());

    let len = epub.spine.len();
    for _ in 0..len {
        let path = epub.get_current_path();
        if let Some(p) = path {
            epub_content.chapters.push(p.to_str().unwrap().to_string());
        }
        epub.go_next();
    }

    for path in epub_archive.files.iter() {
        if path.ends_with("/") {
            continue;
        }

        match epub.get_resource_by_path(path) {
            Some(resource) => {
                if path.eq("META-INF/container.xml") {
                    epub_content.set_container(String::from_utf8_lossy(&resource).to_string());
                }
                let output_as_string =
                    directory::format_dir(&rand_dir, &path.replace("/", path::MAIN_SEPARATOR_STR));
                let output_path = Path::new(&output_as_string);
                if let Some(output_dir) = output_path.parent() {
                    if !Path::new(&output_dir).exists() {
                        fs::create_dir_all(&output_dir)
                            .with_context(|| format!("创建文件夹失败: {output_dir:?}"))?;
                    }
                }
                let mut f = fs::File::create(&output_as_string)
                    .with_context(|| format!("创建文件失败: {output_as_string:?}"))?;
                f.write_all(&resource)?;
            }
            None => continue,
        }
    }
    epub_content.paths = epub_archive
        .files
        .into_iter()
        .filter(|x| !x.ends_with("/"))
        .collect();

    Ok(epub_content)
}

pub fn create_epub2(dir: &str) -> Result<EpubContent, Box<dyn std::error::Error>> {
    let uid = uuid::Uuid::new_v4().to_string();
    let mut epub = HashMap::new();
    epub.insert("mimetype", template::MIME_TYPE.to_string());
    epub.insert("META-INF/container.xml", template::CONTAINER.to_string());
    epub.insert(
        "OEBPS/ebook.opf",
        epub2_template::OPF.replace("{uuid}", &uid),
    );
    epub.insert("OEBPS/toc.ncx", epub2_template::NCX.replace("{uuid}", &uid));
    epub.insert(
        "OEBPS/Text/Section0001.xhtml",
        template::SECTION.to_string(),
    );
    for (key, value) in epub.iter() {
        let path = format_dir(dir, key);
        let folder = Path::new(&path)
            .parent()
            .with_context(|| format!("文件夹不存在: {path:?}"))
            .unwrap();
        if !Path::new(folder).exists() {
            fs::create_dir_all(folder).with_context(|| format!("创建文件夹失败: {path:?}"))?;
        }
        fs::write(&path, value)?;
    }
    let mut epub_content = EpubContent::epub2(dir);
    epub_content.set_container(template::CONTAINER.to_string());
    Ok(epub_content)
}

fn create_epub3(dir: &str) -> Result<EpubContent, Box<dyn std::error::Error>> {
    let uid = uuid::Uuid::new_v4().to_string();
    let mut epub = HashMap::new();

    epub.insert("mimetype", template::MIME_TYPE.to_string());
    epub.insert("META-INF/container.xml", template::CONTAINER.to_string());
    epub.insert(
        "OEBPS/ebook.opf",
        epub3_template::OPF.replace("{uuid}", &uid),
    );
    epub.insert("OEBPS/nav.xhtml", epub3_template::NAV.to_string());
    epub.insert(
        "OEBPS/Text/Section0001.xhtml",
        template::SECTION.to_string(),
    );
    epub.insert("OEBPS/Styles/nav.css", epub3_template::NAV_CSS.to_string());
    for (key, value) in epub.iter() {
        let path = format_dir(dir, key);
        let folder = Path::new(&path)
            .parent()
            .with_context(|| format!("文件夹不存在: {path:?}"))
            .unwrap();
        if !Path::new(folder).exists() {
            fs::create_dir_all(folder).with_context(|| format!("创建文件夹失败: {path:?}"))?;
        }
        fs::write(&path, value)?;
    }
    let mut epub_content = EpubContent::epub3(dir);
    epub_content.set_container(template::CONTAINER.to_string());
    Ok(epub_content)
}

pub fn create_epub(version: usize) -> Result<EpubContent, Box<dyn std::error::Error>> {
    let mut rng = rand::thread_rng();
    let rand_dir: String = Alphanumeric
        .sample_iter(&mut rng)
        .take(7)
        .map(char::from)
        .collect();

    match version {
        2 => create_epub2(&rand_dir),
        3 => create_epub3(&rand_dir),
        _ => create_epub2(&rand_dir),
    }
}
