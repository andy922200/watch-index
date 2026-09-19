# Watch Index：AI 資料維護指南

本文件規範 AI 如何收集、修正與驗證正式資料。人類可讀的概念與流程請見 [watch-data-collection-guide.md](watch-data-collection-guide.md)，專案概覽請見 [README.md](README.md)。

若文件、實際 Schema 與使用者指示衝突，優先採用使用者最新指示與實際資料契約，並先回報衝突。交付時只提供操作摘要、來源證據、檢查結果、差異與未完成項目；不要輸出內部推理。

## 適用範圍與硬性限制

- 目前正式資料包含勞力士（AT、CH、CN、DE、ES、FR、GB、HK、IT、JP、KR、SG、TH、TW、US 共 15 個市場）與 Omega Taiwan（TW，551 個唯一參考編號）。
- Catalog、market 與 price history 使用 brand-neutral v3 Schema；不得假定任何品牌的檔名、參考號格式或前端欄位適用於另一品牌。
- 未經明確授權，不得修改 Schema、另建正式格式、安裝依賴、推送遠端或繞過網站存取限制。
- 面向人類的文件一律使用繁體中文。

## 執行前檢查

在任何寫入前，讀取下列內容並檢查 `git status --short`：

1. 本文件、`README.md`、`watch-data-collection-guide.md`；`examples/` 內若有與目標品牌／任務相符的範例文件，一併閱讀（範例文件為說明性質，缺席不構成阻擋）。
2. `data/schemas/` 的實際 JSON Schema，包含旅客退稅政策 Schema。
3. 目標品牌的 `data/catalog/<brandId>-catalog.json`，以及目標市場的 `data/markets/`、`data/history/`、`data/evidence/`；維護退稅政策，或執行新增市場／全市場重新考證任務時，另讀取 `data/traveler-refund-policies.json` 與 `data/schemas/traveler-refund-policy.schema.json`。

保護使用者既有未提交修改。既有筆數與歷史結果只可用於回歸檢查，不能作為本次收集的目標或停止條件。

## 任務快速決策

| 任務 | 必做項目 | 不可做的事 |
| --- | --- | --- |
| 純價格更新 | 重新取得列出狀態與價格、建立 evidence、追加新 run、驗證變動 | 覆寫舊價格點、清空既有俗稱 |
| 全市場重新考證／新增市場 | 完整收集市場文字、商品網址、新款標示、價格與俗稱研究；並依「旅客退稅政策」章節的來源與 evidence 規則，為該市場建立或明確標示缺席 `data/traveler-refund-policies.json` 記錄 | 以舊筆數宣稱完整、跳過停止證據、略過該市場的旅客退稅政策查核 |
| 旅客退稅政策更新 | 以政府、海關、官方退稅作業者或可驗證經銷商來源先建立 evidence，再更新獨立政策檔 | 用名目稅率推測可退資格、店家參與或實際退款金額 |
| 新增品牌 | 先確認識別碼、Schema、檔案布局、前端型別與產生流程 | 把新品牌硬套進既有勞力士契約 |

## 正式資料契約

| 層級 | 實際位置 | 責任 | 不可放入 |
| --- | --- | --- | --- |
| Catalog | `data/catalog/<brandId>-catalog.json` | 跨市場穩定配置的聯集 | 價格、稅率、在地文字、俗稱 |
| Market | `data/markets/<brandId>-<market>-market.json` | 當地文字、商品網址、別名與新款標示 | 價格、幣別、稅務語意 |
| History | `data/history/[marketCode]/<brandId>-price-history.json` | 收集輪次與追加式價格／列出狀態 | 市場文字、圖片、俗稱、旅客退稅制度 |
| Traveler refund policy | `data/traveler-refund-policies.json` | 已驗證的市場級旅客退稅制度、資格摘要、來源與 evidence 關聯 | 官方價格、零售商參與推測、交易退款保證 |
| Evidence | `data/evidence/<brandId>/[marketCode]/[YYYY-MM-DD]/` | 原始觀察、收集方法與驗證 | Cookie、token、授權標頭、個資 |

一筆正式腕錶資料代表完整配置，且必須滿足：

```text
watchId === brandId + ":" + reference
```

`reference` 必須逐字保留品牌官方完整參考號，包括前導零、分隔符號與配置後綴；同基本型號但不同完整參考號是不同資料。新增品牌使用 generic Schema 與品牌官方完整 `reference`；來源若無法無損映射到現有契約，必須先取得 Schema 變更同意。

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

## Schema 發布流程

Catalog、market 與 price history 共用 `data-schema-vN` 版本線並同步升版；旅客退稅政策使用獨立的 `traveler-refund-schema-vN` 版本線。欄位、型別、必填條件、識別規則或 Schema 路徑約束改變時，必須提升對應的 `schemaVersion`。僅修改 `description`、`$comment` 或文件文字且未改變契約時，不升版。

發布新版本時固定執行：

1. 確認版本號、原始生效日、來源 commit，以及相容性與破壞性差異。
2. 在該來源 commit 建立 annotated tag；核心契約使用 `data-schema-vN`，退稅政策使用 `traveler-refund-schema-vN`。
3. 從該 tag 匯出原始 Schema，不得以工作區現行檔案代替歷史內容；核心契約附上三份同步版本的 Schema，退稅政策只附其獨立 Schema。
4. 為附件產生 `SHA256SUMS.txt`，建立非 prerelease 的 GitHub Release，並在繁體中文 notes 中列出原始生效日、來源 commit、相容性／破壞性差異及 tag 內原始檔連結。
5. 下載全部 Release 附件，確認 JSON 可解析、SHA-256 全部通過，且每份 Schema 與 `git show <tag>:<原始路徑>` 位元完全一致。
6. 確認 tag 解析到預期 commit、Release 狀態與 Latest 設定正確，並實際開啟 notes 中的檔案連結。

建立前必須同時檢查本機與遠端同名 tag。若同名 tag 已存在且指向不同 commit，立即停止；不得移動、強制推送或刪除重建。已發布的 tag 與 Release 附件一律不可覆寫；發布內容有誤時保留原版本，另發新版本並說明問題。歷史 evidence 同樣維持不可變更，不因 Schema 發布而回溯改寫。

## 來源發現與完整性

以目標市場的官方來源作為市場清單、在地文字與價格的事實基礎。對 JavaScript 網站，優先使用頁面實際載入的 JSON、REST、GraphQL、內嵌 state 或 network response，確認市場／語系參數、篩選狀態、分頁或 cursor 與真正的結束條件。再用不同的官方視圖、rendered UI 或商品頁進行獨立抽查。

Browser、CDP 或 network 工具不可用，不代表官方沒有結構化來源。若任務需要 network discovery，且環境已配置 Chrome DevTools 或等效 network MCP，必須實際呼叫並嘗試讀取請求／回應；僅確認工具存在不算完成。呼叫失敗時，在 `collection-summary.json` 或 `validation-summary.json` 記錄工具、錯誤摘要與後備嘗試。能力不足時標記 `NOT RUN / capability unavailable`，不得猜測 endpoint 或宣稱已完成全量收集。

### 可套用的官方收集流程：Omega Taiwan 範例

下列 Omega Taiwan 步驟是本專案所有品牌與市場的具體範例，不是 Omega 專用例外。其他國家／地區均應套用相同原則：先由目標市場的官方站與真實瀏覽器發現來源，再確認實際分頁或 cursor、以來源明示的停止條件完成全量對帳、保存不可變更的 observations 與驗證結果，最後才更新 brand-isolated catalog、market 與 history。不得直接複製 Omega 的 URL、AJAX 參數、欄位名稱、語系、幣別或稅別；那些必須在每個品牌、每個市場重新確認。完整步驟見 [examples/omega-taiwan-collection-workflow.md](examples/omega-taiwan-collection-workflow.md)。

## Evidence：最低內容與保存規則

每次更新建立新的 `data/evidence/<brandId>/[marketCode]/[YYYY-MM-DD]/`；Rolex 的 historical evidence 統一位於 `data/evidence/rolex/`，不再保留 `data/evidence/<marketCode>/` 的舊路徑。同日多次執行使用獨立 run 子目錄。至少保存：

- `observations.json`：完整配置碼、來源 URL、觀察時間、原始文字與價格、解析結果、商品網址及新款標示。
- `collection-summary.json`：市場、語系、入口、收集路徑、分頁／cursor、筆數、重複／衝突、停止證據與錯誤。
- `validation-summary.json`：PASS／FAIL／NOT RUN、抽查、差集、價格統計、限制及 README 是否需要同步。

若有俗稱研究，建立 `nickname-research.json`，記錄查詢、已檢閱來源及採用／拒絕理由。不得保存秘密，亦不得以舊正式資料生成假觀察。

Evidence 一旦寫入即不可變更，執行時必須遵守：

- 不得因為本輪結果與先前不同，就修改、刪除或「訂正」既有 evidence。不同輪次觀察到不同價格是合法且必要的差異。
- 不得為了配合新 Schema、新欄位或新品牌結構回溯改寫舊 evidence；`data/schemas/` 不驗證 evidence，舊格式維持原狀即可。
- 發現既有 evidence 的解析有誤時，在新的 run 目錄補一份更正記錄並指回原 `runId`，不得改寫原檔。
- 僅在誤存機敏資料或檔案損毀無法解析時可移除既有 evidence，並在該 run 記錄移除項目與原因。
- 不得刪除、壓縮或合併既有 evidence 以節省空間，也不得設定保存期限。

## 寫入、歷史與俗稱

價格歷史是 append-only：保留所有既有 `collectionRuns` 和價格點；每個價格點的 `runId` 必須存在且遞增，相鄰且狀態、價格完全相同的點不可重複加入。

新增或完整重建市場時，俗稱只有在能精確對應完整配置並附可信來源時才可採用。純價格更新時保留既有結果，將本次研究標記為 `NOT RUN (out of scope)`，不得清空既有資料。

`nicknameResearch.status = NOT RUN` 只能用於純價格更新任務。新增市場或全市場重新考證任務中，俗稱研究是必做項目：必須實際下查詢、檢視來源並記錄採用或拒絕理由，即使最終沒有任何候選通過精確對應門檻，也要記為 `PASS with 0 accepted results`，附上已查詢的關鍵字、已檢視來源與拒絕理由。不得因時間、範圍或效率考量而跳過查詢直接標記 `NOT RUN`；僅在查詢所需語言資源或工具確實不可用時，才能標記 `NOT RUN / capability unavailable` 並在 evidence 說明具體限制。

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

單一市場工作單元不得讀寫任何非自己負責市場的 `data/markets/`、`data/history/[marketCode]/`、`data/evidence/<brandId>/[marketCode]/` 檔案，也不得代替其他工作單元完成其任務——即使透過 `git status` 或其他方式觀察到其他工作單元尚未完成、已失敗、或已產出可用結果，也不得基於這個觀察去讀取、重建、覆寫其他市場的檔案，或代為合併 catalog。發現其他工作單元異常時，只能在自己的 evidence 或回報中如實記錄觀察到的狀況，並交由統籌者處理，不得自行介入代勞。單一市場工作單元也不得再自行派生其他工作單元（例如巢狀 fork／subagent）來處理原本不屬於自己範圍的市場；若任務要求多市場，應由統籌者逐一派工，而非由某個工作單元自行擴張範圍。違反市場隔離即視為交付失敗，即使代勞產出的資料內容本身正確也一樣，因為這會破壞「每個市場一個可信作者」的可追溯性。

### 委派子代理（fork／subagent／背景任務）的範圍控制

統籌者將子任務（例如「補完某市場尚未取得的商品詳情頁欄位」）委派給子代理時，任務描述必須明確限定該子代理只能讀寫其被指派的單一市場之來源、evidence、market 與 history 檔；不得只描述整體目標（例如「完成 Omega 的資料收集」）而讓子代理自行判斷範圍。即使子代理的執行環境技術上能存取其他市場、即使那些市場最終也屬於同一使用者交辦給統籌者的整體範圍，子代理仍不得自行擴大到委派描述以外的市場去收集、新增或覆寫正式資料或 evidence——這與「單一市場工作單元不得代替其他工作單元」是同一原則，差別只在於這裡的「其他工作單元」是統籌者自己尚未派工、也未同意由該子代理處理的範圍。

統籌者事後（例如透過 `git status`）發現子代理或任何其他來源已產出委派範圍外的正式資料或 evidence 時：

- 不得逕行採信、合併或宣稱這是本次收集的一部分。一律視為未經驗證的草稿，必須比照全新收集案件的驗證門檻重新獨立查核：來源筆數與官方分類總數逐一回對、19–21 款獨立抽查（重新即時開啟商品頁比對，不得只檢視該筆資料自帶的 collection-summary／validation-summary 文字敘述是否合理）、關鍵事實性引用（例如稅制依據的法規或函釋）另行查證其確實存在且引用正確。
- 查核過程與結果，連同「為何會出現此範圍外產出」的簡要說明，一併記錄於當次 evidence（可另立 correction-notes 或等效檔案），不得沉默採用、也不得當作與統籌者自行收集等同的來源可信度。
- 查核中發現該筆資料原有 evidence 存在錯誤描述時，依「Evidence 不可變更」規則另立更正記錄指回原檔案與原 run，不得回頭改寫原 evidence。

令 `C` 為既有 catalog 的完整配置集合，`M` 為本次已驗證的市場集合：

- `C ∩ M`：核對既有配置，不重複加入。
- `M − C`：取得所有穩定欄位後加入 catalog。
- `C − M`：保留；本次未觀察到不是下架證據。
- 更新後集合為 `C ∪ M`，並確認 `|C ∪ M| = |C| + |M| − |C ∩ M|`。

穩定欄位衝突、缺少官方圖片、未知完整配置或市場資料無法對應 catalog 時，停止宣稱完整，先列為待查。保留既有 JSON 的順序、兩格縮排、UTF-8 與尾端換行，避免無意義的全檔重排。

## 價格解析與稅制

先確認目標市場的貨幣與數字格式，再解析原始價格。例如日圓或台幣的逗號可能是千分位；德語格式中的點可能是千分位，而具有非零小數的價格無法無損寫入目前的整數契約。不可直接移除所有非數字字元，也不可自行乘以 100、四捨五入或截斷。

稅制依下列順序確認：官方價格說明、政府／稅務機關、可信補充資料。`tax-include` 是含適用消費稅、`tax-exclude` 是未稅、`no-tax` 是確定不課徵該類稅；未知稅率不可填 `0`。頂層的幣別、價格語意與稅率會影響歷史檔全部舊資料，若需改變解釋，必須先提出資料遷移與 Schema 決策，不能直接覆寫。

## 旅客退稅政策

旅客退稅制度是獨立、可變動的法律與零售作業事實，不是價格歷史的一部分。只在有一手來源與對應 evidence 時新增或更新 `data/traveler-refund-policies.json` 的市場記錄；來源應說明制度適用範圍、資格、零售商參與與出口核驗要求，並保存查核時間與原始 URL。

「市場有消費稅」不等於「腕錶購買者可以退稅」。名目稅率只能讓前端在沒有已驗證政策時以 `含稅價 ÷ (1 + 稅率)` 顯示未稅參考價，不能被寫成旅客資格、零售商參與或保證退款。沒有可靠政策時保持市場記錄缺席；不得為了讓比較頁完整而補造 unavailable／available 結論、費率、門檻或來源。

新增市場或對某市場執行全市場重新考證時，必須同時完成該市場的旅客退稅政策查核，並依查核結果在 `data/traveler-refund-policies.json` 新增或更新該市場的記錄（`policies` 陣列以 `marketCode` 字母序排列，插入新市場時比照既有順序，不做無關的整檔重排）：查到可信一手來源就記錄 `availability: "available"` 或 `"unavailable"` 並附上 `sources`／`evidencePath`；找不到可信一手來源時，不得補造結論，維持該市場記錄缺席即可，並在回報中說明未完成原因。查核與其 evidence（`data/evidence/<brandId>/[marketCode]/[YYYY-MM-DD]/traveler-refund-policy.json`）比照既有市場（如 `data/evidence/rolex/AT/2026-09-12/traveler-refund-policy.json`）的格式與查核標準辦理，不可與該市場的價格／目錄收集混為同一份 evidence 檔。純價格更新任務不需要重跑此查核。

## 完整性停止條件與抽查

以結構化來源收集時，必須同時具備最後一頁／空下一頁／null cursor／`hasNextPage: false` 等已驗證終止訊號、最後批次成功、沒有未解決的下一頁、唯一配置不再增加，並釐清官方 UI 總數的統計口徑。

以 DOM 為主時，必須確認沒有下一頁、載入更多或未完成的無限捲動；最後載入無錯誤或逾時；頁面穩定後集合不再增加。虛擬列表應逐批累積資料，不能只讀取最後的 DOM。下一頁存在但未產生新配置是異常，不是完成。

不得以初始畫面、搜尋引擎摘要、捲動次數、既有市場筆數或「筆數剛好相同」宣稱完整。獨立抽查應使用與主要收集路徑不同的官方視圖；完整重建市場時，抽查 19 至 21 款，至少涵蓋每個系列代表款、兩組同基本型號的不同配置、最低價、最高價、無公開價、新款與異常項目。記錄型號、來源、時間、比對欄位與結果。

## 交付門檻與反例

交付前確認正式 JSON、evidence 與必要的人類文件都已實際保存。摘要必須包含：市場／語系與官方 URL、觀察開始與完成時間、收集路徑與停止證據、原始與唯一配置數、差集、價格狀態、runId 與變動點、稅制、五層驗證、抽查、evidence 位置、俗稱研究、保護範圍及限制。

以下任一情況均不得宣稱完整完成或整體 PASS：README 的長期描述已受影響卻未同步；需要 network discovery 卻未留下實際嘗試與限制；尚有下一頁；價格解析失敗；證據無法回對；未執行的俗稱研究被說成「查無結果」；舊歷史被覆寫；新增市場／全市場重新考證任務略過旅客退稅政策查核，且未在回報中說明原因；新增市場／全市場重新考證任務因時間或效率考量跳過俗稱研究並標記 `NOT RUN`（而非實際查詢後得到 `PASS with 0 accepted results`，或因能力不足標記 `NOT RUN / capability unavailable`）；或子代理／背景任務產出委派範圍外市場的正式資料或 evidence，卻未依「委派子代理的範圍控制」章節重新獨立查核就逕行採信、合併或宣稱為本次收集成果。

驗證必須能攔下重複完整配置、孤兒 market／history 型號、不存在的 runId、`listed` 搭配 `null` 或字串價格、冗餘相鄰價格點、非零小數價格、未完成分頁、重複 JSON key、非法 JSON 常數與未經驗證的跨市場價格推算。驗證腳本是檢查工具，不能用來生成或修飾資料以通過檢查。

## 與人類文件的責任對照

| 主題 | 權威文件 | AI 的使用方式 |
| --- | --- | --- |
| 專案定位、手錶多品牌 | `README.md` | 讀取範圍，避免把現有品牌規則當成通用契約 |
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

### 跨檔案不變條件：跨品牌範例

此 Node.js 片段依 `brandId` 發現 catalog、market 與 history，驗證 generic identity、market／history 關聯、runId 與價格狀態。

它不取代 JSON Schema、來源回對或完整性驗證。完整片段見 [examples/cross-brand-validation-script.md](examples/cross-brand-validation-script.md)。

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

## 歷史回歸案例

案例只用來辨識回歸或擷取異常，不是後續驗收的筆數目標；日後結果不同時，檢查官方增減、差集與擷取問題，禁止補造或刪除資料以湊成案例中的數字。既有案例見 [examples/regression-cases.md](examples/regression-cases.md)；新增品牌／市場的回歸基準時，比照既有格式附加新小節，不覆寫既有案例。

## 最後自我檢查

- [ ] 未將初始批次、歷史筆數或搜尋結果當成完整清單。
- [ ] 已確認官方來源、目標市場、語系、篩選狀態與分頁／cursor 停止條件。
- [ ] 已實際嘗試可用的 network 工具，或明確記錄能力限制。
- [ ] 已先保存 evidence，且其中沒有 Cookie、授權標頭、token、session 或個資。
- [ ] 已保留完整配置碼與前導零，沒有以其他市場價格推算。
- [ ] 沒有把解析失敗當成無公開價格，也沒有把缺漏或逾時當成 `not-listed`。
- [ ] 沒有將價格放入 market、將在地文字放入 catalog，或無故清空俗稱。
- [ ] 已保留舊 run、舊價格點、非目標市場與使用者既有修改。
- [ ] 未修改、刪除或壓縮既有 evidence；本次結果與先前不一致時保留原記錄，必要時另建更正記錄。
- [ ] 已完成 Schema、跨檔、來源回對、完整性與變更安全驗證；未執行項目已標記 `NOT RUN`。
- [ ] 已完成獨立官方抽查，並檢查 README／人類指南是否需要同步。
- [ ] 新增市場或全市場重新考證時，已查核該市場的旅客退稅政策並更新 `data/traveler-refund-policies.json`（或在查無可信來源時，明確記錄缺席原因，未補造結論）。
- [ ] 多市場任務中，未讀寫任何非自己負責市場的 market／history／evidence 檔案，未代替其他工作單元完成任務或合併 catalog，也未自行派生其他工作單元處理範圍外的市場。
- [ ] 新增市場或全市場重新考證時，俗稱研究已實際執行並記錄查詢與來源（`PASS`，含 0 採用的情形），未因時間或效率考量以 `NOT RUN` 跳過。
- [ ] 委派給子代理／背景任務的範圍已在任務描述中明確限定單一市場；若發現子代理產出委派範圍外的正式資料或 evidence，已比照全新收集案件重新獨立查核（來源回對、獨立抽查、關鍵引用查證）並記錄查核過程，未逕行採信或合併。
