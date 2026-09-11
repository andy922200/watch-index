import type { Page, RewriteRule } from 'vite-plugin-virtual-mpa'
import { createPages } from 'vite-plugin-virtual-mpa'

import type { BrandConfig } from './brands.ts'
import {
  type BrandPageLocation,
  getBrandLanguagePrefix,
  getBrandPageFilePath,
  getBrandPagePublicPath,
  PageLanguage,
} from './pageRoutes.ts'

interface CreateMpaConfigOptions {
  isProd: boolean
  base: string
  ghPagesRepoName: string
  ghPagesNamespace: string
  brands: readonly BrandConfig[]
}

interface MpaConfig {
  pages: Page[]
  rewrites: Exclude<RewriteRule, false>
}

/**
 * 繁中（預設）與英文各自產出獨立的靜態 HTML，讓 LINE 等不執行 JS 的分享預覽服務
 * 也能拿到對應語言的 title/description/OG image。
 *
 * 每個品牌各佔一個網址子路徑（如 `/rolex/`、`/omega/`），共用同一份 `base`，
 * 讓多品牌可以在同一次 build 中一起產出。
 *
 * 輸出檔名與對外網址的結構來自 `pageRoutes.ts`，與執行期的 `pageUrls.ts` 共用同一份
 * 定義；這裡只負責補上建置期專屬的部分（站台絕對網址、Vite base、OG meta 與 rewrite）。
 */
export const createMpaConfig = ({
  isProd,
  base,
  ghPagesRepoName,
  ghPagesNamespace,
  brands,
}: CreateMpaConfigOptions): MpaConfig => {
  const sharedRoot = isProd
    ? `https://andy922200.github.io/${ghPagesRepoName}/${ghPagesNamespace}`
    : 'http://localhost:5199'
  // og-image.png 是共用靜態資源，只會被複製到 build 輸出的共用根目錄一份，
  // 因此網址要以 sharedRoot 為準，不能隨品牌子路徑變動。
  const ogImage = `${sharedRoot}/og-image.png`

  /** 對外分享用的絕對網址，供 canonical、hreflang 與 OG meta 使用。 */
  const getAbsoluteUrl = (location: BrandPageLocation): string =>
    `${sharedRoot}/${getBrandPagePublicPath(location)}`

  // 首頁的對外網址是目錄形式（`/rolex/`、`/rolex/en-us/`），不露出 index.html，
  // 因此需要 rewrite 把它對應回實體檔案；dev server 與 preview 都靠這組規則。
  const rewrites: Exclude<RewriteRule, false> = brands.flatMap((brand) =>
    [PageLanguage.enUs, PageLanguage.zhTw].map((language) => {
      const prefix = getBrandLanguagePrefix({ brandId: brand.id, language })

      return {
        from: new RegExp(`^${base}${prefix}/?$`),
        to: `${base}${getBrandPageFilePath({ brandId: brand.id, language, page: 'index' })}`,
      }
    }),
  )

  const pages = createPages(
    brands.flatMap((brand) => {
      const brandId = brand.id
      const indexZhTwUrl = getAbsoluteUrl({ brandId, language: PageLanguage.zhTw, page: 'index' })
      const indexEnUsUrl = getAbsoluteUrl({ brandId, language: PageLanguage.enUs, page: 'index' })
      const compareZhTwUrl = getAbsoluteUrl({
        brandId,
        language: PageLanguage.zhTw,
        page: 'price-compare',
      })
      const compareEnUsUrl = getAbsoluteUrl({
        brandId,
        language: PageLanguage.enUs,
        page: 'price-compare',
      })

      return [
        {
          name: `${brandId}-zh-tw`,
          filename: getBrandPageFilePath({ brandId, language: PageLanguage.zhTw, page: 'index' }),
          entry: brand.entry,
          data: {
            lang: PageLanguage.zhTw,
            siteName: brand.siteName,
            title: brand.title.zhTw,
            description: brand.description.zhTw,
            url: indexZhTwUrl,
            alternateLang: PageLanguage.enUs,
            alternateUrl: indexEnUsUrl,
            defaultUrl: indexZhTwUrl,
            ogImage,
            ogLocale: 'zh_TW',
            ogLocaleAlternate: 'en_US',
          },
        },
        {
          name: `${brandId}-en-us`,
          filename: getBrandPageFilePath({ brandId, language: PageLanguage.enUs, page: 'index' }),
          entry: brand.entry,
          data: {
            lang: PageLanguage.enUs,
            siteName: brand.siteName,
            title: brand.title.enUs,
            description: brand.description.enUs,
            url: indexEnUsUrl,
            alternateLang: PageLanguage.zhTw,
            alternateUrl: indexZhTwUrl,
            defaultUrl: indexZhTwUrl,
            ogImage,
            ogLocale: 'en_US',
            ogLocaleAlternate: 'zh_TW',
          },
        },
        {
          name: `${brandId}-price-compare-zh-tw`,
          filename: getBrandPageFilePath({
            brandId,
            language: PageLanguage.zhTw,
            page: 'price-compare',
          }),
          entry: brand.priceComparePage.entry,
          data: {
            lang: PageLanguage.zhTw,
            siteName: brand.siteName,
            title: brand.priceComparePage.title.zhTw,
            description: brand.priceComparePage.description.zhTw,
            url: compareZhTwUrl,
            alternateLang: PageLanguage.enUs,
            alternateUrl: compareEnUsUrl,
            defaultUrl: compareZhTwUrl,
            ogImage,
            ogLocale: 'zh_TW',
            ogLocaleAlternate: 'en_US',
          },
        },
        {
          name: `${brandId}-price-compare-en-us`,
          filename: getBrandPageFilePath({
            brandId,
            language: PageLanguage.enUs,
            page: 'price-compare',
          }),
          entry: brand.priceComparePage.entry,
          data: {
            lang: PageLanguage.enUs,
            siteName: brand.siteName,
            title: brand.priceComparePage.title.enUs,
            description: brand.priceComparePage.description.enUs,
            url: compareEnUsUrl,
            alternateLang: PageLanguage.zhTw,
            alternateUrl: compareZhTwUrl,
            defaultUrl: compareZhTwUrl,
            ogImage,
            ogLocale: 'en_US',
            ogLocaleAlternate: 'zh_TW',
          },
        },
      ]
    }),
  )

  return { pages, rewrites }
}
