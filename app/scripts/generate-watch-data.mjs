import { createHash } from 'node:crypto'
import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 將 repo 的原始 catalog 轉成前端可直接查詢的靜態資料庫。
 *
 * 每個品牌都輸出到 `watch-data/<brandId>/`，讓 catalog、comparison 與 manifest
 * 完全品牌隔離。
 */
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const appDirectory = resolve(scriptDirectory, '..')
const projectDirectory = resolve(appDirectory, '..')
const catalogsDirectory = resolve(projectDirectory, 'data/catalog')
const marketsDirectory = resolve(projectDirectory, 'data/markets')
const historyDirectory = resolve(projectDirectory, 'data/history')
const travelerRefundPoliciesPath = resolve(projectDirectory, 'data/traveler-refund-policies.json')

const outputDirectoryArgumentIndex = process.argv.indexOf('--output-directory')
const requestedOutputDirectory =
  outputDirectoryArgumentIndex === -1 ? null : process.argv[outputDirectoryArgumentIndex + 1]

if (outputDirectoryArgumentIndex !== -1 && !requestedOutputDirectory) {
  throw new Error('Expected a directory after --output-directory')
}

const outputDirectory = resolve(appDirectory, requestedOutputDirectory ?? 'dist/watch-data')
const brandIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)
const isValidDate = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value))
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

const readJsonFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })

  return Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map(async (entry) => ({
        fileName: entry.name,
        value: await readJson(resolve(directory, entry.name)),
      })),
  )
}

const assertBrandId = (brandId, context) => {
  if (typeof brandId !== 'string' || !brandIdPattern.test(brandId)) {
    throw new Error(`${context} has an invalid brandId`)
  }
}

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
      !['available', 'unavailable'].includes(policy.availability) ||
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

const [catalogFiles, marketFiles, historyDirectories, travelerRefundPolicies] = await Promise.all([
  readJsonFiles(catalogsDirectory),
  readJsonFiles(marketsDirectory),
  readdir(historyDirectory, { withFileTypes: true }),
  readJson(travelerRefundPoliciesPath),
])

const historyFiles = (
  await Promise.all(
    historyDirectories
      .filter((entry) => entry.isDirectory())
      .map(async (entry) =>
        (await readJsonFiles(resolve(historyDirectory, entry.name))).map((file) => ({
          ...file,
          directoryMarketCode: entry.name,
        })),
      ),
  )
).flat()

const catalogsByBrandId = new Map()
for (const { fileName, value: catalog } of catalogFiles) {
  assertBrandId(catalog?.brandId, fileName)
  if (fileName !== `${catalog.brandId}-catalog.json` || catalogsByBrandId.has(catalog.brandId)) {
    throw new Error(`${fileName} does not declare a unique matching catalog brandId`)
  }
  catalogsByBrandId.set(catalog.brandId, catalog)
}

if (catalogsByBrandId.size === 0) {
  throw new Error('No brand catalog was found')
}

const marketsByBrandId = new Map()
for (const { fileName, value: market } of marketFiles) {
  assertBrandId(market?.brandId, fileName)
  if (!fileName.startsWith(`${market.brandId}-`) || !fileName.endsWith('-market.json')) {
    throw new Error(`${fileName} does not match market brandId ${market.brandId}`)
  }
  if (!catalogsByBrandId.has(market.brandId)) {
    throw new Error(`${fileName} has no matching catalog`)
  }
  const brandMarkets = marketsByBrandId.get(market.brandId) ?? []
  if (brandMarkets.some((candidate) => candidate.marketCode === market.marketCode)) {
    throw new Error(`Market is duplicated for ${market.brandId}:${market.marketCode}`)
  }
  brandMarkets.push(market)
  marketsByBrandId.set(market.brandId, brandMarkets)
}

const historiesByBrandAndMarket = new Map()
for (const { directoryMarketCode, fileName, value: history } of historyFiles) {
  assertBrandId(history?.brandId, `${directoryMarketCode}/${fileName}`)
  if (
    history.marketCode !== directoryMarketCode ||
    fileName !== `${history.brandId}-price-history.json` ||
    !catalogsByBrandId.has(history.brandId)
  ) {
    throw new Error(`${directoryMarketCode}/${fileName} has an invalid brand or market path`)
  }
  const historyKey = `${history.brandId}:${history.marketCode}`
  if (historiesByBrandAndMarket.has(historyKey)) {
    throw new Error(`Price history is duplicated for ${historyKey}`)
  }
  historiesByBrandAndMarket.set(historyKey, history)
}

const marketKeys = new Set(
  [...marketsByBrandId.entries()].flatMap(([brandId, markets]) =>
    markets.map((market) => `${brandId}:${market.marketCode}`),
  ),
)
for (const historyKey of historiesByBrandAndMarket.keys()) {
  if (!marketKeys.has(historyKey)) {
    throw new Error(`Price history has no matching market: ${historyKey}`)
  }
}

const travelerRefundPoliciesByMarketCode = await assertValidTravelerRefundPolicies({
  policies: travelerRefundPolicies,
  marketCodes: new Set([...marketsByBrandId.values()].flat().map((market) => market.marketCode)),
})

const createVersionedPayload = ({ filePrefix, value }) => {
  const payload = JSON.stringify(value)
  const contentHash = createHash('sha256').update(payload).digest('hex').slice(0, 12)

  return { fileName: `${filePrefix}.${contentHash}.json`, payload }
}

const createBrandPayloads = ({ catalog, markets, historiesByMarketCode }) => {
  if (!Array.isArray(catalog.watches) || catalog.watchCount !== catalog.watches.length) {
    throw new Error(`${catalog.brandId} catalog has an invalid watchCount`)
  }
  if (markets.length === 0) {
    throw new Error(`${catalog.brandId} catalog has no market data`)
  }

  const catalogWatchIds = new Set()
  for (const watch of catalog.watches) {
    if (
      !isRecord(watch) ||
      typeof watch.reference !== 'string' ||
      watch.reference.length === 0 ||
      watch.watchId !== `${catalog.brandId}:${watch.reference}` ||
      catalogWatchIds.has(watch.watchId)
    ) {
      throw new Error(`${catalog.brandId} catalog has an invalid watch identity`)
    }
    catalogWatchIds.add(watch.watchId)
  }

  const getPriceHistory = (marketCode) => {
    const history = historiesByMarketCode.get(marketCode)
    if (!history) throw new Error(`${catalog.brandId}:${marketCode} price history is missing`)
    return history
  }
  const getPriceUpdatedAt = (history) => {
    const collectedAt = history.collectionRuns
      .map((run) => run.collectedAt)
      .sort((left, right) => Date.parse(right) - Date.parse(left))[0]
    if (typeof collectedAt !== 'string') {
      throw new Error(`${catalog.brandId}:${history.marketCode} has no collection run date`)
    }
    return collectedAt
  }
  const createCatalog = (market) => {
    const history = getPriceHistory(market.marketCode)
    if (market.brandId !== catalog.brandId || history.brandId !== catalog.brandId) {
      throw new Error(`${catalog.brandId}:${market.marketCode} has an inconsistent brandId`)
    }
    if (!Array.isArray(market.watches) || market.watchCount !== market.watches.length) {
      throw new Error(`${catalog.brandId}:${market.marketCode} has an invalid watchCount`)
    }

    const marketWatchIds = new Set()
    for (const watch of market.watches) {
      if (
        !isRecord(watch) ||
        typeof watch.reference !== 'string' ||
        watch.reference.length === 0 ||
        watch.watchId !== `${catalog.brandId}:${watch.reference}` ||
        !catalogWatchIds.has(watch.watchId) ||
        marketWatchIds.has(watch.watchId)
      ) {
        throw new Error(`${catalog.brandId}:${market.marketCode} has an invalid watch identity`)
      }
      marketWatchIds.add(watch.watchId)
    }
    for (const watchId of Object.keys(history.priceSeries)) {
      if (!catalogWatchIds.has(watchId)) {
        throw new Error(
          `${catalog.brandId}:${market.marketCode} has an orphan price history: ${watchId}`,
        )
      }
    }

    const catalogWatchesById = new Map(catalog.watches.map((watch) => [watch.watchId, watch]))
    const getLatestPriceRecord = (watchId) => history.priceSeries[watchId]?.at(-1)

    const watches = market.watches.map((marketWatch) => {
      const watch = catalogWatchesById.get(marketWatch.watchId)
      const priceRecord = getLatestPriceRecord(marketWatch.watchId)
      if (!watch || !priceRecord) {
        throw new Error(`${catalog.brandId}:${market.marketCode} is missing ${marketWatch.watchId}`)
      }
      if (priceRecord.listingStatus === 'not-listed') {
        throw new Error(
          `${catalog.brandId}:${market.marketCode} lists ${marketWatch.watchId} without a current price status`,
        )
      }
      if (
        marketWatch.watchId !== `${catalog.brandId}:${marketWatch.reference}` ||
        typeof marketWatch.modelName !== 'string' ||
        (typeof marketWatch.caseDescription !== 'string' && marketWatch.caseDescription !== null) ||
        (typeof marketWatch.dialDescription !== 'string' && marketWatch.dialDescription !== null) ||
        !Array.isArray(marketWatch.localNicknames?.names) ||
        !marketWatch.localNicknames.names.every((nickname) => typeof nickname === 'string')
      ) {
        throw new Error(`${catalog.brandId}:${market.marketCode} is invalid for ${watch.watchId}`)
      }
      return {
        ...watch,
        modelName: marketWatch.modelName,
        caseDescription: marketWatch.caseDescription ?? '',
        dialDescription: marketWatch.dialDescription ?? '',
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
      watchCount: market.watchCount,
      collections: [...collectionCounts]
        .map(([id, watchCount]) => ({ id, watchCount }))
        .sort((left, right) => left.id.localeCompare(right.id)),
      priceMarket: {
        code: history.marketCode,
        currencyCode: history.currencyCode,
        priceType: history.priceType,
        taxRatePercent: history.taxRatePercent,
      },
      priceUpdatedAt: getPriceUpdatedAt(history),
      watchesById: Object.fromEntries(watches.map((watch) => [watch.watchId, watch])),
    }
  }

  const marketCatalogs = markets.map((market) => ({
    marketCode: market.marketCode,
    ...createVersionedPayload({ filePrefix: 'catalog', value: createCatalog(market) }),
  }))
  const sortedMarkets = [...markets].sort((left, right) =>
    left.marketCode.localeCompare(right.marketCode),
  )
  const marketWatchIdsByMarketCode = new Map(
    sortedMarkets.map((market) => [
      market.marketCode,
      new Set(market.watches.map((watch) => watch.watchId)),
    ]),
  )
  const comparisonCatalog = createVersionedPayload({
    filePrefix: 'comparison-catalog',
    value: {
      schemaVersion: 5,
      brandId: catalog.brandId,
      collectedAt: catalog.collectedAt,
      watchCount: catalog.watchCount,
      collections: [...new Map(catalog.watches.map((watch) => [watch.collectionId, 0]))]
        .map(([id]) => ({
          id,
          watchCount: catalog.watches.filter((watch) => watch.collectionId === id).length,
        }))
        .sort((left, right) => left.id.localeCompare(right.id)),
      priceMarket: {
        code: sortedMarkets[0].marketCode,
        currencyCode: getPriceHistory(sortedMarkets[0].marketCode).currencyCode,
        priceType: getPriceHistory(sortedMarkets[0].marketCode).priceType,
        taxRatePercent: getPriceHistory(sortedMarkets[0].marketCode).taxRatePercent,
      },
      priceUpdatedAt: getPriceUpdatedAt(getPriceHistory(sortedMarkets[0].marketCode)),
      watchesById: Object.fromEntries(
        catalog.watches.map((watch) => {
          const marketWatch = sortedMarkets
            .map((market) =>
              market.watches.find((candidate) => candidate.watchId === watch.watchId),
            )
            .find((candidate) => candidate !== undefined)
          const priceRecord = sortedMarkets
            .map((market) => getPriceHistory(market.marketCode).priceSeries[watch.watchId]?.at(-1))
            .find((candidate) => candidate !== undefined)

          if (!marketWatch || !priceRecord) {
            throw new Error(`${catalog.brandId} comparison catalog is missing ${watch.watchId}`)
          }

          return [
            watch.watchId,
            {
              ...watch,
              modelName: marketWatch.modelName,
              caseDescription: marketWatch.caseDescription ?? '',
              dialDescription: marketWatch.dialDescription ?? '',
              localNicknames: marketWatch.localNicknames.names,
              price: priceRecord.price,
              priceStatus: priceRecord.listingStatus,
            },
          ]
        }),
      ),
    },
  })
  const comparison = createVersionedPayload({
    filePrefix: 'comparison',
    value: {
      schemaVersion: 1,
      brandId: catalog.brandId,
      watchCount: catalog.watchCount,
      marketsByCode: Object.fromEntries(
        sortedMarkets.map((market) => {
          const history = getPriceHistory(market.marketCode)
          return [
            market.marketCode,
            {
              code: market.marketCode,
              currencyCode: history.currencyCode,
              priceType: history.priceType,
              taxRatePercent: history.taxRatePercent,
              priceUpdatedAt: getPriceUpdatedAt(history),
              travelerRefundPolicy:
                travelerRefundPoliciesByMarketCode.get(market.marketCode) ?? null,
            },
          ]
        }),
      ),
      pricesByWatchId: Object.fromEntries(
        catalog.watches.map((watch) => [
          watch.watchId,
          Object.fromEntries(
            sortedMarkets.map((market) => {
              // A market catalog is the authoritative availability set. Omitted watches are
              // represented in the generated comparison payload only; no history is invented.
              if (!marketWatchIdsByMarketCode.get(market.marketCode)?.has(watch.watchId)) {
                return [market.marketCode, { price: null, priceStatus: 'not-listed' }]
              }
              const priceRecord = getPriceHistory(market.marketCode).priceSeries[watch.watchId]?.at(
                -1,
              )
              if (!priceRecord) {
                throw new Error(
                  `${catalog.brandId}:${market.marketCode} is missing ${watch.watchId}`,
                )
              }
              return [
                market.marketCode,
                { price: priceRecord.price, priceStatus: priceRecord.listingStatus },
              ]
            }),
          ),
        ]),
      ),
    },
  })
  const catalogs = Object.fromEntries(
    marketCatalogs.map(({ marketCode, fileName }) => [marketCode, fileName]),
  )
  if (!catalogs.TW) {
    throw new Error(`${catalog.brandId} market catalog does not contain Taiwan`)
  }

  return {
    catalogFiles: marketCatalogs,
    comparisonCatalog,
    comparisonFile: comparison,
    manifest: JSON.stringify({
      schemaVersion: 5,
      catalog: catalogs.TW,
      catalogs,
      comparisonCatalog: comparisonCatalog.fileName,
      comparison: comparison.fileName,
      currencies: [
        ...new Set(sortedMarkets.map((market) => getPriceHistory(market.marketCode).currencyCode)),
      ].sort(),
    }),
  }
}

const brandPayloads = [...catalogsByBrandId.values()].map((catalog) => {
  const markets = marketsByBrandId.get(catalog.brandId) ?? []
  return {
    brandId: catalog.brandId,
    ...createBrandPayloads({
      catalog,
      markets,
      historiesByMarketCode: new Map(
        markets.map((market) => [
          market.marketCode,
          historiesByBrandAndMarket.get(`${catalog.brandId}:${market.marketCode}`),
        ]),
      ),
    }),
  }
})

await rm(outputDirectory, { force: true, recursive: true })
await mkdir(outputDirectory, { recursive: true })

const getBrandOutputDirectory = (brandId) => resolve(outputDirectory, brandId)

await Promise.all(
  brandPayloads.map(({ brandId }) => mkdir(getBrandOutputDirectory(brandId), { recursive: true })),
)
await Promise.all(
  brandPayloads.flatMap(
    ({ brandId, catalogFiles, comparisonCatalog, comparisonFile, manifest }) => {
      const brandOutputDirectory = getBrandOutputDirectory(brandId)
      return [
        ...catalogFiles.map(({ fileName, payload }) =>
          writeFile(resolve(brandOutputDirectory, fileName), payload),
        ),
        writeFile(
          resolve(brandOutputDirectory, comparisonCatalog.fileName),
          comparisonCatalog.payload,
        ),
        writeFile(resolve(brandOutputDirectory, comparisonFile.fileName), comparisonFile.payload),
        writeFile(resolve(brandOutputDirectory, 'manifest.json'), manifest),
      ]
    },
  ),
)
