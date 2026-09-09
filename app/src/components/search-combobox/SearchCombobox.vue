<script setup lang="ts">
import { Search } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

export interface SearchComboboxOption {
  description?: string
  id: string
  label: string
  trailing?: string
}

export interface SearchComboboxGroup {
  id: string
  label: string
  options: readonly SearchComboboxOption[]
}

interface Props {
  emptyMessage: string
  groups: readonly SearchComboboxGroup[]
  inputId?: string
  isPending: boolean
  label: string
  listboxId?: string
  placeholder: string
}

const props = withDefaults(defineProps<Props>(), {
  inputId: 'search-combobox-input',
  listboxId: 'search-combobox-suggestions',
})
const query = defineModel<string>('query', { default: '' })

const emit = defineEmits<{
  select: [optionId: string]
}>()

const searchRoot = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const isSelectingOption = ref(false)
const activeOptionIndex = ref(0)

const options = computed(() => props.groups.flatMap((group) => group.options))
const hasQuery = computed(() => query.value.trim().length > 0)
const activeOptionId = computed(() => {
  const option = options.value[activeOptionIndex.value]

  return option ? `${props.listboxId}-${option.id}` : undefined
})

const openSuggestions = (): void => {
  isOpen.value = hasQuery.value
}

const closeSuggestions = (): void => {
  isOpen.value = false
}

const selectOption = (optionId: string): void => {
  isSelectingOption.value = true
  emit('select', optionId)
  closeSuggestions()
}

const moveActiveOption = (offset: number): void => {
  if (options.value.length === 0) {
    return
  }

  activeOptionIndex.value =
    (activeOptionIndex.value + offset + options.value.length) % options.value.length
}

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    openSuggestions()
    moveActiveOption(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    openSuggestions()
    moveActiveOption(-1)
  } else if (event.key === 'Enter' && isOpen.value) {
    const option = options.value[activeOptionIndex.value]

    if (option) {
      event.preventDefault()
      selectOption(option.id)
    }
  } else if (event.key === 'Escape') {
    closeSuggestions()
  }
}

watch(query, () => {
  activeOptionIndex.value = 0

  if (isSelectingOption.value) {
    isSelectingOption.value = false
    return
  }

  isOpen.value = hasQuery.value
})

watch(options, () => {
  activeOptionIndex.value = 0
})

onClickOutside(searchRoot, closeSuggestions)
</script>

<template>
  <div ref="searchRoot" class="relative w-full max-w-md">
    <label :for="props.inputId" class="mb-2 block text-sm font-medium">{{ label }}</label>
    <div class="relative">
      <Search
        class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <input
        :id="props.inputId"
        v-model="query"
        type="text"
        role="combobox"
        :aria-activedescendant="isOpen && !isPending ? activeOptionId : undefined"
        :aria-controls="props.listboxId"
        :aria-expanded="isOpen && !isPending"
        :placeholder="placeholder"
        autocomplete="off"
        class="bg-background focus-visible:ring-ring h-10 w-full rounded-md border py-2 pr-10 pl-9 text-sm shadow-sm outline-none focus-visible:ring-2"
        @focus="openSuggestions"
        @keydown="handleKeydown"
      />
    </div>
    <div
      v-if="isOpen && !isPending"
      :id="props.listboxId"
      role="listbox"
      :aria-label="label"
      class="hide-scrollbar bg-popover text-popover-foreground absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-md border p-1 shadow-md"
    >
      <p v-if="options.length === 0" class="px-3 py-6 text-center text-sm">{{ emptyMessage }}</p>
      <div v-for="group in groups" :key="group.id" role="group" :aria-label="group.label">
        <p class="text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium">{{ group.label }}</p>
        <button
          v-for="option in group.options"
          :id="`${props.listboxId}-${option.id}`"
          :key="option.id"
          type="button"
          role="option"
          :aria-selected="options.indexOf(option) === activeOptionIndex"
          class="hover:bg-accent focus-visible:bg-accent flex w-full items-center justify-between rounded-sm px-2 py-2 text-left outline-none"
          @mousedown.prevent="selectOption(option.id)"
        >
          <span class="flex min-w-0 flex-col">
            <span class="text-sm">{{ option.label }}</span>
            <span v-if="option.description" class="text-muted-foreground font-mono text-xs">{{
              option.description
            }}</span>
          </span>
          <span v-if="option.trailing" class="text-muted-foreground ml-2 shrink-0 text-xs">{{
            option.trailing
          }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
