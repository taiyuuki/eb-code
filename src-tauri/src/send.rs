use crate::Output;
use std::result::Result::Ok;
use tauri::{Manager, Runtime};

pub fn rs2js<R: Runtime>(output: Output, app_handle: &impl Manager<R>) {
    match output {
        Output::Setup(output) => match output {
            Ok(output) => {
                app_handle.emit("setup", output).unwrap();
            }
            Err(err) => {
                app_handle.emit("setup-error", err).unwrap();
            }
        },
        Output::Read(output) => match output {
            Ok(output) => {
                app_handle.emit("get-text", output).unwrap();
            }
            Err(err) => {
                app_handle.emit("get-text-error", err).unwrap();
            }
        },
        Output::Open(output) => match output {
            Ok(output) => {
                app_handle.emit("epub-opened", output).unwrap();
            }
            Err(err) => {
                app_handle.emit("epub-open-error", err).unwrap();
            }
        },
        Output::Create(output) => match output {
            Ok(output) => {
                app_handle.emit("epub-created", output).unwrap();
            }
            Err(err) => {
                app_handle.emit("epub-create-error", err).unwrap();
            }
        },
        Output::Clean(output) => match output {
            Ok(output) => {
                app_handle.emit("cleaned", output).unwrap();
            }
            Err(err) => {
                app_handle.emit("clean-error", err).unwrap();
            }
        },
        Output::Copy(output) => match output {
            Ok(output) => {
                app_handle.emit("file-copied", output).unwrap();
            }
            Err(err) => {
                app_handle.emit("file-copy-error", err).unwrap();
            }
        },
        Output::Remove(output) => match output {
            Ok(output) => {
                app_handle.emit("file-removed", output).unwrap();
            }
            Err(err) => {
                app_handle.emit("file-remove-error", err).unwrap();
            }
        },
        Output::Rename(output) => match output {
            Ok(output) => {
                app_handle.emit("file-renamed", output).unwrap();
            }
            Err(err) => {
                app_handle.emit("file-rename-error", err).unwrap();
            }
        },
        Output::Save(output) => match output {
            Ok(output) => {
                app_handle.emit("epub-saved", output).unwrap();
            }
            Err(err) => {
                app_handle.emit("epub-save-error", err).unwrap();
            }
        },
        Output::Search(output) => match output {
            Ok(output) => {
                app_handle.emit("searched", output).unwrap();
            }
            Err(err) => {
                app_handle.emit("search-error", err).unwrap();
            }
        },
        Output::Replace(output) => match output {
            Ok(output) => {
                app_handle.emit("replaced", output).unwrap();
            }
            Err(err) => {
                app_handle.emit("replace-error", err).unwrap();
            }
        },
        Output::Write(output) => match output {
            Ok(output) => {
                app_handle.emit("text-written", output).unwrap();
            }
            Err(err) => {
                app_handle.emit("text-write-error", err).unwrap();
            }
        },
    }
}
