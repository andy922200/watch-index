/**
 * 執行期的品牌頁面連結組裝。
 *
 * 網址的「結構」（品牌路徑段、語言路徑段、各頁面的檔名）定義在 `lib/pageRoutes.ts`，
 * 與建置期的 `mpa-build.ts` 共用同一份；這支只負責替那份結構補上**執行期專屬**的部分：
 * Vite 的 base path，以及比較頁需要的查詢參數。
 *
 * 換句話說，要改「網址長什麼樣子」請改 `pageRoutes.ts`；要改「連結怎麼被組出來、
 * 帶哪些參數」才改這裡。
 */
import type { BrandId } from '@/lib/brands'
import { MARKET_QUERY_KEY, type MarketCode } from '@/lib/markets'
import { type BrandPage, getBrandPagePublicPath, type PageLanguageCode } from '@/lib/pageRoutes'
import { Locale } from '@/plugins/i18n'

export type { BrandPage }

/** 同一個頁面的各語言版本網址，供語言切換連結使用。 */
export interface BrandPageLanguagePaths {
  /** 英文版網址。 */
  enUs: string
  /** 繁體中文版（預設語言）網址。 */
  zhTw: string
}

interface GetBrandPageUrlOptions {
  /** 目標品牌，決定網址的第一層路徑段。 */
  brandId: BrandId
  /** 目標語系，決定是否加上 `en-us` 這層路徑段。 */
  language: PageLanguageCode
  /** 目標頁面種類。 */
  page: BrandPage
}

interface GetBrandPageLanguagePathsOptions {
  /** 目標品牌，決定網址的第一層路徑段。 */
  brandId: BrandId
  /** 要取得各語言網址的頁面種類。 */
  page: BrandPage
}

interface GetPriceCompareUrlOptions {
  /** 目標品牌，決定網址的第一層路徑段。 */
  brandId: BrandId
  /** 目標語系，決定是否加上 `en-us` 這層路徑段。 */
  language: PageLanguageCode
  /** 比較頁載入時預設選取的市場。 */
  market: MarketCode
  /** 要比較的腕錶跨品牌唯一鍵，例如 `rolex:m126500ln-0001`。 */
  watchId: string
}

/**
 * 取得結尾必定帶有斜線的 Vite base path。
 *
 * `import.meta.env.BASE_URL` 在不同部署設定下可能有或沒有結尾斜線
 * （根目錄部署為 `/`，GitHub Pages 子目錄部署為 `/watch-index/app/`），
 * 統一補上可避免後續字串串接產生 `//` 或缺少分隔的路徑。
 *
 * @returns 結尾帶斜線的 base path。
 */
const getBaseUrl = (): string =>
  import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`

/**
 * 組出可直接放進 `href` 的品牌頁面網址。
 *
 * 就是 `pageRoutes` 的公開路徑再接上 base path，例如 `/watch-index/app/rolex/en-us/`。
 *
 * @param options - 品牌、語系與頁面種類，見 {@link GetBrandPageUrlOptions}。
 * @returns 以 base path 起始的完整頁面網址。
 */
const getBrandPageUrl = ({ brandId, language, page }: GetBrandPageUrlOptions): string =>
  `${getBaseUrl()}${getBrandPagePublicPath({ brandId, language, page })}`

/**
 * 取得同一個頁面的繁中與英文網址，供 `AppNav` 的語言切換連結使用。
 *
 * 因為每個語言是獨立產出的靜態 HTML（讓不執行 JS 的分享預覽服務也能取得
 * 對應語言的 meta），語言切換是真正的頁面跳轉，不是前端狀態切換。
 *
 * @param options - 品牌與頁面種類，見 {@link GetBrandPageLanguagePathsOptions}。
 * @returns 該頁面的各語言網址，見 {@link BrandPageLanguagePaths}。
 */
export const getBrandPageLanguagePaths = ({
  brandId,
  page,
}: GetBrandPageLanguagePathsOptions): BrandPageLanguagePaths => ({
  enUs: getBrandPageUrl({ brandId, language: Locale.enUs, page }),
  zhTw: getBrandPageUrl({ brandId, language: Locale.zhTw, page }),
})

/**
 * 組出指向單錶跨市場比較頁的網址，並以查詢參數帶入目標腕錶與市場。
 *
 * 比較頁在載入時會讀取這兩個參數還原檢視狀態，因此從列表頁跳轉時必須一併帶上，
 * 使用者才能分享或重新整理而不遺失選取的腕錶。
 *
 * @param options - 品牌、語系、市場與腕錶識別碼，見 {@link GetPriceCompareUrlOptions}。
 * @returns 帶有市場與 `watch_id` 查詢參數的比較頁網址。
 */
export const getPriceCompareUrl = ({
  brandId,
  language,
  market,
  watchId,
}: GetPriceCompareUrlOptions): string => {
  const query = new URLSearchParams({ [MARKET_QUERY_KEY]: market, watch_id: watchId })

  return `${getBrandPageUrl({ brandId, language, page: 'price-compare' })}?${query.toString()}`
}
