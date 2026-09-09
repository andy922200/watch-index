# 專案代理指引

## 文件與適用範圍

- 人類導覽與概念：`README.md`。
- 人類資料維護指南：`watch-data-collection-guide.md`。
- 人類前端指南：`watch-app-guide.md`。
- AI 執行資料維護前，必須完整閱讀 `ai-data-maintenance-guide.md` 與實際 Schema／目標資料檔。

## 目前狀態

- 專案名稱為 Watch Index；目前正式資料僅涵蓋勞力士，未來預計支援其他品牌。
- 未經明確授權，不可假設其他品牌可沿用現有勞力士的識別碼、檔案命名、Schema 或前端呈現方式。
- 所有面向人類的文件以繁體中文撰寫。

## 變更規則

- 修改資料前先檢查工作區，保留使用者既有未提交變更。
- 價格歷史與 evidence 必須保留可追溯性；不得覆寫舊價格點、補造來源或保存機敏資訊。
- 修改資料契約、Schema、資料產生流程或新增品牌前，先取得使用者明確同意。
- 修改前端 TypeScript 時，遵守 `.agents/skills/typescript-standards/SKILL.md`；修改 Vue 前端時，另遵守 `.agents/skills/vue-typescript-frontend/SKILL.md`。
