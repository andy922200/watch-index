<script setup lang="ts">
import WatchIndexPage from '@/features/watch-index/WatchIndexPage.vue'

import { longinesWatchIndexConfig } from './brand'
</script>

<template>
  <WatchIndexPage :config="longinesWatchIndexConfig" />
</template>
