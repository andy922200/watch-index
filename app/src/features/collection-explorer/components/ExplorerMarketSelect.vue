<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MarketCode, MarketOption } from '@/lib/markets'

interface Props {
  options: readonly MarketOption[]
}

defineProps<Props>()

const market = defineModel<MarketCode | null>({ required: true })

const { t } = useI18n()
</script>

<template>
  <div>
    <label for="explorer-market" class="mb-2 block text-xs font-semibold tracking-widest uppercase">
      {{ t('site.explorer.market') }}
    </label>
    <Select v-model="market">
      <SelectTrigger id="explorer-market" class="h-11"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem v-for="option in options" :key="option.code" :value="option.code">
            {{ option.flag }} {{ t(option.labelKey) }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>
