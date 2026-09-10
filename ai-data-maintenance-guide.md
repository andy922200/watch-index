# Watch Index：AI 資料維護指南

本文件規範 AI 如何收集、修正與驗證正式資料。人類可讀的概念與流程請見 [watch-data-collection-guide.md](watch-data-collection-guide.md)，專案概覽請見 [README.md](README.md)。

若文件、實際 Schema 與使用者指示衝突，優先採用使用者最新指示與實際資料契約，並先回報衝突。交付時只提供操作摘要、來源證據、檢查結果、差異與未完成項目；不要輸出內部推理。

## 適用範圍與硬性限制

- 目前正式資料只涵蓋勞力士，包含 AT、CH、CN、DE、FR、GB、HK、JP、SG、TW、US 共 11 個市場。
- 專案日後會支援其他品牌；不得假定現有的型號格式、檔名、`modelReference` 規則或前端欄位仍適用。
- 未經明確授權，不得修改 Schema、另建正式格式、安裝依賴、推送遠端或繞過網站存取限制。
- 面向人類的文件一律使用繁體中文。

## 執行前檢查

在任何寫入前，讀取下列內容並檢查 `git status --short`：

1. 本文件、`README.md`、`watch-data-collection-guide.md`。
2. `data/schemas/` 的三份實際 JSON Schema。
3. `data/catalog/rolex-catalog.json`，以及目標市場的 `data/markets/`、`data/history/`、`data/evidence/`。

保護使用者既有未提交修改。既有筆數與歷史結果只可用於回歸檢查，不能作為本次收集的目標或停止條件。

## 任務快速決策

| 任務 | 必做項目 | 不可做的事 |
| --- | --- | --- |
| 純價格更新 | 重新取得列出狀態與價格、建立 evidence、追加新 run、驗證變動 | 覆寫舊價格點、清空既有俗稱 |
| 全市場重新考證／新增市場 | 完整收集市場文字、商品網址、新款標示、價格與俗稱研究 | 以舊筆數宣稱完整、跳過停止證據 |
| 新增品牌 | 先確認識別碼、Schema、檔案布局、前端型別與產生流程 | 把新品牌硬套進既有勞力士契約 |

## 正式資料契約

| 層級 | 實際位置 | 責任 | 不可放入 |
| --- | --- | --- | --- |
| Catalog | `data/catalog/rolex-catalog.json` | 跨市場穩定配置的聯集 | 價格、稅率、在地文字、俗稱 |
| Market | `data/markets/rolex-[market]-market.json` | 當地文字、商品網址、別名與新款標示 | 價格、幣別、稅務語意 |
| History | `data/history/[marketCode]/rolex-price-history.json` | 收集輪次與追加式價格／列出狀態 | 市場文字、圖片、俗稱 |
| Evidence | `data/evidence/[marketCode]/[YYYY-MM-DD]/` | 原始觀察、收集方法與驗證 | Cookie、token、授權標頭、個資 |

一筆現有 Rolex 腕錶資料代表完整配置，且必須滿足：

```text
modelReference === modelNumber + "-" + configurationCode
watchId === "rolex:" + modelReference
```

`configurationCode` 是四位字串，前導零不可移除；同基本型號但不同配置碼是不同資料。新增品牌必須使用自己的 schema 與原始型號規則，但仍應定義品牌範圍內穩定、可組成全域 `watchId` 的識別方式。

| `listingStatus` | `price` | 使用時機 |
| --- | --- | --- |
| `listed` | 非負整數 | 官方列出且取得公開價格 |
| `price-unavailable` | `null` | 官方列出，但沒有公開價格 |
| `not-listed` | `null` | 已完成全量確認，可證實目標市場未列出 |

解析失敗、逾時、第一頁未出現或工具不可用，都不是 `price-unavailable` 或 `not-listed` 的證據。不得用匯率、其他市場或同系列款式推算價格。

## 標準執行流程

1. 讀取基準，記錄輸入版本、最後 `runId` 與保護範圍。
2. 找到官方資料來源與完整的分頁／cursor 停止條件。
3. 先把原始來源事實保存到 evidence。
4. 再正規化並更新 catalog、market 與 history。
5. 執行驗證，將 PASS、FAIL、NOT RUN 與限制寫入 evidence。
6. 檢查人類文件的長期描述是否需同步；單次收集細節只留在 evidence。

不得先改正式 JSON，再由正式 JSON 補造 evidence。

## 來源發現與完整性

以目標市場的官方來源作為市場清單、在地文字與價格的事實基礎。對 JavaScript 網站，優先使用頁面實際載入的 JSON、REST、GraphQL、內嵌 state 或 network response，確認市場／語系參數、篩選狀態、分頁或 cursor 與真正的結束條件。再用不同的官方視圖、rendered UI 或商品頁進行獨立抽查。

Browser、CDP 或 network 工具不可用，不代表官方沒有結構化來源。若任務需要 network discovery，且環境已配置 Chrome DevTools 或等效 network MCP，必須實際呼叫並嘗試讀取請求／回應；僅確認工具存在不算完成。呼叫失敗時，在 `collection-summary.json` 或 `validation-summary.json` 記錄工具、錯誤摘要與後備嘗試。能力不足時標記 `NOT RUN / capability unavailable`，不得猜測 endpoint 或宣稱已完成全量收集。

## Evidence：最低內容與保存規則

每次更新建立新的 `data/evidence/[marketCode]/[YYYY-MM-DD]/`；同日多次執行使用獨立 run 子目錄。至少保存：

- `observations.json`：完整配置碼、來源 URL、觀察時間、原始文字與價格、解析結果、商品網址及新款標示。
- `collection-summary.json`：市場、語系、入口、收集路徑、分頁／cursor、筆數、重複／衝突、停止證據與錯誤。
- `validation-summary.json`：PASS／FAIL／NOT RUN、抽查、差集、價格統計、限制及 README 是否需要同步。

若有俗稱研究，建立 `nickname-research.json`，記錄查詢、已檢閱來源及採用／拒絕理由。不得保存秘密，亦不得以舊正式資料生成假觀察。

## 寫入、歷史與俗稱

價格歷史是 append-only：保留所有既有 `collectionRuns` 和價格點；每個價格點的 `runId` 必須存在且遞增，相鄰且狀態、價格完全相同的點不可重複加入。

新增或完整重建市場時，俗稱只有在能精確對應完整配置並附可信來源時才可採用。純價格更新時保留既有結果，將本次研究標記為 `NOT RUN (out of scope)`，不得清空既有資料。

寫入後至少完成以下驗證：

1. 嚴格 JSON 與 Schema，包含重複 key、時間、URI 與額外欄位。
2. `watchCount`、唯一 `watchId`、catalog／market／history 關聯及 marketCode 一致。
3. 價格與 `listingStatus` 的組合正確。
4. 新增或更新的正式事實可回對本次 evidence，且價格解析一致。
5. 全量來源有停止證據，並完成獨立官方抽查。
6. 舊價格序列仍是新序列的前綴；未授權市場、Schema 與使用者修改未被改動。

JSON 或 Schema 通過，只代表結構合法，不代表來源正確或收集完整。回報時列出市場與語系、來源與時間、資料差異、價格變動、Evidence 路徑、驗證結果及未完成限制。

## 多市場協作與 Catalog 合併

多市場任務採市場隔離：每個工作單元只處理一個市場的來源、evidence、market 與 history 檔。只有統籌者可以合併 `data/catalog/rolex-catalog.json`，並在所有市場工作完成後執行跨檔驗證。單一市場工作不得覆寫 catalog，也不得因未觀察到既有配置就刪除它。

令 `C` 為既有 catalog 的完整配置集合，`M` 為本次已驗證的市場集合：

- `C ∩ M`：核對既有配置，不重複加入。
- `M − C`：取得所有穩定欄位後加入 catalog。
- `C − M`：保留；本次未觀察到不是下架證據。
- 更新後集合為 `C ∪ M`，並確認 `|C ∪ M| = |C| + |M| − |C ∩ M|`。

穩定欄位衝突、缺少官方圖片、未知完整配置或市場資料無法對應 catalog 時，停止宣稱完整，先列為待查。保留既有 JSON 的順序、兩格縮排、UTF-8 與尾端換行，避免無意義的全檔重排。

## 價格解析與稅制

先確認目標市場的貨幣與數字格式，再解析原始價格。例如日圓或台幣的逗號可能是千分位；德語格式中的點可能是千分位，而具有非零小數的價格無法無損寫入目前的整數契約。不可直接移除所有非數字字元，也不可自行乘以 100、四捨五入或截斷。

稅制依下列順序確認：官方價格說明、政府／稅務機關、可信補充資料。`tax-include` 是含適用消費稅、`tax-exclude` 是未稅、`no-tax` 是確定不課徵該類稅；未知稅率不可填 `0`。頂層的幣別、價格語意與稅率會影響歷史檔全部舊資料，若需改變解釋，必須先提出資料遷移與 Schema 決策，不能直接覆寫。

## 完整性停止條件與抽查

以結構化來源收集時，必須同時具備最後一頁／空下一頁／null cursor／`hasNextPage: false` 等已驗證終止訊號、最後批次成功、沒有未解決的下一頁、唯一配置不再增加，並釐清官方 UI 總數的統計口徑。

以 DOM 為主時，必須確認沒有下一頁、載入更多或未完成的無限捲動；最後載入無錯誤或逾時；頁面穩定後集合不再增加。虛擬列表應逐批累積資料，不能只讀取最後的 DOM。下一頁存在但未產生新配置是異常，不是完成。

不得以初始畫面、搜尋引擎摘要、捲動次數、既有市場筆數或「筆數剛好相同」宣稱完整。獨立抽查應使用與主要收集路徑不同的官方視圖；完整重建市場時，抽查 19 至 21 款，至少涵蓋每個系列代表款、兩組同基本型號的不同配置、最低價、最高價、無公開價、新款與異常項目。記錄型號、來源、時間、比對欄位與結果。

## 交付門檻與反例

交付前確認正式 JSON、evidence 與必要的人類文件都已實際保存。摘要必須包含：市場／語系與官方 URL、觀察開始與完成時間、收集路徑與停止證據、原始與唯一配置數、差集、價格狀態、runId 與變動點、稅制、五層驗證、抽查、evidence 位置、俗稱研究、保護範圍及限制。

以下任一情況均不得宣稱完整完成或整體 PASS：README 的長期描述已受影響卻未同步；需要 network discovery 卻未留下實際嘗試與限制；尚有下一頁；價格解析失敗；證據無法回對；未執行的俗稱研究被說成「查無結果」；或舊歷史被覆寫。

驗證必須能攔下重複完整配置、孤兒 market／history 型號、不存在的 runId、`listed` 搭配 `null` 或字串價格、冗餘相鄰價格點、非零小數價格、未完成分頁、重複 JSON key、非法 JSON 常數與未經驗證的跨市場價格推算。驗證腳本是檢查工具，不能用來生成或修飾資料以通過檢查。

## 與人類文件的責任對照

| 主題 | 權威文件 | AI 的使用方式 |
| --- | --- | --- |
| 專案定位、目前僅含勞力士與未來多品牌 | `README.md` | 讀取範圍，避免把現有品牌規則當成通用契約 |
| 資料結構、現況市場與人類維護流程 | `watch-data-collection-guide.md` | 作為資料語意與長期文件的基準 |
| 前端資料產生、型別、搜尋與部署 | `watch-app-guide.md` | 資料或品牌變更影響網站時一併檢查 |
| AI 的來源發現、evidence、寫入、驗證與交付 | 本文件 | 執行前完整閱讀並逐項落實 |

文件中的舊日期、歷史筆數、按鈕文字、endpoint 與 URL 只能作為回歸線索，不能替代本次官方觀察，也不能硬編碼成驗收答案。

## 可執行驗證片段

以下片段只用 Python 3 或 Node.js 內建功能，從專案根目錄執行。它們是驗證工具，不可用來生成、修飾或湊足正式資料。

### 嚴格 JSON 解析

此檢查會攔下重複 key、`NaN`、`Infinity` 等一般 `JSON.parse` 可能忽略的問題：

```python
import json
from pathlib import Path

def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result

def invalid_constant(value):
    raise ValueError(f"invalid JSON constant: {value}")

paths = sorted(
    path
    for folder in ("data/catalog", "data/markets", "data/history", "data/schemas")
    for path in Path(folder).rglob("*.json")
)
if not paths:
    raise RuntimeError("No JSON files found; check working directory")
for path in paths:
    json.loads(
        path.read_text(encoding="utf-8"),
        object_pairs_hook=unique_object,
        parse_constant=invalid_constant,
    )
print(f"PASS: strict JSON parsing, {len(paths)} files")
```

### 跨檔案不變條件：現有勞力士資料範例

此 Node.js 片段只驗證目前的勞力士資料契約：完整配置鍵、market／history 關聯、runId 與價格狀態。檔名、路徑與 `modelReference` 正規表示式都以勞力士現況為例；新增其他品牌時，應依新品牌的識別碼與資料契約另建或擴充驗證，不能直接套用本片段。

它不取代 JSON Schema、來源回對或完整性驗證。

```javascript
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const fail = (condition, message) => assert(condition, message)
const refPattern = /^m[0-9a-z]+-[0-9]{4}$/
const isTime = value => typeof value === 'string' && Number.isFinite(Date.parse(value))
const unique = values => new Set(values).size === values.length

const catalog = read('data/catalog/rolex-catalog.json')
const catalogWatchIdList = catalog.watches.map(watch => watch.watchId)
const catalogWatchIds = new Set(catalogWatchIdList)
fail(catalog.brandId === 'rolex', 'catalog brandId mismatch')
fail(catalog.watchCount === catalog.watches.length, 'catalog watchCount mismatch')
fail(unique(catalogWatchIdList), 'catalog duplicate watchId')

for (const watch of catalog.watches) {
  fail(watch.watchId === `rolex:${watch.modelReference}`, `invalid watchId: ${watch.watchId}`)
  fail(refPattern.test(watch.modelReference), `invalid reference: ${watch.modelReference}`)
  fail(watch.modelReference === `${watch.modelNumber}-${watch.configurationCode}`,
    `reference parts mismatch: ${watch.modelReference}`)
  fail(/^\d{4}$/.test(watch.configurationCode), `invalid configuration code: ${watch.modelReference}`)
}

for (const file of fs.readdirSync('data/markets').filter(name => name.endsWith('.json'))) {
  const market = read(path.join('data/markets', file))
  const history = read(path.join('data/history', market.marketCode, 'rolex-price-history.json'))
  const marketWatchIds = market.watches.map(watch => watch.watchId)
  fail(market.brandId === catalog.brandId, `${file}: market brandId mismatch`)
  fail(history.brandId === catalog.brandId, `${file}: history brandId mismatch`)
  fail(market.watchCount === marketWatchIds.length, `${file}: watchCount mismatch`)
  fail(unique(marketWatchIds), `${file}: duplicate watchId`)
  fail(history.marketCode === market.marketCode, `${file}: marketCode mismatch`)

  for (const watch of market.watches) {
    fail(watch.watchId === `rolex:${watch.modelReference}`, `${file}: invalid watchId ${watch.watchId}`)
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
    fail(catalogWatchIds.has(watchId), `${file}: market orphan ${watchId}`)
    fail(Object.hasOwn(history.priceSeries, watchId), `${file}: missing price series ${watchId}`)
  }
  for (const [watchId, points] of Object.entries(history.priceSeries)) {
    fail(catalogWatchIds.has(watchId), `${file}: history orphan ${watchId}`)
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

## Evidence 範本

下列欄位是最低範本；可以擴充公開、可重現的觀察資料，但不得保存秘密。

```json
{
  "networkDiscovery": {
    "required": true,
    "builtInBrowserStatus": "available | unavailable | not-applicable",
    "networkToolConfigured": true,
    "networkToolAttempted": true,
    "networkToolResult": "PASS | FAIL | NOT AVAILABLE",
    "fallbackTool": null,
    "notes": null
  }
}
```

```json
{
  "nicknameResearch": {
    "status": "PASS | FAIL | NOT RUN",
    "scope": "new-market | backfill | refresh | price-only",
    "languages": [],
    "queries": [],
    "sourcesReviewed": 0,
    "candidateCount": 0,
    "acceptedCollectionAliasCount": 0,
    "acceptedLocalNicknameCount": 0,
    "rejectedCandidates": [],
    "notes": null
  }
}
```

```json
{
  "readmeUpdate": {
    "status": "PASS | FAIL | NOT REQUIRED",
    "updated": true,
    "sections": [],
    "reason": null
  }
}
```

`PASS`、`FAIL` 與 `NOT RUN` 不能混用；`PASS with 0 accepted results` 是完成俗稱研究但沒有可採用結果，與未研究不同。

## 稅制查核起點

每次更新都要依目標市場、產品範圍與適用日期重新查核稅制；本文件不提供或維護特定國家的稅法連結。優先採用官方價格說明與政府／稅務機關來源，並將來源、適用範圍與查核日期保存於當次 evidence。不要新增已移除的正式欄位，例如 `taxName` 或 `researchSources.tax`。

## 歷史回歸案例：日本 2026-09-01

此案例只用來辨識回歸或擷取異常，不是後續驗收的筆數目標。日本完成全部載入後有 1,465 個唯一完整配置、17 個系列；初始局部擷取為 56 筆，補齊後新增 1,409 個價格基準點。完整批次時間為 `2026-09-01T17:06:44+09:00`。

當時系列拆分為：1908 8、Land-Dweller 10、Day-Date 281、Sky-Dweller 39、Lady-Datejust 291、Datejust 681、Oyster Perpetual 62、Cosmograph Daytona 47、Submariner 7、Sea-Dweller 2、Deepsea 4、GMT-Master II 13、Yacht-Master 12、Yacht-Master II 2、Explorer 3、Explorer II 2、Air-King 1。日後結果不同時，檢查官方增減、差集與擷取問題，禁止補造或刪除資料以湊成此數字。

## 最後自我檢查

- [ ] 未將初始批次、歷史筆數或搜尋結果當成完整清單。
- [ ] 已確認官方來源、目標市場、語系、篩選狀態與分頁／cursor 停止條件。
- [ ] 已實際嘗試可用的 network 工具，或明確記錄能力限制。
- [ ] 已先保存 evidence，且其中沒有 Cookie、授權標頭、token、session 或個資。
- [ ] 已保留完整配置碼與前導零，沒有以其他市場價格推算。
- [ ] 沒有把解析失敗當成無公開價格，也沒有把缺漏或逾時當成 `not-listed`。
- [ ] 沒有將價格放入 market、將在地文字放入 catalog，或無故清空俗稱。
- [ ] 已保留舊 run、舊價格點、非目標市場與使用者既有修改。
- [ ] 已完成 Schema、跨檔、來源回對、完整性與變更安全驗證；未執行項目已標記 `NOT RUN`。
- [ ] 已完成獨立官方抽查，並檢查 README／人類指南是否需要同步。
