use crate::open::directory::format_dir;
use grep::{
    matcher::{Captures, Matcher},
    regex::{self},
    searcher,
};
use serde::{Deserialize, Serialize};
use std::{
    error::Error,
    io::{Read, Write},
};
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
pub struct SearchOption {
    dir: String,
    pattern: String,
    regex: bool,
    word: bool,
    case_sensitive: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SearchResult {
    lnum: usize,
    line: String,
}

/// 函数“find_file”在文件中搜索特定模式，并将搜索结果作为“SearchResult”结构向量返回。
///
/// Arguments:
///
/// * `file`: `file` 参数是对一个字符串的引用，该字符串表示要搜索指定模式的文件的路径。
/// * `pattern`: `find_file` 函数中的 `pattern` 参数表示要在指定文件中查找的搜索模式。此模式可以是正则表达式，也可以是固定字符串（具体取决于 `fixed`
/// 参数的值）。该函数将在以下内容中搜索此模式：
/// * `case`: `find_file` 函数中的 `case` 参数是一个布尔标志，用于确定搜索是否区分大小写。如果 `case` 为
/// `true`，则搜索将区分大小写，这意味着模式必须与文件中的文本的大小写相匹配。
/// * `fixed`: `find_file` 函数中的 `fixed` 参数表示搜索模式应被视为固定字符串还是正则表达式。如果 `fixed` 设置为
/// `true`，则搜索模式将被视为固定字符串，这意味着模式中的特殊字符将被视为普通字符。
///
/// Returns:
///
/// `find_file` 函数返回一个 `Result`，其中包含一个 `SearchResult` 结构向量或一个包裹在 `Box<dyn Error>` 中的错误。
pub fn find_file(
    file: &str,
    pattern: &str,
    case: bool,
    word: bool,
    fixed: bool,
) -> Result<Vec<SearchResult>, Box<dyn Error>> {
    let f = std::fs::File::open(file)?;

    let matcher = regex::RegexMatcherBuilder::new()
        .case_insensitive(!case)
        .word(word)
        .fixed_strings(!fixed)
        .octal(true)
        .multi_line(true)
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

pub fn matcher_replace(
    file: &str,
    pattern: &str,
    replacement: &str,
    case: bool,
    word: bool,
    fixed: bool,
) -> Result<(), Box<dyn Error>> {
    let mut f = std::fs::File::open(file)?;
    let mut haystack = vec![];

    f.read_to_end(&mut haystack)?;

    let matcher = regex::RegexMatcherBuilder::new()
        .case_insensitive(!case)
        .word(word)
        .fixed_strings(!fixed)
        .octal(true)
        .multi_line(true)
        .build(pattern)?;

    let mut dst: Vec<u8> = vec![];
    let mut caps = matcher.new_captures()?;

    matcher.replace_with_captures(&haystack, &mut caps, &mut dst, |captures, v| {
        let mut repl = replacement.to_string();
        for i in 0..matcher.capture_count() {
            let regex_match = captures.get(i).unwrap();
            let start = regex_match.start();
            let end = regex_match.end();

            let from = format!("${}", i);
            if replacement.contains(&from) {
                let to = String::from_utf8(haystack.get(start..end).unwrap().to_vec()).unwrap();
                repl = repl.replace(&from, to.as_str());
            }
        }
        v.extend(repl.as_bytes());
        true
    })?;

    let mut wf = std::fs::File::create(file)?;
    wf.write(&dst)?;

    Ok(())
}

#[tauri::command]
pub fn find(search_option: SearchOption, app_handle: tauri::AppHandle) {
    let path = format_dir(&search_option.dir, "");
    let mut payload = vec![];
    walkdir::WalkDir::new(&path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            let path = e.path().to_str().unwrap();
            path.ends_with(".xhtml") || path.ends_with(".html")
        })
        .for_each(|e| {
            let file = e.path().to_str().unwrap();
            let search_result = find_file(
                file,
                &search_option.pattern,
                search_option.case_sensitive,
                search_option.word,
                search_option.regex,
            );
            if let Ok(result) = search_result {
                if result.len() > 0 {
                    payload.push((
                        file.to_string().replace(&path, "").replace("\\", "/"),
                        result,
                    ));
                }
            }
        });
    app_handle.emit("search", payload).unwrap();
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ReplaceOption {
    dir: String,
    pattern: String,
    regex: bool,
    word: bool,
    case_sensitive: bool,
    replacement: String,
}

#[tauri::command]
pub fn replace(replace_option: ReplaceOption, app_handle: tauri::AppHandle) {
    let path = format_dir(&replace_option.dir, "");
    walkdir::WalkDir::new(&path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            let path = e.path().to_str().unwrap();
            path.ends_with(".xhtml") || path.ends_with(".html")
        })
        .for_each(|e| {
            let file = e.path().to_str().unwrap();
            let r = matcher_replace(
                file,
                &replace_option.pattern,
                &replace_option.replacement,
                replace_option.case_sensitive,
                replace_option.word,
                replace_option.regex,
            );
            if let Err(_e) = r {
                println!("{}", _e);
            }
        });
    app_handle.emit("replace", "替换完成").unwrap();
}
