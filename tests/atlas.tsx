import { createRoot } from "react-dom/client"
import { Shell } from "../src/layout/shell"
import "../src/index.css"
import "../src/i18n"

createRoot(document.getElementById("root")!).render(
  <Shell region="workspace" navigation={<div>Navigation</div>} leading={<div>Leading</div>}>
    <div>Workspace</div>
  </Shell>
)
