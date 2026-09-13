<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { formatList, getIntlLocale } from '@/lib/formatters'
import { isEuMember, type MarketCode, marketOptions } from '@/lib/markets'

const { locale, t } = useI18n()

/** 使用者具稅務居民身分的市場代碼；可複選（例如雙重稅務居民）。 */
const selectedMarketCodes = defineModel<MarketCode[]>({ required: true })

const isOpen = ref(false)

const intlLocale = computed(() => getIntlLocale(locale.value))

const selectedMarketNames = computed<string[]>(() =>
  marketOptions
    .filter((option) => selectedMarketCodes.value.includes(option.code))
    .map((option) => t(option.labelKey)),
)

const summaryText = computed<string>(() =>
  selectedMarketNames.value.length === 0
    ? t('site.watchPriceComparison.taxResidencySectionUnsetSummary')
    : t('site.watchPriceComparison.taxResidencySectionSetSummary', {
        markets: formatList(selectedMarketNames.value, intlLocale.value),
      }),
)

const isMarketSelected = (code: MarketCode): boolean => selectedMarketCodes.value.includes(code)

const setMarketSelected = (code: MarketCode, value: boolean | 'indeterminate'): void => {
  const isChecked = value === true

  selectedMarketCodes.value = isChecked
    ? [...selectedMarketCodes.value, code]
    : selectedMarketCodes.value.filter((existing) => existing !== code)
}
</script>

<template>
  <Collapsible v-model:open="isOpen" class="border-border rounded-lg border">
    <CollapsibleTrigger
      class="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-4 py-3 text-left"
    >
      <span class="min-w-0">
        <span class="block text-sm font-medium">
          {{ t('site.watchPriceComparison.taxResidencySectionTitle') }}
        </span>
        <span class="text-muted-foreground block text-xs">{{ summaryText }}</span>
      </span>
      <ChevronDown
        class="size-4 shrink-0 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        aria-hidden="true"
      />
    </CollapsibleTrigger>
    <CollapsibleContent class="border-border border-t px-4 py-4">
      <p class="text-muted-foreground text-sm">
        {{ t('site.watchPriceComparison.taxResidencySectionDescription') }}
      </p>
      <ul class="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        <li v-for="option in marketOptions" :key="option.code">
          <Label :for="`tax-residency-${option.code}`" class="cursor-pointer">
            <Checkbox
              :id="`tax-residency-${option.code}`"
              :model-value="isMarketSelected(option.code)"
              @update:model-value="(value) => setMarketSelected(option.code, value)"
            />
            <span aria-hidden="true">{{ option.flag }}</span>
            <span class="font-normal">{{ t(option.labelKey) }}</span>
            <span
              v-if="isEuMember(option.code)"
              class="bg-secondary rounded-full px-1.5 py-0.5 text-xs font-normal"
            >
              {{ t('site.watchPriceComparison.taxResidencyEuBadge') }}
            </span>
          </Label>
        </li>
      </ul>
      <p class="text-muted-foreground mt-4 text-xs leading-relaxed">
        {{ t('site.watchPriceComparison.taxResidencyEuHelperText') }}
      </p>
    </CollapsibleContent>
  </Collapsible>
</template>
