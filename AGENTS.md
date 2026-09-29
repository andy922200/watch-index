# 專案代理指引

## 專案概述

Watch Index 是多品牌腕錶資料索引，目前正式資料涵蓋勞力士、Omega 與 Longines。各品牌與市場的實際範圍以 `README.md` 與正式資料檔為準，本文件不重複列舉。

## 文件與適用範圍

- 人類導覽與概念：`README.md`。
- 人類資料維護指南：`watch-data-collection-guide.md`。
- 人類前端指南：`watch-app-guide.md`。
- AI 執行資料維護前，必須完整閱讀 `ai-data-maintenance-guide.md` 與實際 Schema／目標資料檔。

## 開工順序

1. 執行 `git status`，確認工作區狀態並保留使用者既有未提交變更。
2. 依任務類型閱讀文件：資料維護見上節；前端修改先讀 `watch-app-guide.md`。
3. 只有前端任務或需要重新產生網站資料時，才從專案根目錄執行 `./init.sh`（檢查 Node／pnpm、安裝依賴、產生 `app/public/watch-data/`）；`./init.sh --dev` 會另外啟動開發伺服器並持續執行。純資料維護不需要。

## 完成前驗證

- 資料維護：依 `ai-data-maintenance-guide.md`「寫入後至少完成以下驗證」與「可執行驗證片段」逐項執行，回報 PASS、FAIL、NOT RUN 與限制；JSON 或 Schema 通過不代表來源正確或收集完整。
- 前端修改（在 `app/` 執行）：`pnpm type-check`；`pnpm exec vitest run`；變更互動、導覽、語言或市場切換時加跑 `pnpm test:e2e`；交付正式建置前跑 `pnpm build`。
- 執行 Vitest 或 Playwright 時，必須開 sub-agent 執行，以免測試輸出造成 context 過長。
- 不得為了通過檢查而修改、生成或修飾正式資料；驗證腳本只是檢查工具。
- `pnpm lint` 帶有 `--fix`，會直接改寫檔案；執行前確認工作區沒有不想混入的修改。

## 變更規則

- 所有面向人類的文件以繁體中文撰寫。
- 未經明確授權，不可假設其他品牌可沿用現有勞力士的識別碼、檔案命名、Schema 或前端呈現方式。
- 修改資料前先檢查工作區，保留使用者既有未提交變更。
- 價格歷史與 evidence 必須保留可追溯性；不得覆寫舊價格點、補造來源或保存機敏資訊。
- 同一輪收集中尚未 commit 的多次嘗試可整併為單一 evidence，但須保留各次嘗試紀錄；已 commit 的 evidence 不可變更，規則見 `ai-data-maintenance-guide.md`。
- 修改資料契約、Schema、資料產生流程或新增品牌前，先取得使用者明確同意。
- 修改前端 TypeScript 時，遵守 `.agents/skills/typescript-standards/SKILL.md`；修改 Vue 前端時，另遵守 `.agents/skills/vue-typescript-frontend/SKILL.md`。
