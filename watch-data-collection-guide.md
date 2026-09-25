# Watch Index 資料收集與維護指南

本文件說明如何維護 `data/` 的正式資料。它是給資料維護者的工作指南；網站的開發與建置請改看 [watch-app-guide.md](watch-app-guide.md)。專案概覽則在 [README.md](README.md)。

## 資料範圍與原則

資料來源以目標市場的品牌官方公開資訊為準，記錄官方在售配置、當地文字、官方商品連結與建議零售價。本指南的欄位與契約適用於所有品牌，既有範例若使用 Rolex 檔名僅為說明。它不收錄二手或平行市場價格、授權經銷商庫存，也不以其他市場價格或匯率推算缺漏值。

收集與維護時請遵守以下原則：

- 一筆資料代表「完整配置」，品牌官方完整參考號保存在 `reference`，跨品牌唯一鍵固定為 `watchId = brandId + ":" + reference`。例如 `rolex:m228236-0004` 與 `rolex:m228236-0018` 必須是兩筆資料。
- 品牌參考號必須完整保存，包含任何前導零、分隔符號與配置後綴；不得拆解後再推測或重組來源值。
- 不知道價格不等於零；無法取得資料不等於 `not-listed`。
- 正式資料只保存已驗證的事實；來源觀察、收集路徑與驗證結果保留在 evidence，而非塞入正式 Schema。
- 價格歷史採追加式保存。不得修改或刪除既有輪次與價格點；無變化時不重複新增價格點。
- Evidence commit 後即不可變更。新一輪結果與先前不一致時保留原記錄，不回頭修改、刪除或壓縮既有 evidence；同一輪尚未 commit 的多次嘗試可整併，但須保留嘗試紀錄。
- 官方市場文字保持原文。俗稱必須可對應到特定完整配置與可信來源，不能因同系列或舊世代名稱相近而套用。

## 目前資料結構

```text
data/
├── catalog/[catalog].json
├── markets/[market].json
├── history/[marketCode]/[price-history].json
├── traveler-refund-policies.json
├── evidence/[marketCode]/[YYYY-MM-DD]/
└── schemas/
```

各份 Schema 位於 `data/schemas/`，是正式資料欄位與型別的唯一依據。Catalog、market 與 price history 分別使用 `watch-catalog.schema.json`、`watch-market.schema.json` 與 `watch-price-history.schema.json`。目前核心資料契約是 [`data-schema-v3`](https://github.com/andy922200/watch-index/releases/tag/data-schema-v3)，旅客退稅政策契約是 [`traveler-refund-schema-v1`](https://github.com/andy922200/watch-index/releases/tag/traveler-refund-schema-v1)。

歷史 Schema 應從 [GitHub Releases](https://github.com/andy922200/watch-index/releases) 的對應版本下載，或透過同名 annotated tag 查閱當時的原始路徑；Release 同時提供原始 Schema 與 `SHA256SUMS.txt`。舊 Schema 名稱若出現在既有 evidence，代表當次驗證所使用的歷史契約，不得改用現行 Schema 重新詮釋，也不得回頭修改 evidence。

### Schema 版本規則

- Catalog、market 與 price history 共用 `data-schema-vN` 版本線，三份 Schema 必須同步提升版本與發布。
- 旅客退稅政策使用獨立的 `traveler-refund-schema-vN` 版本線。
- 欄位、型別、必填條件、識別規則或 Schema 路徑約束改變時，必須提升對應的 `schemaVersion` 並建立 annotated tag、GitHub Release、原始 Schema 附件與 SHA-256 校驗檔。
- 僅修改 `description`、`$comment` 或文件文字而未改變契約時，不提升資料契約版本。
- 已發布的 tag、Release 附件與歷史 evidence 一律不覆寫；需要修正時發布新版本，並在說明中指出前版問題與遷移影響。

### 共用配置目錄

`data/catalog/` 中的配置目錄是所有已收集市場的配置聯集。每份品牌目錄以 `brandId` 識別；每筆腕錶只存跨市場穩定的欄位，包括 `watchId`、`reference`、系列 ID 與官方圖片。它不放價格、當地名稱、稅率或俗稱。

### 市場在地化資料

`data/markets/` 中的市場檔保存單一品牌、單一市場的地區、語系、官方來源、系列別名，以及每個配置的 `watchId`、`reference`、當地名稱、錶殼／面盤描述、新款標示、官方商品連結與當地俗稱。市場檔不保存價格或稅務欄位。

### 價格歷史

`data/history/[marketCode]/` 中的價格歷史檔保存單一市場的幣別、稅務語意、收集輪次與各配置的狀態／價格序列；`priceSeries` 以 `watchId` 為索引鍵。

| `listingStatus` | `price` | 含義 |
| --- | --- | --- |
| `listed` | 非負整數 | 官網列出且取得公開價格 |
| `price-unavailable` | `null` | 官網列出，但沒有公開價格 |
| `not-listed` | `null` | 已完成全量確認，可證實該市場未列出 |

價格以當地貨幣主要單位儲存，不是格式化字串。`tax-include` 代表價格含稅，`tax-exclude` 代表未稅，`no-tax` 代表市場沒有此類消費稅；稅率未知不可填成 `0`。

### 旅客退稅政策

`data/traveler-refund-policies.json` 保存已由一手來源查核的市場級旅客退稅制度，並以 `marketCode` 對應市場。它記錄的是制度是否存在、基本資格摘要、零售商參與／出口核驗條件、查核時間、來源與 evidence 路徑，不是官方定價、店家參與證明或某一筆交易可退回的金額。

只有政策原始來源可追溯、適用範圍明確且 evidence 已保存時才新增記錄。尚未有可驗證政策的市場必須保持缺席，不能以稅率、其他市場或推測補成「可用」或「不可用」。前端可將含稅官方定價除以 `1 + 名目稅率` 顯示為「未稅參考價」，但這不是退款承諾；實際金額可能受零售商參與、作業費、購買者資格、出口核驗與其他條件影響。

### Evidence 證據層

每次收集應建立 `data/evidence/<brandId>/[marketCode]/[YYYY-MM-DD]/`，至少包含：

- `observations.json`：逐筆原始觀察、來源網址、原始價格文字與解析結果。
- `collection-summary.json`：目標市場、來源入口、取得方式、分頁或停止證據、筆數與錯誤。
- `validation-summary.json`：結構、關聯、來源回對、完整性與歷史保留的檢查結果。

若有俗稱研究，另保存 `nickname-research.json`。Evidence 可保留正式資料不需要的原始文字與請求資訊，但絕不可保存 Cookie、授權標頭、token、session 或個人資料。

#### 保存期限與不可變更

Evidence 是「某個時間點從某個來源觀察到什麼」的快照，一旦寫入即成為歷史記錄。

- 全部保存，不設保存期限，也不因體積而刪除、壓縮或合併。這類 JSON 重複性高，git 本身的壓縮與相鄰輪次的 delta 已足以吸收成長；改存壓縮檔反而讓 git 無法做 delta，也失去 `git diff` 與 `grep` 回對來源的能力。
- 後續收集結果與先前不一致時，保留當下的原始記錄，不回頭修改。兩輪觀察到不同價格代表官方調價、下架或改版，差異本身就是資料；修改舊 evidence 會切斷價格歷史的稽核鏈。
- 發現當初的解析有誤時，在新的 run 目錄補一份更正記錄並指回原 `runId`，不要改寫舊檔。
- 只有兩種情況可以動既有 evidence，而且都是移除而非訂正：誤存機敏資料（須在該 run 留下移除項目與原因的說明），或檔案損毀無法解析。

若要縮減體積，唯一該調整的是**未來新增** evidence 的逐筆冗餘欄位，不是回頭處理既有記錄。

實務上同一輪收集常因逾時、防護阻擋或分頁中斷而需要多次嘗試。在 evidence commit 之前，可以把這些嘗試整併為同一個 run 的 evidence，避免零散的目錄；但每次嘗試的時間、方法與結果（含失敗）仍要記在 `collection-summary.json`，不同嘗試觀察到的不一致價格或狀態也要並列保留。一旦 commit，就回到上述不可變更的規則。

#### 與 Schema 演進的關係

`data/schemas/` 不涵蓋 evidence，evidence 也不應受當前 Schema 約束。舊 evidence 維持當時的格式即可，不得為了配合新 Schema 回溯改寫。需要辨識格式時，在新產生的 evidence 加入版本欄位，既有檔案以「無此欄位」視為最初版本。新增品牌時同理：新品牌採用新結構，既有品牌的 evidence 原樣不動。

## 現況

各品牌收錄的市場數量與每個市場的配置筆數彼此獨立，不假設一致；新增品牌或市場時，在下方新增對應小節與表格即可，不必比照既有品牌的市場數或筆數。

### 勞力士

勞力士目前已收錄 15 個市場：

| 市場 | 代碼 | 語系 | 幣別 | 價格語意 | 配置筆數 |
| --- | --- | --- | --- | --- | --- |
| 奧地利 | AT | `de-AT` | EUR | 含稅（20%） | 1,465 |
| 中國 | CN | `zh-Hans-CN` | CNY | 含稅（增值稅 13%） | 1,465 |
| 瑞士 | CH | `de-CH` | CHF | 含稅（8.1%） | 1,465 |
| 德國 | DE | `de-DE` | EUR | 含稅（19%） | 1,465 |
| 西班牙 | ES | `es` | EUR | 含稅（IVA 21%） | 1,465 |
| 法國 | FR | `fr-FR` | EUR | 含稅（20%） | 1,465 |
| 英國 | GB | `en-GB` | GBP | 含稅（20%） | 1,465 |
| 香港 | HK | `zh-Hant-HK` | HKD | 無消費稅（0%） | 1,465 |
| 義大利 | IT | `it-IT` | EUR | 含稅（22%） | 1,465 |
| 日本 | JP | `ja-JP` | JPY | 含稅（10%） | 1,465 |
| 韓國 | KR | `ko-KR` | KRW | 含稅（10%） | 1,465 |
| 新加坡 | SG | `en-SG` | SGD | 含稅（9%） | 1,465 |
| 泰國 | TH | `th` | THB | 含稅（VAT 7%） | 1,465 |
| 台灣 | TW | `zh-Hant-TW` | TWD | 含稅（5%） | 1,465 |
| 美國 | US | `en-US` | USD | 未稅（依州別而異） | 1,465 |

中國市場官網為 `rolex.cn`（非 `rolex.com`），採用另一套 API 網域與語系代碼（`zh-hans`），但仍是相同的 `watchgrid` 結構化端點模式；標示的稅率僅為官方揭露的增值稅部分，不含進口環節消費稅（詳見 `data/evidence/rolex/CN/` 的限制說明）。

### Omega

Omega 目前已收錄 13 個市場，各市場配置筆數不相同：

| 市場 | 代碼 | 語系 | 幣別 | 價格語意 | 配置筆數 |
| --- | --- | --- | --- | --- | --- |
| 中國 | CN | `zh-Hans-CN` | CNY | 含稅（增值稅 13%） | 579 |
| 日本 | JP | `ja-JP` | JPY | 含稅（10%） | 552 |
| 韓國 | KR | `ko-KR` | KRW | 含稅（10%） | 554 |
| 瑞士 | CH | `de-CH` | CHF | 含稅（8.1%） | 552 |
| 香港 | HK | `zh-HK` | HKD | 未稅（0%） | 551 |
| 台灣 | TW | `zh-Hant-TW` | TWD | 含稅（5%） | 551 |
| 美國 | US | `en-US` | USD | 未稅（依州別而異） | 548 |
| 德國 | DE | `de-DE` | EUR | 含稅（19%） | 552 |
| 法國 | FR | `fr-FR` | EUR | 含稅（20%） | 552 |
| 西班牙 | ES | `es-ES` | EUR | 含稅（21%） | 552 |
| 英國 | GB | `en-GB` | GBP | 含稅（VAT 20%） | 549 |
| 義大利 | IT | `it-IT` | EUR | 含稅（22%） | 552 |
| 奧地利 | AT | `de-AT` | EUR | 含稅（20%） | 552 |

### Longines

Longines 目前已收錄 1 個市場：

| 市場 | 代碼 | 語系 | 幣別 | 價格語意 | 配置筆數 |
| --- | --- | --- | --- | --- | --- |
| 台灣 | TW | `zh-Hant-TW` | TWD | 含稅（5%） | 544 |

Longines 的 `collectionId` 採官方子系列網址路徑的最後一段（例如 `hydroconquest`、`master-collection`），而非 Master、Conquest 等五大家族；網站前端尚未加入 Longines 頁面。

實際的收集時間、來源、輪次與價格請讀取各市場的 history 與 evidence；本表不應用作下一次收集的筆數目標。

## 更新流程

### 先讀取基準

先閱讀本指南、四份 Schema、共用目錄、目標市場檔、目標市場歷史檔與既有 evidence。記錄更新前的筆數、雜湊、最後 `runId` 與未提交變更，避免覆寫他人工作。

確認目標市場、官方地區入口、語系與幣別。既有筆數只能用於發現異常，不能作為停止條件。

### 找到可重現的官方來源

對動態網站，優先找頁面實際使用的結構化資料，例如 JSON、REST、GraphQL、內嵌狀態或網路回應；確認地區參數、分頁／cursor 與真正的結束條件。若結構化來源不足，再以官方商品頁或 rendered UI 補齊與交叉驗證。

直接請求遭防護機制拒絕時，應使用已授權的真實瀏覽器環境觀察同源請求，不要猜測 endpoint 或把失敗當作資料不存在。工具不可用時，將能力限制如實記入 evidence，不能宣稱已完成全量收集。

### 先保存觀察，再更新正式資料

將來源網址、觀察時間、完整配置碼、當地文字、原始價格、新款標示、商品網址與分頁資訊寫入 `observations.json`。接著才正規化資料：

1. 新配置先加入 catalog 聯集，再建立或更新市場在地化資料。
2. 市場文字、圖片與完整配置碼必須能對回官方觀察。
3. 依市場格式解析價格；解析失敗須保留為待處理，不能轉為 `0` 或 `not-listed`。
4. 建立一個新的 `collectionRuns` 項目；只有價格或列出狀態改變的配置才追加價格點。
5. 新增或完整重建市場時，執行俗稱研究；純價格更新則保留既有俗稱並明記本次未研究。

### 驗證後交付

至少完成下列五類檢查，並把結果寫入 `validation-summary.json`：

1. JSON 與 Schema：無格式錯誤、重複 key、非法時間或不合型別的欄位。
2. 跨檔關聯：`watchId` 唯一，catalog、market 與 history 可雙向對應，`runId` 合法且順序正確。
3. 來源回對：本次正式資料能以完整配置碼回對 evidence，價格解析結果一致。
4. 完整性：有可查核的分頁／cursor 結束證據，並以獨立官方視圖或商品頁抽查代表性款式。
5. 變更安全：舊價格序列仍是新序列的前綴，舊輪次、既有配置與非目標市場未被意外修改。

提交前應檢查 README 是否仍正確描述長期結構與涵蓋範圍；單次市場的來源、時間、輪次與結果應留在 evidence，不要累積到 README。

## 指派 AI 任務

人類指派 AI／代理進行資料維護時，改用 `.agents/roles/` 下的角色定義（`multi-market-coordinator`、`single-market-maintainer`），該目錄同時同步至 `.claude/agents/` 與 `.codex/agents/`，可直接作為 subagent 調用。角色定義維護方式見 [.agents/roles/README.md](.agents/roles/README.md)；AI 執行任務時仍須依 `AGENTS.md` 與 `ai-data-maintenance-guide.md` 執行。

## 與網站的關係

前端建置會讀取 catalog、所有市場檔、所有價格歷史檔與已驗證的旅客退稅政策，輸出每個市場專用的靜態 JSON，以及單錶跨市場比較使用的精簡價格矩陣。資料不完整、配置無法對應、政策重複或缺少價格歷史時，建置會失敗，避免部署不完整的網站資料。詳細流程請見 [watch-app-guide.md](watch-app-guide.md)。

## 新增品牌前的檢查

新增其他品牌前，先確認其官方完整參考號能無損映射到 generic contract 的 `reference`，並定義穩定的 `brandId`、檔名、evidence 路徑與前端產生流程。若來源事實無法由現有 generic Schema 表達，必須先提出契約變更並取得同意；不得為了配合既有品牌或前端而填造來源不存在的識別欄位。
