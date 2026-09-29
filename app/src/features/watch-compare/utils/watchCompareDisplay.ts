/**
 * WatchComparePage 專用的顯示文字組裝。
 *
 * 翻譯、locale 一律由呼叫端傳入參數，而不是在這裡呼叫 `useI18n()`，讓這些函式仍可脫離 Vue
 * context 被單元測試涵蓋。
 */
import { formatCurrency, formatMediumDate } from '@/lib/formatters'
import { hasPublicPrice, PriceTypeLabelKeys } from '@/lib/watchPriceComparison'
import type { BaseWatch, WatchCatalog } from '@/types/watch-data'

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string
export type TranslationExistsFn = (key: string) => boolean

export interface CompareColumn {
  id: string
  brandId: string | null
  catalog: WatchCatalog<BaseWatch> | null
  watch: BaseWatch | null
}

export interface CompareColumnDisplay extends CompareColumn {
  brandLabel: string
  referenceLabel: string
}

export type CompareCell =
  | { kind: 'text'; text: string }
  | {
      kind: 'price'
      amountText: string
      typeLabel: string
      showTypeLabel: boolean
      showRetailerOnly: boolean
      retailerOnlyLabel: string
      updatedLabel: string | null
    }

export interface CompareRow {
  key: string
  label: string
  cells: CompareCell[]
}

/** 取得品牌顯示名稱的翻譯文字；未知品牌時回傳「未提供」文案。 */
export const getBrandDisplayName = (id: string | null, { t }: { t: TranslateFn }): string =>
  id ? t(`home.brands.${id}.name`) : t('site.explorer.notProvided')

/**
 * 取得系列（collection）的顯示標籤；若 locale 中沒有對應翻譯，直接回傳原始 id 作為後備文字。
 */
export const getCollectionLabel = (
  id: string,
  { t, te }: { t: TranslateFn; te: TranslationExistsFn },
): string => (te(`site.watchCollection.${id}`) ? t(`site.watchCollection.${id}`) : id)

/** 取得該欄目前顯示金額所依據的價格類型標示（含稅／未稅／無稅）。 */
export const getPriceTypeLabel = (column: CompareColumn, { t }: { t: TranslateFn }): string => {
  if (!column.catalog) return t('site.explorer.missingLocal')
  return t(PriceTypeLabelKeys[column.catalog.priceMarket.priceType])
}

/** 組出該欄的顯示價格文字；沒有公開價格或缺資料時回傳對應的缺價文案。 */
export const getPriceText = (
  column: CompareColumn,
  { t, intlLocale }: { t: TranslateFn; intlLocale: string },
): string => {
  if (!column.watch || !column.catalog) return t('site.explorer.missingLocal')
  if (!hasPublicPrice(column.watch.priceStatus) || column.watch.price === null)
    return t('site.explorer.priceUnavailable')
  return formatCurrency({
    amount: column.watch.price,
    currency: column.catalog.priceMarket.currencyCode,
    locale: intlLocale,
    minimumFractionDigits: 0,
  })
}

/** 取得錶殼或錶盤描述文字；缺資料時回傳「未提供」文案。 */
export const getDetailText = (
  column: CompareColumn,
  key: 'caseDescription' | 'dialDescription',
  { t }: { t: TranslateFn },
): string => column.watch?.[key] || t('site.explorer.notProvided')

/**
 * 把每欄會重複用到的品牌名稱、參考編號預先算成字串，避免 template 對同一欄重複呼叫
 * 相同的格式化邏輯（例如圖片 fallback、`alt`、品牌名稱段落各自呼叫一次）。
 */
export const buildColumnDisplays = (
  columns: readonly CompareColumn[],
  { t }: { t: TranslateFn },
): CompareColumnDisplay[] =>
  columns.map((column) => ({
    ...column,
    brandLabel: getBrandDisplayName(column.brandId, { t }),
    referenceLabel: column.watch?.reference ?? column.id,
  }))

/** 組出「price」列在單一欄下的完整顯示內容，含價格類型、retailer-only 提示與更新日期。 */
const buildPriceCell = (
  column: CompareColumnDisplay,
  { t, intlLocale }: { t: TranslateFn; intlLocale: string },
): CompareCell => ({
  kind: 'price',
  amountText: getPriceText(column, { t, intlLocale }),
  typeLabel: getPriceTypeLabel(column, { t }),
  showTypeLabel: column.watch !== null,
  showRetailerOnly: column.watch?.priceStatus === 'retailer-only',
  retailerOnlyLabel: t('site.explorer.retailerOnly'),
  updatedLabel: column.catalog
    ? t('site.explorer.updated', {
        date: formatMediumDate(column.catalog.priceUpdatedAt, intlLocale),
      })
    : null,
})

/**
 * 組出比較表 body 的每一列資料：列定義與每欄要顯示的內容都在這裡一次決定好，
 * template 只需要照著 `cells` 印出已經決定好的值。
 */
export const buildCompareRows = (
  columns: readonly CompareColumnDisplay[],
  { t, te, intlLocale }: { t: TranslateFn; te: TranslationExistsFn; intlLocale: string },
): CompareRow[] => {
  const textRow = (
    key: string,
    label: string,
    resolve: (column: CompareColumnDisplay) => string,
  ): CompareRow => ({
    key,
    label,
    cells: columns.map((column) => ({ kind: 'text', text: resolve(column) })),
  })

  return [
    textRow('brand', t('site.explorer.brand'), (column) => column.brandLabel),
    textRow('collection', t('site.explorer.collection'), (column) =>
      column.watch
        ? getCollectionLabel(column.watch.collectionId, { t, te })
        : t('site.explorer.missingLocal'),
    ),
    textRow(
      'model',
      t('site.explorer.model'),
      (column) => column.watch?.modelName || t('site.explorer.notProvided'),
    ),
    textRow('reference', t('site.explorer.reference'), (column) => column.referenceLabel),
    {
      key: 'price',
      label: t('site.explorer.price'),
      cells: columns.map((column) => buildPriceCell(column, { t, intlLocale })),
    },
    textRow('case', t('site.explorer.case'), (column) =>
      getDetailText(column, 'caseDescription', { t }),
    ),
    textRow('dial', t('site.explorer.dial'), (column) =>
      getDetailText(column, 'dialDescription', { t }),
    ),
    textRow('nicknames', t('site.explorer.nicknames'), (column) =>
      column.watch?.localNicknames.length
        ? column.watch.localNicknames.join(' · ')
        : t('site.explorer.notProvided'),
    ),
  ]
}
