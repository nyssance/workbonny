mod runtime;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .runtime(tauri_runtime_wry::Wry::default())
        .plugin(tauri_plugin_log::Builder::new().level(log::LevelFilter::Info).build())
        .manage(runtime::RuntimeState::default())
        .invoke_handler(tauri::generate_handler![runtime::runtime_start, runtime::runtime_send])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                runtime::shutdown_blocking(window.app_handle());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
