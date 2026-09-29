<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { Checkbox } from '@/components/ui/checkbox'

export interface BrandFilterOption {
  id: string
  name: string
}

interface Props {
  options: readonly BrandFilterOption[]
  filtersExpanded: boolean
}

defineProps<Props>()

const selectedBrands = defineModel<string[]>({ required: true })

const { t } = useI18n()

const toggleBrand = (id: string, checked: boolean): void => {
  selectedBrands.value = checked
    ? [...selectedBrands.value, id]
    : selectedBrands.value.filter((value) => value !== id)
}
</script>

<template>
  <fieldset class="border-border border-t pt-5" :class="filtersExpanded ? '' : 'hidden lg:block'">
    <legend class="text-xs font-semibold tracking-widest uppercase">
      {{ t('site.explorer.brands') }}
    </legend>
    <label
      v-for="option in options"
      :key="option.id"
      class="mt-3 flex cursor-pointer items-center gap-3 text-sm"
    >
      <Checkbox
        :model-value="selectedBrands.includes(option.id)"
        @update:model-value="toggleBrand(option.id, $event === true)"
      />
      {{ option.name }}
    </label>
  </fieldset>
</template>
