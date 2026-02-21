import type { StorybookConfig } from "@storybook/angular"

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.ts"],
  addons: [
    {
      name: "../../../dist/preset.js",
      options: {}
    }
  ],
  framework: {
    name: "@storybook/angular",
    options: {}
  }
}

export default config
