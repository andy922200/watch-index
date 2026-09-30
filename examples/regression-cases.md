# 歷史回歸案例

本檔案是 [ai-data-maintenance-guide.md](../ai-data-maintenance-guide.md)「完整性停止條件與抽查」章節所指的具體案例集合，套用範圍與限制以該章節為準：每筆案例只用來辨識回歸或擷取異常，不是後續驗收的筆數目標。日後結果不同時，檢查官方增減、差集與擷取問題，禁止補造或刪除資料以湊成案例中的數字。

新增品牌／市場的回歸基準時，比照下列格式在本檔案附加新的 `##` 小節，不覆寫既有案例。

## Rolex — 日本（JP）2026-09-01

日本完成全部載入後有 1,465 個唯一完整配置、17 個系列；初始局部擷取為 56 筆，補齊後新增 1,409 個價格基準點。完整批次時間為 `2026-09-01T17:06:44+09:00`。

當時系列拆分為：1908 8、Land-Dweller 10、Day-Date 281、Sky-Dweller 39、Lady-Datejust 291、Datejust 681、Oyster Perpetual 62、Cosmograph Daytona 47、Submariner 7、Sea-Dweller 2、Deepsea 4、GMT-Master II 13、Yacht-Master 12、Yacht-Master II 2、Explorer 3、Explorer II 2、Air-King 1。

## Omega — 美國（US）2026-09-20

美國完成全部 16 個分類載入後有 548 個唯一完整配置，四大系列官方總數分別為 Seamaster 203、Speedmaster 95、Constellation 128、De Ville 122。完整批次時間為 `2026-09-20T14:59:49.952Z`。

分類拆分為：seamaster/aqua-terra-150m 107、seamaster/diver-300-m 60、seamaster/planet-ocean 18、seamaster/heritage-models 17、seamaster/instruments 1、speedmaster/moonwatch-professional 24、speedmaster/heritage-models 16、speedmaster/dark-side-of-the-moon 8、speedmaster/speedmaster-38-mm 11、speedmaster/two-counters 36、constellation/observatory 9、constellation/constellation 119、de-ville/ladymatic 6、de-ville/tresor 32、de-ville/prestige 82、de-ville/tourbillon 2。另外官方 Watchfinder 視圖比四系列多出 4 筆 Specialities（含 3 款懷錶），未納入本輪正式資料，屬待統籌者裁量的範圍擴充議題，詳見 `data/evidence/omega/US/2026-09-20/collection-summary.json`。

## Omega — 德國（DE）2026-09-20

德國完成全部 16 個分類載入後有 552 個唯一完整配置，四大系列官方總數分別為 Seamaster 201、Speedmaster 95、Constellation 128、De Ville 128。完整批次時間為 `2026-09-20T15:20:45.681Z`。

分類拆分為：seamaster/aqua-terra-150m 107、seamaster/diver-300-m 59、seamaster/planet-ocean 17、seamaster/heritage-models 17、seamaster/instruments 1、speedmaster/moonwatch-professional 24、speedmaster/heritage-models 16、speedmaster/dark-side-of-the-moon 8、speedmaster/speedmaster-38-mm 11、speedmaster/two-counters 36、constellation/observatory 9、constellation/constellation 119、de-ville/ladymatic 6、de-ville/tresor 38、de-ville/prestige 82、de-ville/tourbillon 2。與瑞士／香港既有市場相比，de-ville/ladymatic 在德國為 6 款（CH／HK 為 3 款），為真實市場差異，非擷取錯誤。

## Longines — 台灣（TW）2026-09-24

台灣完成官方「腕錶」分類 ProductList GraphQL 全部 23 頁（每頁 24 筆，第 23 頁 16 筆）後有 544 個唯一完整配置，第 24 頁官方回傳超出可用頁數錯誤。完整批次時間為 `2026-09-24T15:18:10.629Z`。

五大家族官方總數為 Master 110、Conquest 164、Spirit 53、Elegance 155、Heritage 62。30 個子系列中較大者為 conquest/conquest 82、master/master-collection 67、conquest/hydroconquest 57、elegance/primaluna 39、elegance/dolcevita 36；完整拆分見 `data/evidence/longines/TW/2026-09-24/collection-summary.json`。參考號含英數後綴（如 `L5.512.4.71.A`），不可假設全為數字。

## Longines — 香港（HK）2026-09-25

香港完成官方「腕錶」分類 ProductList GraphQL 全部 21 頁（每頁 24 筆，第 21 頁 13 筆）後有 493 個唯一完整配置，第 22 頁官方回傳超出可用頁數錯誤。完整批次時間見 `data/evidence/longines/HK/2026-09-25/observations.json`。

30 個子系列官方總數與收集結果逐一相符；與台灣市場相比，HK 多出 `master-gmt`（2 筆，TW 無），但沒有 `conquest-classic`（TW 有 6 筆）。完整拆分見 `data/evidence/longines/HK/2026-09-25/collection-summary.json`。稅制依港府「無加值稅或銷售稅」記錄為 `no-tax`。

## Longines — 日本（JP）2026-09-25

日本完成官方「腕錶」分類 ProductList GraphQL 全部 26 頁（每頁 24 筆，第 26 頁 12 筆）後有 612 個唯一完整配置，第 27 頁官方回傳超出可用頁數錯誤。完整批次時間見 `data/evidence/longines/JP/2026-09-25/observations.json`。

31 個子系列（較台灣多出 `master-gmt`）官方總數與收集結果逐一相符，5 家族合計 612。完整拆分見 `data/evidence/longines/JP/2026-09-25/collection-summary.json`。與台灣市場對照僅供差異概況：544 對 612，交集 453、JP 獨有 159、TW 獨有 91，屬官方目錄的真實市場差異。

## Longines — 韓國（KR）2026-09-25

韓國完成官方「腕錶」分類 ProductList GraphQL 全部 19 頁（每頁 24 筆整除）後有 456 個唯一完整配置，第 20 頁官方回傳超出可用頁數錯誤。完整批次時間見 `data/evidence/longines/KR/2026-09-25/observations.json`。

五大家族官方總數為 Master 91、Conquest 132、Spirit 43、Elegance 132、Heritage 58，合計 456，30 個子系列逐一相符。與台灣市場相比，KR 多出 `master-gmt`（2 筆：`L2.844.6.71.2`、`L2.844.8.71.2`），但沒有 `evidenza`（官方導覽回傳「頁面不存在」，已交叉驗證為真實市場差異）。完整拆分見 `data/evidence/longines/KR/2026-09-25/collection-summary.json`。

## Longines — 瑞士（CH）2026-09-25

瑞士完成官方 ProductList 全部 34 頁（每頁 24 筆，第 34 頁 13 筆）後有 805 個唯一完整配置，第 35 頁官方回傳超出可用頁數錯誤。完整批次時間見 `data/evidence/longines/CH/2026-09-25/observations.json`。

5 個家族、30 個子系列官方總數與收集結果全數相符（35/35）。官方站台同時提供 `de-ch`／`fr-ch`／`it-ch` 三個對等語言 store view（皆為相同 805 筆目錄與 CHF 價格，僅語系不同），本次以 `de-ch` 為代表語系收錄，詳見 evidence 的 `localeDecision` 章節。稅制依 Swiss Federal Tax Administration 現行標準稅率記為 `tax-include`、8.1%。完整拆分見 `data/evidence/longines/CH/2026-09-25/collection-summary.json`。

## Longines — 英國（GB）2026-09-25

英國完成官方 ProductList 全部 34 頁（每頁 24 筆，第 34 頁 14 筆）後有 806 個唯一完整配置，第 35 頁官方回傳超出可用頁數錯誤。完整批次時間見 `data/evidence/longines/GB/2026-09-25/observations.json`。

5 個家族官方總數為 conquest 186、elegance 331、heritage 73、master 158、spirit 58，合計 806；31 個子系列逐一相符。稅制依 GOV.UK VAT 標準稅率與 StoreConfig 含稅顯示設定記為 `tax-include`、20%；`data/traveler-refund-policies.json` 既有 GB 記錄已正確反映英國脫歐後大不列顛無隨身攜帶商品旅客退稅、僅北愛爾蘭有限提供的制度現況。完整拆分見 `data/evidence/longines/GB/2026-09-25/collection-summary.json`。

## Longines — 美國（US）2026-09-25

美國完成官方 ProductList 全部 34 頁（每頁 24 筆，第 34 頁 10 筆）後有 802 個唯一完整配置，第 35 頁官方回傳 HTTP 404。完整批次時間見 `data/evidence/longines/US/2026-09-25/observations.json`。

5 個家族官方總數為 master 158、conquest 186、spirit 58、elegance 327、heritage 73，合計 802；31 個子系列逐一相符。美國無全國統一銷售稅，官方 FAQ 明確說明列表／商品頁標價為稅前價、實際稅額於結帳時依收件地址計算，因此記為 `tax-exclude`、`taxRatePercent: null`（不得以單一州稅率代表全國）。完整拆分見 `data/evidence/longines/US/2026-09-25/collection-summary.json`。

## Longines — 德國（DE）2026-09-27

德國官方站台實際入口為 `https://www.longines.com/de/watches`（無 `-de` 地區後綴；`/de-de/watches` 回傳 404，經開啟站內語系選單確認實際路徑）。以 Chrome DevTools MCP 側錄同源 GraphQL ProductList 請求後，改以 `pageSize=900` 單次重放取得全部資料，`total_count=804` 與 `items.length=804`相符，並與獨立渲染的 PLP 標題「804 Produkte」一致；無下一頁／cursor 需求。完整批次時間約 `2026-09-27T15:04:58.000Z`。

31 個系列 slug 與既有 catalog 的 31 個 `collectionId` 完全一致。與既有 874 筆聯集 catalog 比對：交集 797、德國市場新發現 7 筆（`L3.430.4.90.9`、`L3.779.4.19.6`、`L3.788.4.19.6`、`L3.830.4.90.6`、`L4.523.0.50.2`、`L4.810.4.12.6`、`L5.200.4.75.A`），其中 4 筆為「Sylt Edition」（Sylt 為知名德國度假島），疑似德國市場限定款式，已併入共用 catalog。稅制依聯邦司法部 UStG §12(1) 現行標準稅率記為 `tax-include`、19%。完整拆分見 `data/evidence/longines/DE/2026-09-27/collection-summary.json` 與 `validation-summary.json`。

## Longines — 法國（FR）2026-09-27

法國官方站台實際入口為 `https://www.longines.com/fr/watches`（無 `-fr` 地區後綴；`/fr-fr/watches` 回傳 404）。完成官方 ProductList 全部 33 頁（每頁 24 筆，第 33 頁 8 筆）後有 776 個唯一完整配置，第 34 頁官方回傳「currentPage value 34 specified is greater than the 33 page(s) available.」。完整批次時間為 `2026-09-27T15:23:03.000Z`。

5 個家族官方總數為 conquest 186、elegance 301、heritage 73、master 158、spirit 58，合計 776；31 個子系列（另有 1 個次要重疊分類 `watches/elegance/agassiz/all`）逐一相符，並以兩個獨立渲染頁面（pilot-majetek「3 produits」、elegance「301 produits」）交叉驗證一致。與既有 catalog 比對：776 筆全數已存在於既有聯集（交集＝776，無新配置）。稅制依法國經濟財政部 TVA 稅率頁面（鐘錶不在 10%／5.5%／2.1% 優惠稅率列舉範圍）記為 `tax-include`、20%；官方稅務網站對直接 HTTP 請求（WebFetch）回傳 403，改以瀏覽器實際開啟頁面確認。完整拆分見 `data/evidence/longines/FR/2026-09-27/collection-summary.json`。

## Longines — 新加坡（SG）2026-09-27

新加坡官方站台入口 `https://www.longines.com/en-sg/watches` 首次嘗試即有效。完成官方 ProductList 全部 32 頁（前 31 頁每頁 24 筆＋第 32 頁 11 筆）後有 755 個唯一完整配置，第 33 頁官方回傳「currentPage value 33 specified is greater than the 32 page(s) available.」。完整批次時間見 `data/evidence/longines/SG/2026-09-27/observations.json`。

5 個家族官方總數為 conquest 180、elegance 294、heritage 70、master 157、spirit 54，合計 755；31 個子系列逐一相符。與既有 catalog 比對：755 筆全數已存在於既有聯集（交集＝755，無新配置），與瑞士（805）、英國（806）等既有市場高度重疊。稅制依 IRAS 現行 GST 稅率（2024-01-01 起 9%）與「Displaying and quoting prices」含稅標示規定記為 `tax-include`、9%，與既有 Rolex SG 市場稅率判定一致（各自獨立查核，互為佐證）。755 筆商品官方 `stock_status` 全數為 `OUT_OF_STOCK`（與多數其他市場以 `IN_STOCK` 為主不同），已以 20 款商品頁 JSON-LD 交叉核對排除擷取錯誤，但未能查證確切原因，列為已知限制。完整拆分見 `data/evidence/longines/SG/2026-09-27/collection-summary.json`。

## Longines — 西班牙（ES）2026-09-29

西班牙官方站台入口為 `https://www.longines.com/es/watches`（官網國家選單「España」）。以 `pageSize=900` 單次重放（DE 作法）時官方回傳 GraphQL「Unexpected error.」，改回官網自身的每頁 24 筆：完成全部 34 頁（前 33 頁每頁 24 筆、第 34 頁 16 筆）後有 808 個唯一完整配置，第 35 頁官方回傳「currentPage value 35 specified is greater than the 34 page(s) available.」，並與渲染列表頁標題「808 productos」一致。收集期間官方後端對部分頁面間歇性回傳「Unexpected error.」（同一頁重試後即成功，非特定商品損壞），失敗頁以第二輪重試補齊。完整批次時間見 `data/evidence/longines/ES/2026-09-29/observations.json`。

依 `preferred_category` 統計的 5 個家族為 conquest 188、elegance 331、heritage 73、master 158、spirit 58，合計 808；31 個系列 slug 皆為既有 `collectionId`。與既有 catalog 比對：交集 806、新增 2 筆（`L3.369.4.09.6`、`L3.369.4.12.6`，HydroConquest 30 mm 石英款）。稅制依官方銷售條款「incluyen el IVA local」與 AEAT 一般稅率記為 `tax-include`、21%。完整拆分見 `data/evidence/longines/ES/2026-09-29/collection-summary.json`。

## Longines — 義大利（IT）2026-09-29

義大利官方站台入口為 `https://www.longines.com/it/watches`（官網國家選單「Italia」），但收集開始時該頁與 `/it/watches/master` 回傳 HTTP 500，因此由正常渲染的子系列頁 `/it/watches/master/master-collection`（「101 prodotti」）側錄 `store: it_it`／`lang: it-it` 的 ProductList 請求，再改用全腕錶分類 `category_uid = NA==`。完成全部 34 頁（前 33 頁每頁 24 筆、第 34 頁 16 筆）後有 808 個唯一完整配置，第 35 頁官方回傳超出可用頁數錯誤；收集完成後列表頁恢復渲染並顯示「808 prodotti」。間歇性「Unexpected error.」比 ES 更頻繁，失敗頁同樣以第二輪重試補齊。

參考號集合與 ES 完全相同（808 筆，含相同的 2 筆目錄新增配置），但有 386 筆價格不同，屬真實市場差異。稅制依官方銷售條款「includono l'IVA locale」與 Normattiva 所載 D.P.R. 633/1972 第 16 條記為 `tax-include`、22%；Agenzia delle Entrate 網站對 WebFetch 與瀏覽器皆拒絕存取，未嘗試繞過。完整拆分見 `data/evidence/longines/IT/2026-09-29/collection-summary.json`。
