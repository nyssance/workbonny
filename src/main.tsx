import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"
import { AuthGate } from "./auth/auth-gate"
import { initPlatformAuth } from "./auth/store"
import "./i18n"
import "./index.css"
import "./theme"

void initPlatformAuth()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </StrictMode>
)
