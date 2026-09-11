import { createHash } from 'node:crypto'
import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 此腳本將 repo 的原始 catalog 轉成前端可直接查詢的靜態資料庫。
 *
 * 輸出包含三種檔案：
 * - `catalog.<content-hash>.json`：單一市場的在地化 catalog。
 * - `comparison.<content-hash>.json`：單一錶款跨市場比較所需的精簡價格矩陣。
 * - `manifest.json`：指向目前版本化檔案的小型索引。
 */
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const appDirectory = resolve(scriptDirectory, '..')
const projectDirectory = resolve(appDirectory, '..')
const catalogPath = resolve(projectDirectory, 'data/catalog/rolex-catalog.json')
const marketsDirectory = resolve(projectDirectory, 'data/markets')
const historyDirectory = resolve(projectDirectory, 'data/history')
const travelerRefundPoliciesPath = resolve(projectDirectory, 'data/traveler-refund-policies.json')

// production build 寫到 dist；dev 與 E2E 則傳入 public/watch-data，讓 Vite 能直接服務。
const outputDirectoryArgumentIndex = process.argv.indexOf('--output-directory')
const requestedOutputDirectory =
  outputDirectoryArgumentIndex === -1 ? null : process.argv[outputDirectoryArgumentIndex + 1]

if (outputDirectoryArgumentIndex !== -1 && !requestedOutputDirectory) {
  throw new Error('Expected a directory after --output-directory')
}

const outputDirectory = resolve(appDirectory, requestedOutputDirectory ?? 'dist/watch-data')

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

const isValidDate = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value))

const assertValidTravelerRefundPolicies = async ({ policies, marketCodes }) => {
  if (!isRecord(policies) || policies.schemaVersion !== 1 || !Array.isArray(policies.policies)) {
    throw new Error('Traveler refund policies have an invalid format')
  }

  const policiesByMarketCode = new Map()

  for (const policy of policies.policies) {
    if (
      !isRecord(policy) ||
      typeof policy.marketCode !== 'string' ||
      !marketCodes.has(policy.marketCode) ||
      (policy.effectiveFrom !== null && !isValidDate(policy.effectiveFrom)) ||
      (policy.effectiveTo !== null && !isValidDate(policy.effectiveTo)) ||
      !isValidDate(policy.assessedAt) ||
      (policy.availability !== 'available' && policy.availability !== 'unavailable') ||
      !isRecord(policy.eligibilitySummary) ||
      typeof policy.eligibilitySummary.zhTw !== 'string' ||
      policy.eligibilitySummary.zhTw.length === 0 ||
      typeof policy.eligibilitySummary.enUs !== 'string' ||
      policy.eligibilitySummary.enUs.length === 0 ||
      (typeof policy.merchantParticipationRequired !== 'boolean' &&
        policy.merchantParticipationRequired !== null) ||
      (typeof policy.exportValidationRequired !== 'boolean' &&
        policy.exportValidationRequired !== null) ||
      typeof policy.evidencePath !== 'string' ||
      !Array.isArray(policy.sources) ||
      policy.sources.length === 0
    ) {
      throw new Error('Traveler refund policy has an invalid format')
    }

    if (policiesByMarketCode.has(policy.marketCode)) {
      throw new Error(`Traveler refund policy is duplicated for ${policy.marketCode}`)
    }

    for (const source of policy.sources) {
      if (
        !isRecord(source) ||
        typeof source.publisher !== 'string' ||
        source.publisher.length === 0 ||
        typeof source.title !== 'string' ||
        source.title.length === 0 ||
        typeof source.url !== 'string' ||
        !URL.canParse(source.url) ||
        !isValidDate(source.accessedAt)
      ) {
        throw new Error(`Traveler refund policy source is invalid for ${policy.marketCode}`)
      }
    }

    await access(resolve(projectDirectory, policy.evidencePath))
    policiesByMarketCode.set(policy.marketCode, policy)
  }

  return policiesByMarketCode
}

const [catalog, marketFiles, historyDirectories, travelerRefundPolicies] = await Promise.all([
  readFile(catalogPath, 'utf8').then(JSON.parse),
  readdir(marketsDirectory, { withFileTypes: true }),
  readdir(historyDirectory, { withFileTypes: true }),
  readFile(travelerRefundPoliciesPath, 'utf8').then(JSON.parse),
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
const marketCodes = new Set(markets.map((market) => market.marketCode))
const travelerRefundPoliciesByMarketCode = await assertValidTravelerRefundPolicies({
  policies: travelerRefundPolicies,
  marketCodes,
})

if (catalog.brandId !== 'rolex') {
  throw new Error('Rolex catalog does not declare brandId "rolex"')
}

const getPriceHistory = (marketCode) => {
  const priceHistory = historiesByMarketCode.get(marketCode)

  if (!priceHistory) {
    throw new Error(`Price history is missing ${marketCode}`)
  }

  return priceHistory
}

const getPriceUpdatedAt = (priceHistory) => {
  const priceUpdatedAt = priceHistory.collectionRuns
    .map((run) => run.collectedAt)
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0]

  if (typeof priceUpdatedAt !== 'string') {
    throw new Error(
      `${priceHistory.marketCode} price history does not contain a collection run date`,
    )
  }

  return priceUpdatedAt
}

/**
 * 將全市場共用的產品 catalog，與指定市場的在地文案及最新價格合併成前端資料。
 *
 * @param {object} market - `data/markets` 中單一市場的原始資料。
 * @returns {object} 可直接由前端驗證與顯示的單一市場 catalog。
 * @throws {Error} 市場缺少價格歷程、收集時間或任一型號資料時拋出錯誤。
 */
const createCatalog = (market) => {
  const priceHistory = getPriceHistory(market.marketCode)

  if (market.brandId !== catalog.brandId || priceHistory.brandId !== catalog.brandId) {
    throw new Error(`${market.marketCode} market data has an inconsistent brandId`)
  }

  const marketWatchesById = new Map(market.watches.map((watch) => [watch.watchId, watch]))
  const watches = catalog.watches.map((watch) => {
    const marketWatch = marketWatchesById.get(watch.watchId)
    const priceRecord = priceHistory.priceSeries[watch.watchId]?.at(-1)

    if (!marketWatch || !priceRecord) {
      throw new Error(`${market.marketCode} market data is missing ${watch.watchId}`)
    }

    if (
      typeof marketWatch.modelName !== 'string' ||
      typeof marketWatch.caseDescription !== 'string' ||
      typeof marketWatch.dialDescription !== 'string' ||
      !Array.isArray(marketWatch.localNicknames?.names) ||
      !marketWatch.localNicknames.names.every((nickname) => typeof nickname === 'string')
    ) {
      throw new Error(`${market.marketCode} market data is invalid for ${watch.watchId}`)
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
    schemaVersion: 5,
    brandId: catalog.brandId,
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
    priceUpdatedAt: getPriceUpdatedAt(priceHistory),
    watchesById: Object.fromEntries(watches.map((watch) => [watch.watchId, watch])),
  }
}

const createVersionedPayload = ({ filePrefix, value }) => {
  const payload = JSON.stringify(value)
  const contentHash = createHash('sha256').update(payload).digest('hex').slice(0, 12)

  return { fileName: `${filePrefix}.${contentHash}.json`, payload }
}

const marketCatalogs = markets.map((market) => ({
  marketCode: market.marketCode,
  ...createVersionedPayload({ filePrefix: 'catalog', value: createCatalog(market) }),
}))

const createComparisonPayload = () => {
  const sortedMarkets = [...markets].sort((left, right) =>
    left.marketCode.localeCompare(right.marketCode),
  )
  const marketsByCode = Object.fromEntries(
    sortedMarkets.map((market) => {
      const priceHistory = getPriceHistory(market.marketCode)

      return [
        market.marketCode,
        {
          code: market.marketCode,
          currencyCode: priceHistory.currencyCode,
          priceType: priceHistory.priceType,
          taxRatePercent: priceHistory.taxRatePercent,
          priceUpdatedAt: getPriceUpdatedAt(priceHistory),
          travelerRefundPolicy: travelerRefundPoliciesByMarketCode.get(market.marketCode) ?? null,
        },
      ]
    }),
  )
  const pricesByWatchId = Object.fromEntries(
    catalog.watches.map((watch) => [
      watch.watchId,
      Object.fromEntries(
        sortedMarkets.map((market) => {
          const priceRecord = getPriceHistory(market.marketCode).priceSeries[watch.watchId]?.at(-1)

          if (!priceRecord) {
            throw new Error(`${market.marketCode} price history is missing ${watch.watchId}`)
          }

          return [
            market.marketCode,
            { price: priceRecord.price, priceStatus: priceRecord.listingStatus },
          ]
        }),
      ),
    ]),
  )

  return {
    schemaVersion: 1,
    brandId: catalog.brandId,
    watchCount: catalog.watchCount,
    marketsByCode,
    pricesByWatchId,
  }
}

const comparisonCatalog = createVersionedPayload({
  filePrefix: 'comparison',
  value: createComparisonPayload(),
})

const supportedCurrencies = [
  ...new Set(
    markets.map((market) => {
      const priceHistory = getPriceHistory(market.marketCode)

      if (typeof priceHistory.currencyCode !== 'string') {
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

const manifest = JSON.stringify({
  schemaVersion: 5,
  catalog: taiwanCatalog,
  catalogs: catalogFileNames,
  comparison: comparisonCatalog.fileName,
  currencies: supportedCurrencies,
})

// 先移除舊 hash 檔，避免部署產物或 dev public 目錄殘留不再被 manifest 指向的資料。
await rm(outputDirectory, { force: true, recursive: true })
await mkdir(outputDirectory, { recursive: true })

// manifest 是前端尋找目前版本化 catalog 與比較資料的唯一固定入口。
await Promise.all([
  ...marketCatalogs.map(({ fileName, payload }) =>
    writeFile(resolve(outputDirectory, fileName), payload),
  ),
  writeFile(resolve(outputDirectory, comparisonCatalog.fileName), comparisonCatalog.payload),
  writeFile(resolve(outputDirectory, 'manifest.json'), manifest),
])
