import { withPerformanceMonitor } from "./performance-decorator"

export default {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  decorators: [withPerformanceMonitor as any]
}
