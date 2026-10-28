//! Copied from ALwith U `src-tauri/src/named_store.rs` (ledger G19): the Tauri side of
//! `@alwith/module-store`'s `StorePort`. Belongs in the alwith-module-store crate or the template.
//! Atomic replacement, `.bak` and no silent reset come from the crate; files are
//! `app_data_dir/<name>.json`.

use alwith_module_store::{ScopedStores, Store, StoreScope};
use serde_json::Value;
use tauri::{AppHandle, Emitter, Manager, State};

pub struct NamedStoreState {
    stores: ScopedStores,
}

impl NamedStoreState {
    fn store_in(&self, scope: StoreScope, name: &str) -> Result<std::sync::Arc<Store>, String> {
        self.stores.open(scope, name)
    }
}

pub fn init(app: &AppHandle) -> Result<(), String> {
    let data_directory = app.path().app_data_dir().map_err(|error| error.to_string())?;
    let cache_directory = app.path().app_cache_dir().map_err(|error| error.to_string())?.join("stores");
    std::fs::create_dir_all(&data_directory).map_err(|error| error.to_string())?;
    std::fs::create_dir_all(&cache_directory).map_err(|error| error.to_string())?;
    let state = NamedStoreState { stores: ScopedStores::new(data_directory, cache_directory) };
    // Every named store's changes share one channel, subscribed once.
    let (mut receiver, mut cache_receiver) = state.stores.subscribe();
    let emitter = app.clone();
    tauri::async_runtime::spawn(async move {
        loop {
            let change = tokio::select! {
                data = receiver.recv() => data,
                cache = cache_receiver.recv() => cache
            };
            match change {
                Ok(change) => {
                    let _ = emitter.emit("store-changed", &change);
                }
                Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => {}
                Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
            }
        }
    });
    app.manage(state);
    Ok(())
}

#[tauri::command]
pub fn store_entries(state: State<'_, NamedStoreState>, scope: StoreScope, store: String) -> Result<Value, String> {
    Ok(Value::Object(state.store_in(scope, &store)?.entries().into_iter().collect()))
}

#[tauri::command]
pub fn store_set(
    state: State<'_, NamedStoreState>, scope: StoreScope, store: String, key: String, value: Value,
) -> Result<(), String> {
    state.store_in(scope, &store)?.set(key, value)
}

#[tauri::command]
pub fn store_delete(state: State<'_, NamedStoreState>, scope: StoreScope, store: String, key: String) -> Result<(), String> {
    state.store_in(scope, &store)?.remove(&key)
}

#[tauri::command]
pub fn store_clear(state: State<'_, NamedStoreState>, scope: StoreScope, store: String) -> Result<(), String> {
    state.store_in(scope, &store)?.clear()
}

#[tauri::command]
pub fn store_reload(state: State<'_, NamedStoreState>, scope: StoreScope, store: String) -> Result<(), String> {
    state.store_in(scope, &store)?.reload()
}
