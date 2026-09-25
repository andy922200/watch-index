import type { BaseWatch } from '@/types/watch-data'

/** Longines 目前只使用跨品牌共用腕錶欄位；品牌身分由 watchId 與 runtime guard 驗證。 */
export type LonginesWatch = BaseWatch
