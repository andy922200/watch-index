<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { computed, type HTMLAttributes } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button, type ButtonVariants } from '@/components/ui/button'
import { getBrandPageLanguagePaths } from '@/lib/pageUrls'
import { Locale } from '@/plugins/i18n'

import { BRAND_ID } from '../../brand'

interface Props {
  class?: HTMLAttributes['class']
  showIcon?: boolean
  variant?: ButtonVariants['variant']
}

const props = withDefaults(defineProps<Props>(), {
  class: undefined,
  showIcon: false,
  variant: 'outline',
})

const { locale, t } = useI18n()
const indexPageLanguagePaths = getBrandPageLanguagePaths({ brandId: BRAND_ID, page: 'index' })
const href = computed(() => indexPageLanguagePaths[locale.value === Locale.enUs ? 'enUs' : 'zhTw'])
</script>

<template>
  <Button as-child :class="props.class" :variant="variant">
    <a :href="href">
      <ArrowLeft v-if="showIcon" class="size-4" />
      {{ t('site.watchPriceComparison.backToIndex') }}
    </a>
  </Button>
</template>
