# Omega Taiwan 收集流程範例

本檔案是 [ai-data-maintenance-guide.md](../ai-data-maintenance-guide.md)「來源發現與完整性」章節所指的具體範例，套用範圍與限制以該章節為準：下列 Omega Taiwan 步驟是本專案所有品牌與市場的具體範例，不是 Omega 專用例外。其他國家／地區均應套用相同原則：先由目標市場的官方站與真實瀏覽器發現來源，再確認實際分頁或 cursor、以來源明示的停止條件完成全量對帳、保存不可變更的 observations 與驗證結果，最後才更新 brand-isolated catalog、market 與 history。不得直接複製 Omega 的 URL、AJAX 參數、欄位名稱、語系、幣別或稅別；那些必須在每個品牌、每個市場重新確認。

以下細節適用於更新 Omega Taiwan（`brandId: omega`、`marketCode: TW`）的官方在售目錄；以本次收集日期與官方頁面實況為準，任何端點或欄位改變都要重新經由真實瀏覽器確認。

1. 在外部 Chrome 的 Omega 台灣站確認入口 `https://www.omegawatches.com.tw/watches`、繁中語系、可見分類、商品卡與價格；不要以其他 Omega 國家站替代。
2. 自入口頁發現所有官方 `/watches/{family}/{subcategory}/catalog` 分類連結。逐一開啟初始分類頁，取得官方顯示的腕錶總數與「載入更多」連結。
3. 必須在瀏覽器 network 中確認「載入更多」實際發出的同源請求。2026-09-18 的行為為在 `?p=<page>` 後加上 `ajax=1&noFilters=1`，回應的 `html.products_list` 是商品清單片段；這是可重現的觀察，不是永久保證的私有 API 契約。
4. 僅跟隨官方回傳的下一頁連結，直到沒有「載入更多」。以唯一 source-product ID 累積，並與分類頁的官方總數對帳；部分回應可能含前頁累積卡片，重複 source-product ID 不得重複計入。再以完整 Omega `reference` 建立正式資料的一筆腕錶。
5. 商品卡保存完整參考號、官方商品 URL、圖片、系列／型號原文、新款標示與原始 TWD 價格。商品頁補取 `watch_watchcase` 與錶盤欄位；錶盤優先讀取 `watch_dial`、`watch_dial_detailed_color` 或 `watch_dial_color`。若全數缺席，只能摘錄同一商品頁官方 `description` 中明確含「錶盤」的原文句段，並在 observations 記錄實際欄位來源；不可自行推測顏色或材質。
6. 價格使用商品卡的公開 TWD 金額。Omega 商品頁截至上述日期沒有明示稅別；依既有 Taiwan 市場規則記錄 `priceType: tax-include`、`taxRatePercent: 5` 時，必須在 evidence 明確說明這是市場規則的延用，而不是 Omega 的明示聲明。
7. 新 evidence 寫入 `data/evidence/omega/TW/<YYYY-MM-DD>/`，先建立 observations、collection summary 與 validation summary，再寫入 catalog、market 與 history。俗稱未研究時使用空陣列並標記 `NOT RUN`，不得宣稱台灣沒有俗稱。
