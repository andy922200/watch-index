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

interface Props {
  options: ReadonlyArray<readonly [string, string]>
  filtersExpanded: boolean
}

defineProps<Props>()

const selectedCollection = defineModel<string>({ required: true })

const { t } = useI18n()
</script>

<template>
  <div :class="filtersExpanded ? '' : 'hidden lg:block'">
    <label
      for="explorer-collection"
      class="mb-2 block text-xs font-semibold tracking-widest uppercase"
    >
      {{ t('site.explorer.collection') }}
    </label>
    <Select v-model="selectedCollection">
      <SelectTrigger id="explorer-collection" class="h-11">
        <SelectValue :placeholder="t('site.explorer.allCollections')" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">{{ t('site.explorer.allCollections') }}</SelectItem>
          <SelectItem v-for="[key, label] in options" :key="key" :value="key">
            {{ label }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>
