import { withPerformanceMonitor } from '../../../src/performance-decorator'
import { applicationConfig } from '@storybook/angular'
import { provideAnimations } from '@angular/platform-browser/animations'

export default {
  decorators: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withPerformanceMonitor as any,
    applicationConfig({ providers: [provideAnimations()] }),
  ],
}
