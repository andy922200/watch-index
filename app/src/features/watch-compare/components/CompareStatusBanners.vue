<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'

import { getBrandDisplayName } from '../utils/watchCompareDisplay'

interface Props {
  missingGuards: string[]
  tooMany: boolean
  selectedCount: number
  isLoading: boolean
  failedBrandIds: string[]
  currencyMismatch: boolean
  invalidIds: string[]
  validCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()

type ComparePageBanner =
  | { key: string; kind: 'text'; role: 'alert' | 'status' | null; tone: string; message: string }
  | { key: string; kind: 'load-error'; message: string }

const alertStrongTone = 'border-destructive/30 bg-destructive/5 mt-8 border p-4'

/**
 * 依目前資料狀態決定要顯示哪些提示；只要 `missingGuards` 非空即視為致命錯誤，
 * 優先於其餘提示單獨顯示（對應原本 template 的 `v-else` 包住其餘所有分支）。
 */
const banners = computed<ComparePageBanner[]>(() => {
  if (props.missingGuards.length) {
    return [
      {
        key: 'missing-guards',
        kind: 'text',
        role: 'alert',
        tone: 'text-destructive mt-8',
        message: t('site.explorer.missingGuard', { brands: props.missingGuards.join(', ') }),
      },
    ]
  }

  const result: ComparePageBanner[] = []

  if (props.tooMany) {
    result.push({
      key: 'too-many',
      kind: 'text',
      role: 'alert',
      tone: alertStrongTone,
      message: t('site.explorer.tooMany'),
    })
  }
  if (props.selectedCount < 2) {
    result.push({
      key: 'incomplete-selection',
      kind: 'text',
      role: 'status',
      tone: 'border-border mt-8 border p-8 text-center',
      message: t('site.explorer.incomplete'),
    })
  }
  if (props.isLoading) {
    result.push({
      key: 'loading',
      kind: 'text',
      role: 'status',
      tone: 'text-muted-foreground mt-8',
      message: t('site.explorer.loading'),
    })
  }
  if (props.failedBrandIds.length) {
    result.push({
      key: 'load-error',
      kind: 'load-error',
      message: t('site.explorer.loadError', {
        brands: props.failedBrandIds.map((id) => getBrandDisplayName(id, { t })).join(', '),
      }),
    })
  }
  if (props.currencyMismatch) {
    result.push({
      key: 'currency-mismatch',
      kind: 'text',
      role: 'alert',
      tone: alertStrongTone,
      message: t('site.explorer.currencyMismatch'),
    })
  }
  if (!props.isLoading && props.invalidIds.length) {
    result.push({
      key: 'invalid-ids',
      kind: 'text',
      role: 'alert',
      tone: 'border-border mt-8 border p-4 text-sm break-all',
      message: t('site.explorer.invalidIds', { ids: props.invalidIds.join(', ') }),
    })
  }
  if (!props.isLoading && !props.tooMany && props.selectedCount >= 2 && props.validCount < 2) {
    result.push({
      key: 'partial-data',
      kind: 'text',
      role: null,
      tone: 'text-muted-foreground mt-8',
      message: t('site.explorer.incomplete'),
    })
  }

  return result
})
</script>

<template>
  <template v-for="banner in banners" :key="banner.key">
    <p v-if="banner.kind === 'text'" :role="banner.role ?? undefined" :class="banner.tone">
      {{ banner.message }}
    </p>
    <div v-else role="alert" class="mt-8">
      <p>{{ banner.message }}</p>
      <Button variant="outline" class="mt-4" @click="emit('retry')">
        {{ t('site.explorer.retry') }}
      </Button>
    </div>
  </template>
</template>
