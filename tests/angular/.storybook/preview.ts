import { applicationConfig } from "@storybook/angular"
import { provideAnimations } from "@angular/platform-browser/animations"

// withPerformanceMonitor is automatically injected by the addon preset.
export default {
  decorators: [applicationConfig({ providers: [provideAnimations()] })]
}
