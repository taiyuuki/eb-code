use crate::open::directory::format_dir;
use grep::{regex, searcher};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, error::Error};
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
pub struct SearchOption {
    dir: String,
    pattern: String,
    regex: bool,
    case_sensitive: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SearchResult {
    lnum: usize,
    line: String,
}

/// 此 Rust 函数在文件中搜索指定的正则表达式模式，并打印匹配的行及其行号。
///
/// Arguments:
///
/// * `file`: “file” 参数是对一个字符串的引用，该字符串表示要搜索指定正则表达式模式的文件的路径。
/// * `pattern`: `find_by_regex` 函数中的 `pattern`
/// 参数是一个字符串，表示要在指定文件中搜索的正则表达式模式。此模式将用于匹配文件内容，以查找与该模式匹配的任何实例。
/// * `yes`: `yes` 参数是一个布尔标志，用于确定正则表达式模式匹配是否不区分大小写。如果 `yes` 设置为 `true`，则模式匹配将不区分大小写；如果 `yes` 设置为
/// `false`，则模式匹配将区分大小写
///
/// Returns:
///
/// `find_by_regex` 函数返回 `Result<(), Box<dyn Error>>`。
pub fn find_by_regex(
    file: &str,
    pattern: &str,
    yes: bool,
) -> Result<Vec<SearchResult>, Box<dyn Error>> {
    let f = std::fs::File::open(file)?;

    let matcher = regex::RegexMatcherBuilder::new()
        .case_insensitive(yes)
        .build(pattern)?;
    let mut search_result = vec![];

    searcher::Searcher::new().search_file(
        &matcher,
        &f,
        searcher::sinks::UTF8(|lnum, line| {
            search_result.push(SearchResult {
                lnum: lnum as usize,
                line: line.to_string(),
            });
            Ok(true)
        }),
    )?;
    Ok(search_result)
}

pub fn find_by_str(file: &str, text: &str, yes: bool) -> Result<Vec<SearchResult>, Box<dyn Error>> {
    let f = std::fs::File::open(file)?;
    let matcher = regex::RegexMatcherBuilder::new()
        .case_insensitive(yes)
        .fixed_strings(true)
        .build(text)?;
    let mut search_result = vec![];
    searcher::Searcher::new().search_file(
        &matcher,
        &f,
        searcher::sinks::UTF8(|lnum, line| {
            search_result.push(SearchResult {
                lnum: lnum as usize,
                line: line.to_string(),
            });
            Ok(true)
        }),
    )?;
    Ok(search_result)
}

#[tauri::command]
pub fn find(search_option: SearchOption, app_handle: tauri::AppHandle) {
    let path = format_dir(&search_option.dir, "");
    let mut final_result = HashMap::new();
    walkdir::WalkDir::new(&path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            let path = e.path().to_str().unwrap();
            path.ends_with(".xhtml") || path.ends_with(".html")
        })
        .for_each(|e| {
            let file = e.path().to_str().unwrap();
            let search_result = if search_option.regex {
                find_by_regex(file, &search_option.pattern, search_option.case_sensitive)
            } else {
                find_by_str(file, &search_option.pattern, search_option.case_sensitive)
            };
            if let Ok(result) = search_result {
                if result.len() > 0 {
                    final_result.insert(
                        file.to_string().replace(&path, "").replace("\\", "/"),
                        result,
                    );
                }
            }
        });
    app_handle.emit("search", final_result).unwrap();
}
