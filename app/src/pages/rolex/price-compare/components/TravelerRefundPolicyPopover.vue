<script setup lang="ts">
import { Info } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Locale } from '@/plugins/i18n'
import type { TravelerRefundPolicy } from '@/types/traveler-refund-policy'

interface Props {
  marketName: string
  policy: TravelerRefundPolicy
}

const props = defineProps<Props>()
const { locale, t } = useI18n()

const eligibilitySummary = computed(() =>
  locale.value === Locale.zhTw
    ? props.policy.eligibilitySummary.zhTw
    : props.policy.eligibilitySummary.enUs,
)
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        :aria-label="t('site.watchPriceComparison.policySourcesTrigger', { marketName })"
        size="icon-xs"
        variant="ghost"
      >
        <Info aria-hidden="true" class="size-3.5" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="text-sm">
      <p class="font-medium">
        {{ marketName }}：{{ t('site.watchPriceComparison.policySources') }}
      </p>
      <div class="text-muted-foreground mt-2 grid gap-1">
        <a
          v-for="source in policy.sources"
          :key="source.url"
          class="text-primary w-fit underline underline-offset-4"
          :href="source.url"
          rel="noreferrer"
          target="_blank"
        >
          {{ source.publisher }} — {{ source.title }}
        </a>
        <p>{{ eligibilitySummary }}</p>
      </div>
    </PopoverContent>
  </Popover>
</template>
