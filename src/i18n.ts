import { withChatResources } from "@alwith/module-chat/locales"
import i18next from "i18next"
import { initReactI18next } from "react-i18next"

const resources = withChatResources({
  en: { translation: { ready: "Ready", connecting: "Connecting…", placeholder: "Ask Codex…", allow: "Allow", newChat: "New chat", settings: "Settings", untitled: "New conversation", leadingTitle: "Your WorkBonny", leadingBody: "This screen is yours: describe the pages and business you want and your coding agent builds them here." } },
  "zh-CN": { translation: { ready: "就绪", connecting: "连接中…", placeholder: "问 Codex…", allow: "允许", newChat: "新对话", settings: "设置", untitled: "新对话", leadingTitle: "你的 WorkBonny", leadingBody: "这一屏是你的：描述你想要的页面和业务，编程 Agent 会把它们做到这里。" } }
} as never)

void i18next.use(initReactI18next).init({
  resources: resources as never,
  lng: navigator.language.startsWith("zh") ? "zh-CN" : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
})

export default i18next
