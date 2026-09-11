<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { MarketComparisonRow } from '@/lib/watchPriceComparison'
import type { ComparisonMarket } from '@/types/watch-data'

import MarketPriceSlider from './MarketPriceSlider.vue'
import TravelerRefundPolicyPopover from './TravelerRefundPolicyPopover.vue'

/**
 * 單一市場列的顯示資料。所有需要 i18n 或格式化的欄位由呼叫端先決定好，
 * 這支元件只負責排版——格式化需要的語系、顯示幣別與匯率狀態都在頁面層，
 * 拆進來只會讓元件被迫認識整個比價流程。
 */
export interface MarketPriceRowView {
  code: string
  convertedPriceText: string
  detailsTitle: string
  differencePercent: number | null
  differenceText: string
  exchangeRateText: string
  flag: string
  isBaseline: boolean
  isDifferenceEmphasized: boolean
  marketName: string
  priceLabelText: string
  priceText: string
  priceUpdatedAtText: string
  slider: MarketComparisonRow['slider']
  travelerRefundPolicy: ComparisonMarket['travelerRefundPolicy']
}

interface Props {
  row: MarketPriceRowView
}

defineProps<Props>()

const { t } = useI18n()
</script>

<template>
  <li class="border-border rounded-lg border p-4" :data-testid="`market-price-${row.code}`">
    <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
      <div class="flex items-center gap-2 font-medium">
        <span aria-hidden="true">{{ row.flag }}</span>
        {{ row.marketName }}
        <span
          v-if="row.isBaseline"
          class="bg-secondary rounded-full px-2 py-0.5 text-xs font-normal"
        >
          {{ t('site.watchPriceComparison.baseline') }}
        </span>
        <TravelerRefundPolicyPopover
          v-if="row.travelerRefundPolicy"
          :market-name="row.marketName"
          :policy="row.travelerRefundPolicy"
        />
      </div>
      <p class="font-medium tabular-nums">{{ row.priceText }}</p>
    </div>
    <p class="text-muted-foreground mt-1 text-xs">{{ row.priceLabelText }}</p>
    <MarketPriceSlider
      class="mt-4"
      :difference-percent="row.differencePercent"
      :slider="row.slider"
      :title="row.detailsTitle"
    />
    <div class="mt-3 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
      <p class="tabular-nums">{{ row.convertedPriceText }}</p>
      <p :class="row.isDifferenceEmphasized ? 'font-medium tabular-nums' : 'text-muted-foreground'">
        {{ row.differenceText }}
      </p>
    </div>
    <div class="text-muted-foreground mt-3 grid gap-1 text-xs">
      <p>{{ row.priceUpdatedAtText }}</p>
      <p>{{ row.exchangeRateText }}</p>
    </div>
  </li>
</template>
