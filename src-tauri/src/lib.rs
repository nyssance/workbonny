mod auth;
mod named_store;
mod runtime;

use tauri::Manager;

pub fn run() {
    let builder = tauri::Builder::default()
        .runtime(tauri_runtime_wry::Wry::default())
        .plugin(tauri_plugin_log::Builder::new().level(log::LevelFilter::Info).build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init());
    #[cfg(feature = "hasgard-testing")]
    let builder = builder.plugin(tauri_plugin_hasgard::init());
    builder
        .manage(runtime::RuntimeState::default())
        .setup(|app| {
            named_store::init(app.handle())?;
            app.manage(auth::NativeAuth::load(app.handle())?);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            runtime::runtime_start,
            runtime::runtime_send,
            auth::refresh_tokens,
            named_store::store_entries,
            named_store::store_set,
            named_store::store_delete,
            named_store::store_clear,
            named_store::store_reload
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                runtime::shutdown_blocking(window.app_handle());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
