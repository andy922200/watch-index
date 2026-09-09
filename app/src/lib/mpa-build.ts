import type { Page, RewriteRule } from 'vite-plugin-virtual-mpa'
import { createPages } from 'vite-plugin-virtual-mpa'

import type { BrandConfig } from './brands.ts'

interface CreateMpaConfigOptions {
  isProd: boolean
  base: string
  ghPagesRepoName: string
  ghPagesNamespace: string
  brands: BrandConfig[]
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

  const rewrites: Exclude<RewriteRule, false> = brands.flatMap((brand) => [
    { from: new RegExp(`^${base}${brand.id}/en-us/?$`), to: `${base}${brand.id}/en-us/index.html` },
    { from: new RegExp(`^${base}${brand.id}/?$`), to: `${base}${brand.id}/index.html` },
  ])

  const pages = createPages(
    brands.flatMap((brand) => {
      const siteUrl = `${sharedRoot}/${brand.id}`
      const zhTwUrl = `${siteUrl}/`
      const enUrl = `${siteUrl}/en-us/`

      return [
        {
          name: `${brand.id}-zh-tw`,
          filename: `${brand.id}/index.html`,
          entry: brand.entry,
          data: {
            lang: 'zh-tw',
            siteName: brand.siteName,
            title: brand.title.zhTw,
            description: brand.description.zhTw,
            url: zhTwUrl,
            alternateLang: 'en-us',
            alternateUrl: enUrl,
            defaultUrl: zhTwUrl,
            ogImage,
            ogLocale: 'zh_TW',
            ogLocaleAlternate: 'en_US',
          },
        },
        {
          name: `${brand.id}-en-us`,
          filename: `${brand.id}/en-us/index.html`,
          entry: brand.entry,
          data: {
            lang: 'en-us',
            siteName: brand.siteName,
            title: brand.title.enUs,
            description: brand.description.enUs,
            url: enUrl,
            alternateLang: 'zh-tw',
            alternateUrl: zhTwUrl,
            defaultUrl: zhTwUrl,
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
