#!/usr/bin/env bun
// Generates the generator-owned files from alwith.app.json: src-tauri/tauri.conf.json and icons.
// Brand is defined once in alwith.app.json; nothing else hand-writes it.
import { $ } from "bun"
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const app = await Bun.file(join(root, "alwith.app.json")).json()
const identifier: string = app.identifier
if (!/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z][A-Za-z0-9-]*){2,}$/.test(identifier)) {
  throw new Error(`alwith.app.json identifier must be a reverse-DNS bundle id, got ${identifier}`)
}

// Icons: the full-bleed source feeds every platform; the macOS .icns is rebuilt from the inset,
// rounded variant (Apple's 824/1024 grid), otherwise the Dock icon shows no margin and square corners.
await $`python3 ${join(root, "scripts/make-icon.py")} ${root}`.quiet()
if (!existsSync(join(root, app.icon))) throw new Error(`alwith.app.json icon not found: ${app.icon}`)

const conf = {
  $schema: "https://schema.tauri.app/config/3.0.0-alpha.3",
  productName: app.productName,
  // The binary name is user-visible in dev (Dock, menu bar), so it carries the product casing.
  mainBinaryName: app.productName,
  version: app.version,
  identifier,
  build: {
    frontendDist: "../dist",
    devUrl: "http://localhost:1420",
    beforeDevCommand: "bun run stage && bun run dev",
    beforeBuildCommand: "bun run stage && bun run build"
  },
  app: {
    windows: [
      {
        label: "main",
        title: app.productName,
        width: app.window.width,
        height: app.window.height,
        minWidth: app.window.minWidth,
        minHeight: app.window.minHeight
      }
    ],
    security: { csp: null }
  },
  bundle: {
    active: true,
    category: "Productivity",
    externalBin: ["binaries/alwith-runtime", "binaries/bun", "binaries/codex", "binaries/codex-code-mode-host"],
    resources: { "resources/adapter": "adapter", "resources/licenses": "licenses" },
    icon: ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.icns", "icons/icon.ico"],
    macOS: { minimumSystemVersion: "26.0", entitlements: "./Entitlements.plist" }
  }
}
await Bun.write(join(root, "src-tauri/tauri.conf.json"), JSON.stringify(conf, null, 2) + "\n")
const icons = join(root, "src-tauri/icons")
await $`bunx tauri icon ${join(root, app.icon)} -o ${icons}`.quiet()
const macIcons = join(icons, "macos-variant")
await $`bunx tauri icon ${join(root, "assets/icon-macos.png")} -o ${macIcons}`.quiet()
await $`cp ${join(macIcons, "icon.icns")} ${join(icons, "icon.icns")}`
await $`rm -rf ${macIcons}`
console.log(`tauri.conf.json + icons generated for ${app.productName} (${identifier})`)
