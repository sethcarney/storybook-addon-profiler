import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: [
    // Use the local addon source directly
    {
      name: '../dist/preset.js',
      options: {},
    },
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
}

export default config
