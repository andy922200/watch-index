<script setup lang="ts">
import WatchIndexPage from '@/features/watch-index/WatchIndexPage.vue'

import { omegaWatchIndexConfig } from './brand'
</script>

<template>
  <WatchIndexPage :config="omegaWatchIndexConfig" />
</template>
