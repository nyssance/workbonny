mod core;
use std::{collections::HashMap, path::PathBuf, sync::{Arc, Mutex}};
use core::{Entry, Result};
use notify::{Watcher, RecursiveMode};
use serde::Serialize;
use tauri::{Manager, Emitter, Runtime, plugin::{Builder, TauriPlugin}};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

struct Session { root: PathBuf, revision: u64, _watcher: notify::RecommendedWatcher }
#[derive(Default)]
struct Inner { sessions: HashMap<String, Session>, sequence: u64 }
#[derive(Clone, Default)]
struct Gallery { inner: Arc<Mutex<Inner>>, decode: Arc<Mutex<()>> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Album { name: String, revision: u64, entries: Vec<Entry> }
fn state_path<R: Runtime>(app: &tauri::AppHandle<R>, label: &str) -> Result<PathBuf> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("gallery");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    use sha2::{Digest, Sha256};
    Ok(dir.join(format!("{}.json", hex::encode(Sha256::digest(label.as_bytes())))))
}
fn activate<R: Runtime>(app: &tauri::AppHandle<R>, label: &str, root: PathBuf, state: &Gallery) -> Result<Album> {
    let root = root.canonicalize().map_err(|e| e.to_string())?;
    if !root.is_dir() { return Err("所选文件夹已不存在".into()); }
    let target = label.to_string(); let handle = app.clone();
    let mut watcher = notify::recommended_watcher(move |event: notify::Result<notify::Event>| {
        let payload = match event { Ok(e) if !matches!(e.kind, notify::EventKind::Access(_)) => Some(String::new()), Err(e) => Some(e.to_string()), _ => None };
        if let Some(error) = payload { let _ = handle.emit_to(&target, "gallery:changed", error); }
    }).map_err(|e| e.to_string())?;
    watcher.watch(&root, RecursiveMode::Recursive).map_err(|e| e.to_string())?;
    let entries = core::scan(&root)?;
    let name = root.file_name().unwrap_or(root.as_os_str()).to_string_lossy().into_owned();
    let path = state_path(app, label)?;
    let temp = path.with_extension("tmp");
    std::fs::write(&temp, serde_json::to_vec(&root).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    std::fs::rename(temp,path).map_err(|e| e.to_string())?;
    let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
    inner.sequence += 1; let revision = inner.sequence;
    inner.sessions.insert(label.to_owned(), Session { root, revision, _watcher: watcher });
    Ok(Album { name, revision, entries })
}
#[tauri::command]
async fn pick<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::WebviewWindow<R>, state: tauri::State<'_, Gallery>) -> Result<Option<Album>> {
    let label = window.label().to_string(); let state = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let Some(folder) = app.dialog().file().set_title("选择图片文件夹").blocking_pick_folder() else { return Ok(None) };
        let path = folder.into_path().map_err(|e| e.to_string())?;
        activate(&app, &label, path, &state).map(Some)
    }).await.map_err(|e| e.to_string())?
}
#[tauri::command]
async fn restore<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::WebviewWindow<R>, state: tauri::State<'_, Gallery>) -> Result<Option<Album>> {
    let label = window.label().to_string(); let state = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let path = state_path(&app,&label)?;
        if !path.exists() { return Ok(None); }
        let root = serde_json::from_slice(&std::fs::read(path).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
        activate(&app,&label,root,&state).map(Some)
    }).await.map_err(|e| e.to_string())?
}
fn folder(state: &Gallery, label: &str, revision: u64) -> Result<PathBuf> {
    let inner = state.inner.lock().map_err(|e| e.to_string())?;
    let session = inner.sessions.get(label).ok_or("请先选择文件夹")?;
    if session.revision != revision { return Err("文件夹已切换".into()); }
    Ok(session.root.clone())
}
#[tauri::command]
async fn refresh<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::WebviewWindow<R>, state: tauri::State<'_, Gallery>, revision: u64) -> Result<Album> {
    let label = window.label().to_string(); let state = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || { let root = folder(&state,&label,revision)?; activate(&app,&label,root,&state) }).await.map_err(|e| e.to_string())?
}
#[tauri::command]
async fn image<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::WebviewWindow<R>, state: tauri::State<'_, Gallery>, revision: u64, id: String, thumbnail: bool) -> Result<tauri::ipc::Response> {
    let label = window.label().to_string(); let state = state.inner().clone();
    let cache = app.path().app_cache_dir().map_err(|e| e.to_string())?.join("gallery-v1");
    tauri::async_runtime::spawn_blocking(move || {
        let _decode = state.decode.lock().map_err(|e| e.to_string())?;
        let root = folder(&state,&label,revision)?;
        let bytes = core::render(&root,&id,&cache,thumbnail)?;
        folder(&state,&label,revision)?;
        Ok(tauri::ipc::Response::new(bytes))
    }).await.map_err(|e| e.to_string())?
}
#[tauri::command]
fn open_original<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::WebviewWindow<R>, state: tauri::State<'_, Gallery>, revision: u64, id: String) -> Result<()> {
    let path = core::resolve(&folder(&state,window.label(),revision)?, &id)?;
    app.opener().open_path(path.to_string_lossy(), None::<&str>).map_err(|e| e.to_string())
}
/// System preview receives only a canonical file inside this window's selected root.
#[tauri::command]
async fn preview<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::WebviewWindow<R>, state: tauri::State<'_, Gallery>, revision: u64, id: String) -> Result<()> {
    let path = core::resolve(&folder(&state, window.label(), revision)?, &id)?;
    #[cfg(target_os = "macos")]
    {
        let _ = app;
        tauri::async_runtime::spawn_blocking(move || {
            // Pass the path as an argument, never through a shell. Wait to reap the child
            // when Quick Look closes, and report launch/exit failures without retrying.
            let status = std::process::Command::new("/usr/bin/qlmanage")
                .arg("-p").arg(path)
                .stdin(std::process::Stdio::null())
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .status().map_err(|e| format!("无法打开系统预览：{e}"))?;
            if status.success() { Ok(()) } else { Err(format!("系统预览退出：{status}")) }
        }).await.map_err(|e| e.to_string())?
    }
    #[cfg(not(target_os = "macos"))]
    {
        // Windows uses the user's registered default image application via opener.
        app.opener().open_path(path.to_string_lossy(), None::<&str>).map_err(|e| e.to_string())
    }
}
#[tauri::command]
fn close<R: Runtime>(window: tauri::WebviewWindow<R>, state: tauri::State<'_, Gallery>) -> Result<()> {
    state.inner.lock().map_err(|e| e.to_string())?.sessions.remove(window.label()); Ok(())
}
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("workbonny-gallery")
        .setup(|app, _| { app.manage(Gallery::default()); Ok(()) })
        .invoke_handler(tauri::generate_handler![pick, restore, refresh, image, open_original, preview, close])
        .on_window_ready(|window| {
            let app = window.app_handle().clone(); let label = window.label().to_string();
            window.on_window_event(move |event| { if matches!(event, tauri::WindowEvent::Destroyed) { if let Ok(mut state) = app.state::<Gallery>().inner.lock() { state.sessions.remove(&label); } } });
        })
        .build()
}
