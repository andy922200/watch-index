# 跨檔案不變條件驗證腳本：跨品牌範例

本檔案是 [ai-data-maintenance-guide.md](../ai-data-maintenance-guide.md)「可執行驗證片段」章節所指的具體範例，套用範圍與限制以該章節為準：此 Node.js 片段依 `brandId` 發現 catalog、market 與 history，驗證跨品牌 identity、market／history 關聯、runId 與價格狀態；不得把某一品牌的檔名套用到另一品牌。

它不取代 JSON Schema、來源回對或完整性驗證。

```javascript
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const fail = (condition, message) => assert(condition, message)
const isTime = value => typeof value === 'string' && Number.isFinite(Date.parse(value))
const unique = values => new Set(values).size === values.length

const catalogsByBrand = new Map()
for (const file of fs.readdirSync('data/catalog').filter(name => name.endsWith('-catalog.json'))) {
  const catalog = read(path.join('data/catalog', file))
  const catalogWatchIdList = catalog.watches.map(watch => watch.watchId)
  fail(file === `${catalog.brandId}-catalog.json`, `${file}: catalog filename/brandId mismatch`)
  fail(catalog.watchCount === catalog.watches.length, `${file}: catalog watchCount mismatch`)
  fail(unique(catalogWatchIdList), `${file}: catalog duplicate watchId`)
  fail(!catalogsByBrand.has(catalog.brandId), `${file}: duplicate catalog brandId`)
  for (const watch of catalog.watches) {
    fail(watch.watchId === `${catalog.brandId}:${watch.reference}`, `${file}: invalid watchId ${watch.watchId}`)
    fail(typeof watch.reference === 'string' && watch.reference.length > 0,
      `${file}: invalid reference ${watch.watchId}`)
  }
  catalogsByBrand.set(catalog.brandId, { file, watchIds: new Set(catalogWatchIdList) })
}

for (const file of fs.readdirSync('data/markets').filter(name => name.endsWith('.json'))) {
  const market = read(path.join('data/markets', file))
  const catalog = catalogsByBrand.get(market.brandId)
  fail(catalog, `${file}: missing catalog for ${market.brandId}`)
  const historyFile = `${market.brandId}-price-history.json`
  const history = read(path.join('data/history', market.marketCode, historyFile))
  const marketWatchIds = market.watches.map(watch => watch.watchId)
  fail(history.brandId === market.brandId, `${file}: history brandId mismatch`)
  fail(market.watchCount === marketWatchIds.length, `${file}: watchCount mismatch`)
  fail(unique(marketWatchIds), `${file}: duplicate watchId`)
  fail(history.marketCode === market.marketCode, `${file}: marketCode mismatch`)

  for (const watch of market.watches) {
    fail(watch.watchId === `${market.brandId}:${watch.reference}`, `${file}: invalid watchId ${watch.watchId}`)
  }

  const runIds = new Set()
  let previousRunId = 0
  for (const run of history.collectionRuns) {
    fail(Number.isSafeInteger(run.runId) && run.runId > previousRunId, `${file}: invalid runId`)
    fail(isTime(run.collectedAt), `${file}: invalid run time`)
    fail(Number.isSafeInteger(run.recordCount) && run.recordCount >= 0, `${file}: invalid recordCount`)
    runIds.add(run.runId)
    previousRunId = run.runId
  }

  for (const watchId of marketWatchIds) {
    fail(catalog.watchIds.has(watchId), `${file}: market orphan ${watchId}`)
    fail(Object.hasOwn(history.priceSeries, watchId), `${file}: missing price series ${watchId}`)
  }
  for (const [watchId, points] of Object.entries(history.priceSeries)) {
    fail(catalog.watchIds.has(watchId), `${file}: history orphan ${watchId}`)
    fail(Array.isArray(points) && points.length > 0, `${file}: empty price series ${watchId}`)
    let previous
    for (const point of points) {
      fail(runIds.has(point.runId), `${file}: unknown runId ${watchId}`)
      fail(['listed', 'price-unavailable', 'not-listed'].includes(point.listingStatus),
        `${file}: invalid status ${watchId}`)
      fail(point.listingStatus === 'listed'
        ? Number.isSafeInteger(point.price) && point.price >= 0
        : point.price === null, `${file}: price/status mismatch ${watchId}`)
      if (previous) {
        fail(point.runId > previous.runId, `${file}: unordered series ${watchId}`)
        fail(point.price !== previous.price || point.listingStatus !== previous.listingStatus,
          `${file}: redundant price point ${watchId}`)
      }
      previous = point
    }
  }
  console.log(`PASS: ${file}`)
}
```
