// Copied from ALwith U `src/lib/store.ts` (ledger G19), with `invoke` in place of U's typed bindings:
// `@alwith/module-store`'s StorePort over the named-store commands in `src-tauri/src/named_store.rs`.
import { createStoreClient, type StorePort } from "@alwith/module-store"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"

const port: StorePort = {
  storeEntries: (scope, store) => invoke("store_entries", { scope, store }),
  storeSet: (scope, store, key, value) => invoke("store_set", { scope, store, key, value }),
  storeDelete: (scope, store, key) => invoke("store_delete", { scope, store, key }),
  storeClear: (scope, store) => invoke("store_clear", { scope, store }),
  storeReload: (scope, store) => invoke("store_reload", { scope, store }),
  onStoreChanged: (handler) =>
    listen<{ store: string; key: string; value: unknown }>("store-changed", (event) => handler(event.payload))
}

export const { openStore } = createStoreClient(() => port)
