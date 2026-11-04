use std::{fs, path::{Path, PathBuf}, time::UNIX_EPOCH};
use image::{ImageDecoder, ImageReader};
use serde::Serialize;
use sha2::{Digest, Sha256};

pub type Result<T> = std::result::Result<T, String>;
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry { pub id: String, pub name: String, pub bytes: u64, pub modified: u64 }
pub fn supported(path: &Path) -> bool {
    matches!(path.extension().and_then(|s| s.to_str()).unwrap_or("").to_ascii_lowercase().as_str(), "jpg"|"jpeg"|"png"|"webp"|"gif"|"bmp"|"tif"|"tiff")
}
pub fn scan(root: &Path) -> Result<Vec<Entry>> {
    fn visit(root: &Path, dir: &Path, entries: &mut Vec<Entry>, depth: usize) -> Result<()> {
        if depth > 32 { return Err("文件夹嵌套超过 32 层，请选择更具体的目录".into()); }
        for item in fs::read_dir(dir).map_err(|e| e.to_string())? {
            let item = item.map_err(|e| e.to_string())?;
            let kind = item.file_type().map_err(|e| e.to_string())?;
            if kind.is_symlink() { continue; }
            let path = item.path();
            if kind.is_dir() { visit(root, &path, entries, depth + 1)?; }
            else if kind.is_file() && supported(&path) {
                if entries.len() >= 20000 { return Err("图片超过 20,000 张，请选择更具体的目录".into()); }
                let meta = item.metadata().map_err(|e| e.to_string())?;
                let name = path.strip_prefix(root).map_err(|e| e.to_string())?.to_str().ok_or("不支持非 UTF-8 文件名")?.to_owned();
                entries.push(Entry { id: name.clone(), name, bytes: meta.len(), modified: meta.modified().ok().and_then(|t| t.duration_since(UNIX_EPOCH).ok()).map_or(0, |t| t.as_millis() as u64) });
            }
        }
        Ok(())
    }
    let mut entries = vec![];
    visit(root, root, &mut entries, 0)?;
    entries.sort_by(|a,b| a.name.to_lowercase().cmp(&b.name.to_lowercase()).then(a.name.cmp(&b.name)));
    Ok(entries)
}
pub fn resolve(root: &Path, id: &str) -> Result<PathBuf> {
    let relative = Path::new(id);
    if relative.components().any(|c| !matches!(c, std::path::Component::Normal(_))) { return Err("无效图片路径".into()); }
    let path = root.join(relative).canonicalize().map_err(|e| e.to_string())?;
    if !path.starts_with(root) || !path.is_file() || !supported(&path) { return Err("图片不在已授权文件夹内".into()); }
    Ok(path)
}
pub fn render(root: &Path, id: &str, cache: &Path, thumbnail: bool) -> Result<Vec<u8>> {
    let path = resolve(root, id)?;
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    if metadata.len() > 128 * 1024 * 1024 { return Err("图片文件超过 128 MB，请通过系统应用打开".into()); }
    let key = format!("v3:{:?}:{}:{:?}", path, metadata.len(), metadata.modified());
    let hash = hex::encode(Sha256::digest(key.as_bytes()));
    fs::create_dir_all(cache).map_err(|e| e.to_string())?;
    let thumb_path = cache.join(format!("{hash}-thumb.jpg"));
    let preview_path = cache.join(format!("{hash}-preview.jpg"));
    let destination = if thumbnail { &thumb_path } else { &preview_path };
    if destination.exists() { return fs::read(destination).map_err(|e| e.to_string()); }
    let mut reader = ImageReader::open(&path).map_err(|e| e.to_string())?.with_guessed_format().map_err(|e| e.to_string())?;
    let mut limits = image::Limits::default();
    limits.max_image_width = Some(32768);
    limits.max_image_height = Some(32768);
    limits.max_alloc = Some(256 * 1024 * 1024);
    reader.limits(limits);
    let mut decoder = reader.into_decoder().map_err(|e| format!("无法解码图片：{e}"))?;
    let (w,h) = decoder.dimensions();
    if u64::from(w) * u64::from(h) > 64_000_000 { return Err("图片超过 6400 万像素，请通过系统应用打开".into()); }
    let orientation = decoder.orientation().map_err(|e| e.to_string())?;
    let mut image = image::DynamicImage::from_decoder(decoder).map_err(|e| e.to_string())?;
    image.apply_orientation(orientation);
    // Decode the original only once. Thumbnails are derived from the bounded preview and
    // both sizes are cached, so the filmstrip never decodes the selected full image again.
    let preview = image.thumbnail(2560, 2560).to_rgb8();
    drop(image);
    let scale = (240.0 / preview.width() as f64).min(240.0 / preview.height() as f64).min(1.0);
    let thumb = image::imageops::thumbnail(&preview, (preview.width() as f64 * scale).round().max(1.0) as u32, (preview.height() as f64 * scale).round().max(1.0) as u32);
    fn jpeg(image: &image::RgbImage) -> Result<Vec<u8>> {
        let mut bytes = Vec::new();
        image::codecs::jpeg::JpegEncoder::new_with_quality(&mut bytes, 88).encode_image(image).map_err(|e| e.to_string())?;
        Ok(bytes)
    }
    let preview_bytes = jpeg(&preview)?;
    let thumb_bytes = jpeg(&thumb)?;
    prune(cache, 256 * 1024 * 1024 - (preview_bytes.len() + thumb_bytes.len()) as u64)?;
    for (path,bytes) in [(&preview_path,&preview_bytes),(&thumb_path,&thumb_bytes)] {
        let temporary = path.with_extension("tmp");
        fs::write(&temporary, bytes).map_err(|e| e.to_string())?;
        fs::rename(temporary, path).map_err(|e| e.to_string())?;
    }
    Ok(if thumbnail {thumb_bytes} else {preview_bytes})
}
fn prune(cache: &Path, budget: u64) -> Result<()> {
    let mut files = vec![];
    for file in fs::read_dir(cache).map_err(|e| e.to_string())? {
        let file = file.map_err(|e| e.to_string())?;
        if file.path().extension().and_then(|e| e.to_str()) != Some("jpg") { continue; }
        let meta = file.metadata().map_err(|e| e.to_string())?;
        files.push((meta.modified().ok(), meta.len(), file.path()));
    }
    files.sort_by_key(|f| f.0);
    let mut total: u64 = files.iter().map(|f| f.1).sum();
    for (_, size, path) in files { if total <= budget { break; } fs::remove_file(path).map_err(|e| e.to_string())?; total -= size; }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn scan_render_and_boundaries() {
        let dir = tempfile::tempdir().unwrap(); let root = dir.path().canonicalize().unwrap();
        image::RgbImage::from_pixel(800, 400, image::Rgb([10, 120, 240])).save(root.join("real.png")).unwrap();
        fs::write(root.join("broken.jpg"), b"not an image").unwrap();
        fs::write(root.join("notes.txt"), b"text").unwrap();
        let entries = scan(&root).unwrap(); assert_eq!(entries.len(), 2);
        assert!(resolve(&root, "../escape.jpg").is_err()); assert!(resolve(&root, "/tmp/escape.jpg").is_err());
        let cache = tempfile::tempdir().unwrap();
        let result = render(&root,"real.png",cache.path(),true).unwrap();
        let decoded = image::load_from_memory(&result).unwrap(); assert_eq!((decoded.width(),decoded.height()), (240,120));
        assert_eq!(result, render(&root,"real.png",cache.path(),true).unwrap());
        assert!(render(&root,"broken.jpg",cache.path(),false).is_err());
        fs::remove_file(root.join("real.png")).unwrap(); assert!(render(&root,"real.png",cache.path(),true).is_err());
    }
    #[cfg(unix)]
    #[test] fn refuses_symlink_escape() {
        let dir = tempfile::tempdir().unwrap(); let other = tempfile::tempdir().unwrap();
        fs::write(other.path().join("outside.jpg"), b"outside").unwrap();
        std::os::unix::fs::symlink(other.path().join("outside.jpg"),dir.path().join("link.jpg")).unwrap();
        assert!(scan(dir.path()).unwrap().is_empty()); assert!(resolve(dir.path(),"link.jpg").is_err());
    }
}
