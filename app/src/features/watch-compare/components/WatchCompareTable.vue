<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { MarketCode } from '@/lib/markets'
import type { PageLanguageCode } from '@/lib/pageRoutes'

import type { CompareColumnDisplay, CompareRow } from '../utils/watchCompareDisplay'
import CompareCellContent from './CompareCellContent.vue'
import CompareWatchHeader from './CompareWatchHeader.vue'

interface Props {
  columns: CompareColumnDisplay[]
  rows: CompareRow[]
  selectedMarket: MarketCode | null
  pageLanguage: PageLanguageCode
}

defineProps<Props>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const { t } = useI18n()

/** 卡片模式的品牌、參考編號已顯示於卡片標頭，不在明細列重複。 */
const CARD_HIDDEN_ROW_KEYS: ReadonlySet<string> = new Set(['brand', 'reference'])
</script>

<template>
  <div
    class="border-border mt-5 hidden overflow-x-auto rounded-sm border lg:block"
    tabindex="0"
    role="region"
    :aria-label="t('site.explorer.compareTable')"
  >
    <table class="w-full min-w-180 table-fixed border-collapse text-left">
      <caption class="sr-only">
        {{ t('site.explorer.compareTable') }}
      </caption>
      <thead>
        <tr class="bg-muted/30">
          <th
            scope="col"
            class="border-border bg-muted/30 w-40 border-b p-4 text-xs font-semibold tracking-widest uppercase"
          >
            {{ t('site.explorer.compareTable') }}
          </th>
          <th
            v-for="(column, index) in columns"
            :key="column.id"
            scope="col"
            class="border-border border-b border-l p-4 align-top"
          >
            <CompareWatchHeader
              :column="column"
              :index="index"
              :selected-market="selectedMarket"
              :page-language="pageLanguage"
              @remove="emit('remove', $event)"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key" class="border-border border-t align-top">
          <th scope="row" class="bg-muted/20 p-4 text-xs font-semibold">{{ row.label }}</th>
          <td
            v-for="(cell, cellIndex) in row.cells"
            :key="columns[cellIndex]?.id ?? cellIndex"
            class="border-border min-w-48 border-l p-4 text-sm leading-relaxed wrap-break-word"
          >
            <CompareCellContent :cell="cell" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <ul
    class="mt-5 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:hidden"
    :aria-label="t('site.explorer.compareTable')"
  >
    <li
      v-for="(column, index) in columns"
      :key="column.id"
      data-compare-card
      class="border-border min-w-0 rounded-sm border p-4"
    >
      <CompareWatchHeader
        :column="column"
        :index="index"
        :selected-market="selectedMarket"
        :page-language="pageLanguage"
        @remove="emit('remove', $event)"
      />
      <dl class="border-border mt-4 border-t">
        <template v-for="row in rows" :key="row.key">
          <div
            v-if="!CARD_HIDDEN_ROW_KEYS.has(row.key) && row.cells[index]"
            class="border-border border-b py-3"
          >
            <dt class="text-muted-foreground text-xs font-semibold">{{ row.label }}</dt>
            <dd class="mt-1 text-sm leading-relaxed wrap-break-word">
              <CompareCellContent :cell="row.cells[index]" />
            </dd>
          </div>
        </template>
      </dl>
    </li>
  </ul>
</template>
