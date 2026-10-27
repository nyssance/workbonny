import { withChatResources } from "@alwith/module-chat/locales"
import i18next from "i18next"
import { initReactI18next } from "react-i18next"

const resources = withChatResources({
  en: { translation: { ready: "Ready", connecting: "Connecting…", placeholder: "Ask Codex…", allow: "Allow" } },
  "zh-CN": { translation: { ready: "就绪", connecting: "连接中…", placeholder: "问 Codex…", allow: "允许" } }
} as never)

void i18next.use(initReactI18next).init({
  resources: resources as never,
  lng: navigator.language.startsWith("zh") ? "zh-CN" : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
})

export default i18next
