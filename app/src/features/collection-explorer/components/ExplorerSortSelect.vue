<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ExplorerSort } from '@/lib/explorerFilters'

interface Props {
  currencyMismatch: boolean
}

defineProps<Props>()

const sort = defineModel<ExplorerSort>({ required: true })

// 選單只提供價格排序與「清除排序」；'default' 代表未選擇，顯示 placeholder。
const selectedSort = computed<ExplorerSort | undefined>({
  get: () => (sort.value === 'default' ? undefined : sort.value),
  set: (value) => {
    if (value === 'default' || value === 'price-asc' || value === 'price-desc') sort.value = value
  },
})

const { t } = useI18n()
</script>

<template>
  <div>
    <label for="explorer-sort" class="sr-only">{{ t('site.explorer.sort') }}</label>
    <Select v-model="selectedSort">
      <SelectTrigger id="explorer-sort" class="h-11">
        <SelectValue :placeholder="t('site.explorer.sort')" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem v-if="sort !== 'default'" value="default">
            {{ t('site.explorer.sortClear') }}
          </SelectItem>
          <SelectItem value="price-asc" :disabled="currencyMismatch">
            {{ t('site.explorer.sortPriceAsc') }}
          </SelectItem>
          <SelectItem value="price-desc" :disabled="currencyMismatch">
            {{ t('site.explorer.sortPriceDesc') }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>
