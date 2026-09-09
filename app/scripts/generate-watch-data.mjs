import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 此腳本將 repo 的原始 catalog 轉成前端可直接查詢的靜態資料庫。
 *
 * 輸出包含兩種檔案：
 * - `catalog.<content-hash>.json`：真正的資料；檔名隨內容變更，可安全快取。
 * - `manifest.json`：指向目前 catalog 檔名的小型索引；前端會先讀取它。
 */
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const appDirectory = resolve(scriptDirectory, '..')
const projectDirectory = resolve(appDirectory, '..')
const catalogPath = resolve(projectDirectory, 'data/catalog/rolex-catalog.json')
const marketsDirectory = resolve(projectDirectory, 'data/markets')
const historyDirectory = resolve(projectDirectory, 'data/history')

// production build 寫到 dist；dev 與 E2E 則傳入 public/watch-data，讓 Vite 能直接服務。
const outputDirectoryArgumentIndex = process.argv.indexOf('--output-directory')
const requestedOutputDirectory =
  outputDirectoryArgumentIndex === -1 ? null : process.argv[outputDirectoryArgumentIndex + 1]

if (outputDirectoryArgumentIndex !== -1 && !requestedOutputDirectory) {
  throw new Error('Expected a directory after --output-directory')
}

const outputDirectory = resolve(appDirectory, requestedOutputDirectory ?? 'dist/watch-data')

// 原始 catalog 是資料收集流程的輸出；此處只負責將它轉換為前端讀取最佳化的格式。
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
const [marketFiles, historyDirectories] = await Promise.all([
  readdir(marketsDirectory, { withFileTypes: true }),
  readdir(historyDirectory, { withFileTypes: true }),
])

const [markets, histories] = await Promise.all([
  Promise.all(
    marketFiles
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map(async (entry) =>
        JSON.parse(await readFile(resolve(marketsDirectory, entry.name), 'utf8')),
      ),
  ),
  Promise.all(
    historyDirectories
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const historyPath = resolve(historyDirectory, entry.name, 'rolex-price-history.json')

        return JSON.parse(await readFile(historyPath, 'utf8'))
      }),
  ),
])

const historiesByMarketCode = new Map(histories.map((history) => [history.marketCode, history]))

/**
 * 將全市場共用的產品 catalog，與指定市場的在地文案及最新價格合併成前端資料。
 *
 * 每個市場各自保留型號名稱、錶殼／面盤描述、暱稱、幣別與稅別；共用的型號、圖片及
 * 系列資料則取自原始 catalog。缺少任何一筆必要市場資料時立即失敗，避免輸出不完整
 * 的市場檔案。
 *
 * @param {object} market - `data/markets` 中單一市場的原始資料。
 * @param {string} market.marketCode - ISO 市場代碼，例如 `TW` 或 `JP`。
 * @param {Array<object>} market.watches - 以型號為單位的在地化錶款資料。
 * @returns {object} 可直接由前端驗證與顯示的單一市場 catalog。
 * @throws {Error} 市場缺少價格歷程、收集時間或任一型號資料時拋出錯誤。
 */
const createCatalog = (market) => {
  const priceHistory = historiesByMarketCode.get(market.marketCode)

  if (!priceHistory) {
    throw new Error(`Price history is missing ${market.marketCode}`)
  }

  const priceUpdatedAt = priceHistory.collectionRuns
    .map((run) => run.collectedAt)
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0]

  if (typeof priceUpdatedAt !== 'string') {
    throw new Error(`${market.marketCode} price history does not contain a collection run date`)
  }

  const marketWatchesByReference = new Map(
    market.watches.map((watch) => [watch.modelReference, watch]),
  )

  const watches = catalog.watches.map((watch) => {
    const marketWatch = marketWatchesByReference.get(watch.modelReference)
    const priceRecord = priceHistory.priceSeries[watch.modelReference]?.at(-1)

    if (!marketWatch || !priceRecord) {
      throw new Error(`${market.marketCode} market data is missing ${watch.modelReference}`)
    }

    if (
      typeof marketWatch.modelName !== 'string' ||
      typeof marketWatch.caseDescription !== 'string' ||
      typeof marketWatch.dialDescription !== 'string' ||
      !Array.isArray(marketWatch.localNicknames?.names) ||
      !marketWatch.localNicknames.names.every((nickname) => typeof nickname === 'string')
    ) {
      throw new Error(`${market.marketCode} market data is invalid for ${watch.modelReference}`)
    }

    return {
      ...watch,
      modelName: marketWatch.modelName,
      caseDescription: marketWatch.caseDescription,
      dialDescription: marketWatch.dialDescription,
      localNicknames: marketWatch.localNicknames.names,
      price: priceRecord.price,
      priceStatus: priceRecord.listingStatus,
    }
  })

  const collectionCounts = new Map()
  for (const watch of watches) {
    collectionCounts.set(watch.collectionId, (collectionCounts.get(watch.collectionId) ?? 0) + 1)
  }

  return {
    schemaVersion: 3,
    collectedAt: catalog.collectedAt,
    watchCount: catalog.watchCount,
    collections: [...collectionCounts]
      .map(([id, watchCount]) => ({ id, watchCount }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    priceMarket: {
      code: priceHistory.marketCode,
      currencyCode: priceHistory.currencyCode,
      priceType: priceHistory.priceType,
      taxRatePercent: priceHistory.taxRatePercent,
    },
    priceUpdatedAt,
    watchesByReference: Object.fromEntries(watches.map((watch) => [watch.modelReference, watch])),
  }
}

/**
 * 將單一市場 catalog 序列化並以內容雜湊產生檔名。
 *
 * 檔名只依最終 payload 決定，因此資料未變時可重用快取；資料變更時 URL 會隨之變更。
 *
 * @param {object} market - `data/markets` 中單一市場的原始資料。
 * @param {string} market.marketCode - ISO 市場代碼。
 * @returns {{marketCode: string, fileName: string, payload: string}} 市場代碼、版本化檔名與 JSON 內容。
 */
const createVersionedCatalog = (market) => {
  const payload = JSON.stringify(createCatalog(market))
  const contentHash = createHash('sha256').update(payload).digest('hex').slice(0, 12)

  return { marketCode: market.marketCode, fileName: `catalog.${contentHash}.json`, payload }
}

const marketCatalogs = markets.map(createVersionedCatalog)

const supportedCurrencies = [
  ...new Set(
    markets.map((market) => {
      const priceHistory = historiesByMarketCode.get(market.marketCode)

      if (!priceHistory || typeof priceHistory.currencyCode !== 'string') {
        throw new Error(`Price history is missing a currency for ${market.marketCode}`)
      }

      return priceHistory.currencyCode
    }),
  ),
].sort()

const catalogFileNames = Object.fromEntries(
  marketCatalogs.map(({ marketCode, fileName }) => [marketCode, fileName]),
)
const taiwanCatalog = catalogFileNames.TW

if (!taiwanCatalog) {
  throw new Error('Market catalog does not contain Taiwan')
}

/**
 * 建立前端唯一固定讀取的 manifest。
 *
 * `catalog` 維持指向預設台灣市場，供既有載入流程相容使用；`catalogs` 則讓市場切換
 * 時能依市場代碼按需取得對應的版本化資料檔。
 *
 * @param {Record<string, string>} catalogs - 市場代碼至版本化 catalog 檔名的對照表。
 * @param {string} defaultCatalog - 預設市場的 catalog 檔名。
 * @param {string[]} currencies - 由各市場價格歷史取得的去重幣別清單。
 * @returns {string} 可寫入 `manifest.json` 的 JSON 字串。
 */
const createManifest = (catalogs, defaultCatalog, currencies) =>
  JSON.stringify({
    schemaVersion: 3,
    catalog: defaultCatalog,
    catalogs,
    currencies,
  })

const manifest = createManifest(catalogFileNames, taiwanCatalog, supportedCurrencies)

// 先移除舊 hash 檔，避免部署產物或 dev public 目錄殘留不再被 manifest 指向的資料。
await rm(outputDirectory, { force: true, recursive: true })
await mkdir(outputDirectory, { recursive: true })

// 兩個檔案同時寫入；manifest 是前端尋找目前版本 catalog 的唯一固定入口。
await Promise.all([
  ...marketCatalogs.map(({ fileName, payload }) =>
    writeFile(resolve(outputDirectory, fileName), payload),
  ),
  writeFile(resolve(outputDirectory, 'manifest.json'), manifest),
])
