import type { Preview } from '@storybook/react'
import { withPerformanceMonitor } from './performance-decorator'

const preview: Preview = {
  decorators: [withPerformanceMonitor as any],
}

export default preview
