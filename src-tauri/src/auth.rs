//! Copied from ALwith U `src-tauri/src/native.rs` and `auth.rs` (ledger G19), reduced to the auth
//! module: token refresh runs in the closed `@alwith/native-auth` library, loaded through the public
//! `alwith-native-client` transport. Credentials stay in the named store.
use serde_json::Value;
#[cfg(not(debug_assertions))]
use tauri::Manager;

pub struct NativeAuth(alwith_native_client::Library);

impl NativeAuth {
    pub fn load(app: &tauri::AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        #[cfg(debug_assertions)]
        let directory = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources/native");
        #[cfg(not(debug_assertions))]
        let directory = app.path().resource_dir()?.join("native");
        let _ = app;
        alwith_native_client::configure(&directory)?;
        Ok(Self(alwith_native_client::Library::module("auth")?))
    }
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct RefreshedTokens {
    access_token: String,
    refresh_token: String,
}

#[tauri::command]
pub async fn refresh_tokens(
    state: tauri::State<'_, NativeAuth>, api_base_url: String, refresh_token: String,
) -> Result<RefreshedTokens, Value> {
    let library = state.0.clone();
    let params = serde_json::json!({ "api_base_url": api_base_url, "refresh_token": refresh_token });
    let value = tauri::async_runtime::spawn_blocking(move || library.call_value("auth.refresh_tokens", params))
        .await
        .map_err(|error| serde_json::json!({ "kind": "internal", "message": error.to_string() }))??;
    serde_json::from_value(value)
        .map_err(|error| serde_json::json!({ "kind": "invalid_response", "message": error.to_string() }))
}
