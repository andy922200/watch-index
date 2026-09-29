<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const query = defineModel<string>({ required: true })

const { t } = useI18n()
</script>

<template>
  <div>
    <label for="explorer-search" class="sr-only">{{ t('site.explorer.search') }}</label>
    <input
      id="explorer-search"
      v-model="query"
      type="search"
      :placeholder="t('site.explorer.search')"
      class="border-input bg-background focus-visible:ring-ring h-11 w-full rounded-md border px-4 text-sm focus-visible:ring-2"
    />
  </div>
</template>
