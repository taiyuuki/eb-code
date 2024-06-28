use crate::open::directory;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs};

#[derive(Serialize, Deserialize, Clone)]
pub struct GenContentsOption {
    pub dir: String,
    pub ids: HashMap<String, Vec<[String; 2]>>,
}

pub fn replace_ids(
    gen_contents_option: GenContentsOption,
) -> Result<(), Box<dyn std::error::Error>> {
    for (id, contents) in gen_contents_option.ids {
        let path = directory::format_dir(&gen_contents_option.dir, &id);
        let mut file_content = fs::read_to_string(&path)?;
        for content in contents {
            file_content = file_content.replace(&content[0], &content[1]);
        }
        fs::write(&path, file_content)?;
    }
    Ok(())
}
