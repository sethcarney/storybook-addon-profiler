import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.ts'],
  addons: [
    {
      name: '../../../dist/preset.js',
      options: {},
    },
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
}

export default config
