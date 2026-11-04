fn main() {
    println!("cargo:rerun-if-changed=../modules/gallery/rust/permissions");
    // The hasgard-testing capability is compiled only with that feature, so release builds never grant it.
    let pattern = if std::env::var_os("CARGO_FEATURE_HASGARD_TESTING").is_some() {
        "./capabilities/**/*.json"
    } else {
        "./capabilities/*.json"
    };
    tauri_build::try_build(tauri_build::Attributes::new()
        .plugin("workbonny-gallery", tauri_build::InlinedPlugin::new()
            .commands(&["pick", "restore", "refresh", "image", "open_original", "preview", "close"])
            .permissions_path_pattern("../modules/gallery/rust/permissions/**/*.toml"))
        .capabilities_path_pattern(pattern))
        .expect("failed to build Tauri capabilities");
}
