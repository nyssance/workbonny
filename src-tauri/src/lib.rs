mod runtime;

use tauri::Manager;

pub fn run() {
    let context = tauri::generate_context!();
    let builder = tauri::Builder::default()
        .runtime(tauri_runtime_wry::Wry::default())
        .plugin(tauri_plugin_log::Builder::new().level(log::LevelFilter::Info).build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_alwith_desktop_shell::init("en"))
        .plugin(alwith_module_store::tauri::init())
        .plugin(alwith_auth_client::tauri::init(Some(
            std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources/native")
        )));
    // GitHub Releases 签名更新：只有 alwith.app.json 声明了 `updates`、生成的配置里才有 plugins.updater；
    // 更新器插件没有公钥会拒绝初始化，所以只在那时注册。
    let builder = if tauri_plugin_alwith_desktop_shell::updates_configured(context.config()) {
        builder.plugin(tauri_plugin_updater::Builder::new().build())
    } else {
        builder
    };
    #[cfg(feature = "hasgard-testing")]
    let builder = builder.plugin(tauri_plugin_hasgard::init());
    builder
        .manage(runtime::RuntimeState::default())
        .invoke_handler(tauri::generate_handler![
            runtime::runtime_start,
            runtime::runtime_send
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                runtime::shutdown_blocking(window.app_handle());
            }
        })
        .run(context)
        .expect("error while running tauri application");
}
