//! Adapted from ALwith U `src-tauri/src/draft_directory.rs` (ledger G18): conversations without a
//! project run in `~/Documents/ALwith`, the folder module-chat's session list shows as quick chats.
use tauri::Manager;

#[tauri::command]
pub async fn quick_chat_directory(app: tauri::AppHandle) -> Result<String, String> {
    let directory = app.path().document_dir().map_err(|error| error.to_string())?.join("ALwith");
    tauri::async_runtime::spawn_blocking(move || {
        std::fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
        directory.into_os_string().into_string().map_err(|_| "Quick chat directory is not valid UTF-8".to_string())
    })
    .await
    .map_err(|error| error.to_string())?
}
