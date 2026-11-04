fn main() {
    tauri_plugin::Builder::new(&["pick", "restore", "refresh", "image", "open_original", "preview", "close"]).build();
}
