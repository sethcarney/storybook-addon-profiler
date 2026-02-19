import type { Preview } from '@storybook/react'
import { withPerformanceMonitor } from '../src/performance-decorator'

const preview: Preview = {
  decorators: [withPerformanceMonitor as any],
}

export default preview
