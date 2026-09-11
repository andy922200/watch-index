/**
 * 品牌頁面網址結構的唯一定義來源。
 *
 *
 * 同一組網址會被兩個**執行環境不同**的地方用到：
 *
 * - 建置期：`mpa-build.ts` 在 Node 裡決定靜態 HTML 的輸出檔名，以及 OG meta 用的絕對網址。
 * - 執行期：`pageUrls.ts` 在瀏覽器裡組出頁面之間的連結。
 *
 * 這兩邊**無法合併成同一支模組**，因為各自相依的東西在對方的環境不存在：
 *
 * - `plugins/i18n.ts` 在 module top-level 就會讀 `window.location`，Node 端一 import 就會壞。
 * - `import.meta.env.BASE_URL` 只有 Vite 注入到瀏覽器 bundle 時才存在。
 * - `vite-plugin-virtual-mpa` 是建置工具，不應該進到瀏覽器 bundle。
 *
 * 所以改為把「網址長什麼樣子」這件事抽到這裡，兩邊各自 import。
 * 一旦只改了其中一邊，建置產出的檔名就會跟頁面上的連結對不起來——
 * 而且本地 dev 有 rewrite 規則兜著，這種錯往往要到部署後才會以 404 浮現。
 *
 * ## 使用方式
 *
 * 這裡回傳的路徑一律**不含前綴、不以斜線開頭**，由呼叫端自己接上：
 * 建置期接站台絕對網址（`https://.../`），執行期接 Vite base path（`/watch-index/app/`）。
 *
 * 為了能同時被 Node 與瀏覽器 import，這支刻意保持零執行期相依：
 * 不 import i18n、不讀 `import.meta.env`、不碰任何 Vite plugin。
 * 新增東西到這裡時請維持這個限制。
 */

/**
 * 頁面語言。它的值同時就是網址中的語言路徑段，兩者是同一件事——
 * `plugins/i18n.ts` 的 `detectLocale()` 正是靠比對網址裡的這個字串來決定語系。
 */
export const PageLanguage = {
  enUs: 'en-us',
  zhTw: 'zh-tw',
} as const

export type PageLanguageCode = (typeof PageLanguage)[keyof typeof PageLanguage]

/**
 * 品牌底下的頁面種類。與品牌無關：每個品牌都有相同的這幾種頁面。
 *
 * - `index`：品牌首頁。
 * - `price-compare`：單錶跨市場比較頁。
 */
export type BrandPage = 'index' | 'price-compare'

/**
 * 各頁面種類實際產出的靜態 HTML 檔名。
 *
 * 型別收斂成 `.html` 結尾，是為了滿足 `vite-plugin-virtual-mpa` 對 `Page.filename`
 * 的要求，順帶讓「頁面一定是靜態 HTML」這個前提由型別而非註解來保證。
 */
const PageFilename: Record<BrandPage, `${string}.html`> = {
  index: 'index.html',
  'price-compare': 'watch-price-compare.html',
}

/**
 * 用來指定「哪個品牌、哪個語言、哪一種頁面」，三者合起來唯一決定一個頁面。
 *
 * `brandId` 刻意是 `string` 而非 `lib/brands.ts` 的 `BrandId`：這支只負責把字串組成路徑，
 * 不該管專案目前有哪些品牌（`mpa-build.ts` 拿到的也是泛型的 `BrandConfig[]`）。
 * 「只能是已登錄的品牌」這個約束由對外的 `pageUrls.ts` 在其 API 邊界上把關。
 */
export interface BrandPageLocation {
  brandId: string
  language: PageLanguageCode
  page: BrandPage
}

/**
 * 組出品牌與語言的路徑前綴，**結尾不帶斜線**，例如 `rolex` 或 `rolex/en-us`。
 *
 * 繁中是預設語言，直接放在品牌根目錄，不額外加語言路徑段；英文才多一層 `en-us`。
 * 結尾不帶斜線是為了讓呼叫端能自由決定要接 `/`（目錄形式）還是 `/檔名`，
 * `mpa-build.ts` 的 rewrite 規則也需要這個不含斜線的形式來組正規表達式。
 *
 * @param options - 品牌與語言，見 {@link BrandPageLocation}（此函式用不到 `page`）。
 * @returns 不以斜線開頭、結尾也不帶斜線的路徑前綴。
 */
export const getBrandLanguagePrefix = ({
  brandId,
  language,
}: Omit<BrandPageLocation, 'page'>): string =>
  language === PageLanguage.enUs ? `${brandId}/${PageLanguage.enUs}` : brandId

/**
 * 靜態 HTML 的輸出檔案路徑，例如 `rolex/en-us/watch-price-compare.html`。
 *
 * 一律帶檔名，因為建置產出的是實體檔案。這是給 `mpa-build.ts` 決定 `filename` 用的。
 *
 * @param options - 品牌、語言與頁面種類，見 {@link BrandPageLocation}。
 * @returns 不以斜線開頭、必定以 `.html` 結尾的檔案路徑。
 */
export const getBrandPageFilePath = ({
  brandId,
  language,
  page,
}: BrandPageLocation): `${string}.html` =>
  `${getBrandLanguagePrefix({ brandId, language })}/${PageFilename[page]}`

/**
 * 對外公開的網址路徑，例如 `rolex/en-us/` 或 `rolex/watch-price-compare.html`。
 *
 * 與 {@link getBrandPageFilePath} 的唯一差別在首頁：首頁對外是目錄形式（結尾斜線、
 * 不露出 `index.html`），再由 `mpa-build.ts` 設定的 rewrite 規則對應回實體檔案。
 * 其餘頁面兩者相同。
 *
 * @param options - 品牌、語言與頁面種類，見 {@link BrandPageLocation}。
 * @returns 不以斜線開頭的網址路徑。
 */
export const getBrandPagePublicPath = ({ brandId, language, page }: BrandPageLocation): string => {
  const prefix = getBrandLanguagePrefix({ brandId, language })

  return page === 'index' ? `${prefix}/` : `${prefix}/${PageFilename[page]}`
}

/**
 * 把一個既有的網址路徑換成另一個語言的版本，例如
 * `/watch-index/app/rolex/watch-price-compare.html` 轉成
 * `/watch-index/app/rolex/en-us/watch-price-compare.html`。
 *
 * 與上面幾個函式的差別是它「改寫既有路徑」而非「從零組出路徑」，用在只知道目前網址、
 * 不知道 base 與品牌的情境（例如 `AppNav` 在沒有拿到 `languagePaths` 時的退路）。
 * 它靠的是同一個結構事實：語言路徑段固定緊鄰在檔名之前（首頁則在結尾），
 * 因此不需要知道前面有多少層 base 或品牌路徑。
 *
 * @param options - 要改寫的路徑與目標語言。
 * @returns 目標語言版本的路徑，開頭與結尾形式（目錄或檔名）與傳入值一致。
 */
export const toLanguagePathname = ({
  pathname,
  language,
}: {
  pathname: string
  language: PageLanguageCode
}): string => {
  // 先一律還原成預設語言（繁中）的形式，再視需要加回語言路徑段，
  // 這樣不論傳入的是哪個語言版本，結果都相同。
  const defaultLanguagePathname = pathname.replace(`/${PageLanguage.enUs}/`, '/')

  if (language === PageLanguage.zhTw) {
    return defaultLanguagePathname
  }

  const lastSlashIndex = defaultLanguagePathname.lastIndexOf('/')
  const directory = defaultLanguagePathname.slice(0, lastSlashIndex + 1)
  const filename = defaultLanguagePathname.slice(lastSlashIndex + 1)

  return `${directory}${PageLanguage.enUs}/${filename}`
}
