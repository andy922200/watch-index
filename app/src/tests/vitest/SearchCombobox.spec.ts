import { fireEvent, render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { defineComponent, ref } from 'vue'

import SearchCombobox, {
  type SearchComboboxGroup,
} from '@/components/search-combobox/SearchCombobox.vue'

const groups: SearchComboboxGroup[] = [
  {
    id: 'collections',
    label: 'Collections',
    options: [{ id: 'submariner', label: 'Submariner', trailing: '20' }],
  },
  {
    id: 'watches',
    label: 'Watches',
    options: [
      {
        id: 'm124060-0001',
        label: 'Submariner',
        description: 'm124060-0001',
      },
    ],
  },
]

describe('SearchCombobox', () => {
  const renderCombobox = () => {
    const query = ref('m12406')
    const selectedOptionId = ref('')
    const Harness = defineComponent({
      components: { SearchCombobox },
      setup: () => ({ groups, query, selectedOptionId }),
      template: `
        <SearchCombobox
          v-model:query="query"
          empty-message="No results"
          :groups="groups"
          :is-pending="false"
          label="Search"
          placeholder="Search anything"
          @select="selectedOptionId = $event"
        />
        <output>{{ selectedOptionId }}</output>
      `,
    })

    return render(Harness)
  }

  it('renders grouped options and reports the selected id', async () => {
    renderCombobox()

    await fireEvent.focus(screen.getByRole('combobox', { name: 'Search' }))
    expect(screen.getByRole('group', { name: 'Collections' })).toBeDefined()
    expect(screen.getByRole('group', { name: 'Watches' })).toBeDefined()

    await fireEvent.mouseDown(screen.getByRole('option', { name: /m124060-0001/ }))
    expect(screen.getByRole('status').textContent).toBe('m124060-0001')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('selects the active option with the keyboard', async () => {
    renderCombobox()

    const input = screen.getByRole('combobox', { name: 'Search' })
    await fireEvent.keyDown(input, { key: 'ArrowDown' })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByRole('status').textContent).toBe('m124060-0001')
  })

  it('closes when clicking outside', async () => {
    renderCombobox()

    await fireEvent.focus(screen.getByRole('combobox', { name: 'Search' }))
    expect(screen.getByRole('listbox')).toBeDefined()

    await fireEvent.pointerDown(document.body)
    await fireEvent.click(document.body)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('does not show suggestions while waiting for results', async () => {
    render(SearchCombobox, {
      props: {
        emptyMessage: 'No results',
        groups,
        isPending: true,
        label: 'Pending search',
        placeholder: 'Search anything',
        query: 'm12406',
      },
    })
    await fireEvent.focus(screen.getByRole('combobox', { name: 'Pending search' }))
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('uses caller-provided input and listbox ids', async () => {
    render(SearchCombobox, {
      props: {
        emptyMessage: 'No results',
        groups,
        inputId: 'product-search-input',
        isPending: false,
        label: 'Product search',
        listboxId: 'product-search-results',
        placeholder: 'Search products',
        query: 'submariner',
      },
    })

    const input = screen.getByRole('combobox', { name: 'Product search' })
    expect(input.getAttribute('id')).toBe('product-search-input')
    expect(input.getAttribute('aria-controls')).toBe('product-search-results')

    await fireEvent.focus(input)
    expect(screen.getByRole('listbox').getAttribute('id')).toBe('product-search-results')
  })
})
