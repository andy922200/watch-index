<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { PriceDomain } from '@/lib/explorerFilters'
import { formatCurrency } from '@/lib/formatters'

interface Props {
  domain: PriceDomain | null
  currencyMismatch: boolean
  locale: string
  filtersExpanded: boolean
}

const props = defineProps<Props>()

const priceRange = defineModel<number[]>({ required: true })
const priceFilterActive = defineModel<boolean>('active', { required: true })

const { t } = useI18n()

const priceRangeLabels = computed(() => {
  const domain = props.domain
  if (!domain) return null
  const format = (amount: number): string =>
    formatCurrency({
      amount,
      currency: domain.currencyCode,
      locale: props.locale,
      minimumFractionDigits: 0,
    })

  return {
    minimum: format(priceRange.value[0] ?? domain.min),
    maximum: format(priceRange.value[1] ?? domain.max),
  }
})

const activatePriceFilter = (): void => {
  priceFilterActive.value = true
}
const resetPriceRange = (): void => {
  if (!props.domain) return
  priceRange.value = [props.domain.min, props.domain.max]
  priceFilterActive.value = false
}
</script>

<template>
  <div :class="filtersExpanded ? '' : 'hidden lg:block'">
    <div class="flex items-center justify-between gap-2">
      <p id="explorer-price-range-label" class="text-xs font-semibold tracking-widest uppercase">
        {{ t('site.explorer.priceRange') }}
      </p>
      <Button v-if="priceFilterActive" variant="ghost" size="sm" @click="resetPriceRange">
        {{ t('site.explorer.resetPriceRange') }}
      </Button>
    </div>
    <Slider
      v-model="priceRange"
      class="mt-4"
      :min="domain?.min ?? 0"
      :max="domain?.max ?? 100"
      :step="domain?.step ?? 1"
      :disabled="!domain || currencyMismatch"
      :thumb-labels="[t('site.explorer.minPrice'), t('site.explorer.maxPrice')]"
      @update:model-value="activatePriceFilter"
    />
    <div
      v-if="priceRangeLabels"
      data-price-range-values
      class="text-muted-foreground mt-3 flex justify-between gap-2 text-xs tabular-nums"
    >
      <span :aria-label="t('site.explorer.minPrice')">{{ priceRangeLabels.minimum }}</span>
      <span :aria-label="t('site.explorer.maxPrice')">{{ priceRangeLabels.maximum }}</span>
    </div>
  </div>
</template>
