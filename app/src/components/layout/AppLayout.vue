<script setup lang="ts">
interface Props {
  lang: string
}

defineProps<Props>()
</script>

<template>
  <main
    class="min-h-dvh bg-stone-100 p-4 text-stone-950 dark:bg-stone-950 dark:text-stone-100"
    :lang="lang"
  >
    <div class="mx-auto flex w-full max-w-300 flex-col items-center">
      <slot />
    </div>
  </main>
</template>
