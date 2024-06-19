use crate::async_proc::AsyncProcInputTx;
use crate::open::directory::format_dir;
use crate::Input;
use grep::{
    matcher::{Captures, Matcher},
    regex::{self, RegexMatcher},
    searcher,
};
use serde::{Deserialize, Serialize};
use std::{
    error::Error,
    io::{Read, Write},
};

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

pub fn find_file(file: &str, matcher: &RegexMatcher) -> Result<Vec<SearchResult>, Box<dyn Error>> {
    let f = std::fs::File::open(file)?;

    let mut search_result = vec![];

    searcher::Searcher::new().search_file(
        matcher,
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
    matcher: &RegexMatcher,
    replacement: &str,
) -> Result<(), Box<dyn Error>> {
    let mut f = std::fs::File::open(file)?;
    let mut haystack = vec![];

    f.read_to_end(&mut haystack)?;

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

pub fn search(search_option: SearchOption) -> Result<Vec<(String, Vec<SearchResult>)>, String> {
    let path = format_dir(&search_option.dir, "");
    let mut payload = vec![];
    match regex::RegexMatcherBuilder::new()
        .case_insensitive(!search_option.case_sensitive)
        .word(search_option.word)
        .fixed_strings(!search_option.regex)
        .octal(true)
        .multi_line(true)
        .line_terminator(None)
        .build(search_option.pattern.as_str())
    {
        Ok(matcher) => {
            walkdir::WalkDir::new(&path)
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| {
                    let ext = e.path().extension();
                    if let Some(ext) = ext {
                        return ext == "xhtml" || ext == "html";
                    }
                    false
                })
                .for_each(|e| {
                    let file = e.path().to_str().unwrap();
                    let search_result = find_file(file, &matcher);
                    if let Ok(result) = search_result {
                        if result.len() > 0 {
                            payload.push((
                                file.to_string().replace(&path, "").replace("\\", "/"),
                                result,
                            ));
                        }
                    }
                });
            Ok(payload)
        }
        Err(_) => Err("正则表达式错误".to_string()),
        // app_handle.emit("search", payload).unwrap();
        // app_handle.emit("search-error", "正则表达式错误").unwrap()
    }
}

#[tauri::command]
pub async fn find(
    search_option: SearchOption,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Search(search_option))
        .await
        .map_err(|e| e.to_string())
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

pub fn replace_file(replace_option: ReplaceOption) -> Result<(), String> {
    let path = format_dir(&replace_option.dir, "");
    match regex::RegexMatcherBuilder::new()
        .case_insensitive(!replace_option.case_sensitive)
        .word(replace_option.word)
        .fixed_strings(!replace_option.regex)
        .octal(true)
        .multi_line(true)
        .line_terminator(None)
        .build(&replace_option.pattern)
    {
        Ok(matcher) => {
            walkdir::WalkDir::new(&path)
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| {
                    let ext = e.path().extension();
                    if let Some(ext) = ext {
                        return ext == "xhtml" || ext == "html";
                    }
                    false
                })
                .for_each(|e| {
                    let file = e.path().to_str().unwrap();
                    let r = matcher_replace(file, &matcher, &replace_option.replacement);
                    if let Err(_e) = r {
                        println!("{}", _e);
                    }
                });
            Ok(())
        }
        Err(e) => Err(e.to_string()),
        // app_handle.emit("replace-error", "正则表达式错误").unwrap()
        // app_handle.emit("replace", "替换完成").unwrap();
    }
}

#[tauri::command]
pub async fn replace(
    replace_option: ReplaceOption,
    state: tauri::State<'_, AsyncProcInputTx<Input>>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    async_proc_input_tx
        .send(Input::Replace(replace_option))
        .await
        .map_err(|e| e.to_string())
}
