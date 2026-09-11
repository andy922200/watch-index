<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { RolexWatch } from '@/types/rolex-watch'

interface Props {
  watch: RolexWatch | null
}

defineProps<Props>()

const isOpen = defineModel<boolean>('open', { default: false })
const { t } = useI18n()

const getWatchImageAlt = (watch: RolexWatch): string =>
  t('site.watchList.imageAlt', { modelName: watch.modelName })
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent
      :close-label="t('site.watchDetails.close')"
      class="hide-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl"
    >
      <template v-if="watch">
        <DialogHeader>
          <DialogTitle>{{ watch.modelName }}</DialogTitle>
          <DialogDescription>
            {{ t('site.watchList.modelReferenceLabel') }}: {{ watch.modelReference }}
          </DialogDescription>
        </DialogHeader>
        <img
          class="mx-auto aspect-square w-full max-w-sm object-contain"
          :src="watch.imageUrl"
          :alt="getWatchImageAlt(watch)"
        />
        <dl class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <dt class="text-sm font-medium">{{ t('site.watchDetails.caseDescriptionLabel') }}</dt>
            <dd class="text-muted-foreground">{{ watch.caseDescription }}</dd>
          </div>
          <div class="flex flex-col gap-1">
            <dt class="text-sm font-medium">{{ t('site.watchDetails.dialDescriptionLabel') }}</dt>
            <dd class="text-muted-foreground">{{ watch.dialDescription }}</dd>
          </div>
        </dl>
      </template>
    </DialogContent>
  </Dialog>
</template>
