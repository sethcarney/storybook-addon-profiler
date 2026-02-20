import { defineComponent, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'

const COLORS = {
  primary: { bg: '#0969da', text: '#fff' },
  secondary: { bg: '#eaeef2', text: '#24292f' },
  danger: { bg: '#cf222e', text: '#fff' },
} as const

const ButtonComponent = defineComponent({
  name: 'ButtonComponent',
  props: {
    label: { type: String, default: 'Click me' },
    variant: {
      type: String as () => keyof typeof COLORS,
      default: 'primary',
    },
  },
  setup(props) {
    const count = ref(0)
    return { count, COLORS }
  },
  template: `
    <button
      @click="count++"
      :style="{
        backgroundColor: COLORS[variant].bg,
        color: COLORS[variant].text,
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }"
    >
      {{ label }}<template v-if="count > 0"> ({{ count }})</template>
    </button>
  `,
})

const meta: Meta<typeof ButtonComponent> = {
  title: 'Example/Vue Button',
  component: ButtonComponent,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
  },
}

export default meta
type Story = StoryObj<typeof ButtonComponent>

export const Primary: Story = {
  args: { label: 'Vue Primary Button', variant: 'primary' },
}

export const Secondary: Story = {
  args: { label: 'Vue Secondary Button', variant: 'secondary' },
}

export const Danger: Story = {
  args: { label: 'Vue Danger Button', variant: 'danger' },
}

/**
 * Triggers heavy DOM updates to exercise the performance collectors.
 */
export const ExpensiveRender: Story = {
  render: () => ({
    components: {},
    setup() {
      const items = ref<number[]>([])
      const addItems = () => {
        const start = items.value.length
        items.value = [...items.value, ...Array.from({ length: 500 }, (_, i) => start + i)]
      }
      return { items, addItems }
    },
    template: `
      <div>
        <button
          @click="addItems"
          style="padding: 8px 16px; background: #0969da; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;"
        >
          Add 500 items ({{ items.length }} total)
        </button>
        <div style="margin-top: 16px; max-height: 300px; overflow: auto;">
          <div
            v-for="item in items"
            :key="item"
            style="padding: 4px 8px; border-bottom: 1px solid #eee; font-size: 12px;"
          >
            Item #{{ item }}
          </div>
        </div>
      </div>
    `,
  }),
}
