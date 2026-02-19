import preview from './preview'
import { __definePreview } from 'storybook/internal/csf'

const start = () => __definePreview(preview)
export default start

export {
  ADDON_ID,
  PANEL_ID,
  PERF_EVENTS,
  THRESHOLDS,
  DEFAULT_METRICS,
} from './performance-types'

export type { PerformanceMetrics, ElementTimingDisplay } from './performance-types'

export { withPerformanceMonitor } from './performance-decorator'
