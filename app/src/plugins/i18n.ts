import { createI18n } from 'vue-i18n'

import { PageLanguage, type PageLanguageCode } from '@/lib/pageRoutes'
import enUs from '@/locales/en-us.json'
import zhTw from '@/locales/zh-tw.json'

/**
 * 語系代碼與網址的語言路徑段是同一件事，因此實際定義放在 `lib/pageRoutes.ts`
 * （那支不相依瀏覽器 API，建置期也能使用）。這裡只轉出前端慣用的 `Locale` 名稱，
 * 讓既有的 `import { Locale } from '@/plugins/i18n'` 維持不變。
 */
export const Locale = PageLanguage

export type LocaleCode = PageLanguageCode

/**
 * 語系現在由靜態頁面路徑決定（預設為繁中根路徑，英文在 /en-us/），而非執行期切換，
 * 這樣爬蟲與 LINE 等不執行 JS 的分享預覽服務也能拿到對應語言的 head 內容。
 */
export const detectLocale = (pathname: string): LocaleCode =>
  pathname.includes(`/${Locale.enUs}/`) ? Locale.enUs : Locale.zhTw

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(window.location.pathname),
  fallbackLocale: Locale.enUs,
  messages: {
    [Locale.enUs]: enUs,
    [Locale.zhTw]: zhTw,
  },
})
