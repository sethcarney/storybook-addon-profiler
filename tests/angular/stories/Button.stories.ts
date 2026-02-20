import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import type { Meta, StoryObj } from '@storybook/angular'

const COLORS = {
  primary: { bg: '#0969da', text: '#fff' },
  secondary: { bg: '#eaeef2', text: '#24292f' },
  danger: { bg: '#cf222e', text: '#fff' },
} as const

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="count = count + 1"
      [style.backgroundColor]="colors[variant].bg"
      [style.color]="colors[variant].text"
      style="padding: 8px 16px; border-radius: 6px; border: none; font-size: 14px; font-weight: 500; cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
    >
      {{ label }}<ng-container *ngIf="count > 0"> ({{ count }})</ng-container>
    </button>
  `,
})
export class ButtonComponent {
  @Input() label = 'Click me'
  @Input() variant: keyof typeof COLORS = 'primary'
  count = 0
  colors = COLORS
}

@Component({
  selector: 'app-expensive-render',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <button
        (click)="addItems()"
        style="padding: 8px 16px; background: #0969da; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;"
      >
        Add 500 items ({{ items.length }} total)
      </button>
      <div style="margin-top: 16px; max-height: 300px; overflow: auto;">
        <div
          *ngFor="let item of items"
          style="padding: 4px 8px; border-bottom: 1px solid #eee; font-size: 12px;"
        >
          Item #{{ item }}
        </div>
      </div>
    </div>
  `,
})
export class ExpensiveRenderComponent {
  items: number[] = []

  addItems(): void {
    const start = this.items.length
    this.items = [...this.items, ...Array.from({ length: 500 }, (_, i) => start + i)]
  }
}

const meta: Meta<ButtonComponent> = {
  title: 'Example/Angular Button',
  component: ButtonComponent,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
  },
}

export default meta
type Story = StoryObj<ButtonComponent>

export const Primary: Story = {
  args: { label: 'Angular Primary Button', variant: 'primary' },
}

export const Secondary: Story = {
  args: { label: 'Angular Secondary Button', variant: 'secondary' },
}

export const Danger: Story = {
  args: { label: 'Angular Danger Button', variant: 'danger' },
}

/**
 * Triggers heavy DOM updates to exercise the performance collectors.
 */
export const ExpensiveRender: Story = {
  render: () => ({
    props: {},
    template: `<app-expensive-render />`,
    moduleMetadata: {
      imports: [ExpensiveRenderComponent],
    },
  }),
}
