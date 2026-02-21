import React from "react"
import type { Meta, StoryObj } from "@storybook/react"

function Button({
  label = "Click me",
  variant = "primary",
  onClick
}: {
  label?: string
  variant?: "primary" | "secondary" | "danger"
  onClick?: () => void
}) {
  const [count, setCount] = React.useState(0)

  const colors = {
    primary: { bg: "#0969da", text: "#fff" },
    secondary: { bg: "#eaeef2", text: "#24292f" },
    danger: { bg: "#cf222e", text: "#fff" }
  }
  const { bg, text } = colors[variant]

  return (
    <button
      onClick={() => {
        setCount((c) => c + 1)
        onClick?.()
      }}
      style={{
        backgroundColor: bg,
        color: text,
        padding: "8px 16px",
        borderRadius: "6px",
        border: "none",
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
      }}
    >
      {label} {count > 0 ? `(${count})` : ""}
    </button>
  )
}

const meta: Meta<typeof Button> = {
  title: "Example/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger"]
    }
  }
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    label: "Primary Button",
    variant: "primary"
  }
}

export const Secondary: Story = {
  args: {
    label: "Secondary Button",
    variant: "secondary"
  }
}

export const Danger: Story = {
  args: {
    label: "Danger Button",
    variant: "danger"
  }
}

/**
 * This story intentionally triggers expensive re-renders
 * to demonstrate the performance profiler's detection capabilities.
 */
export const ExpensiveRender: Story = {
  render: () => {
    const [items, setItems] = React.useState<number[]>([])

    const addItems = () => {
      const newItems = Array.from({ length: 500 }, (_, i) => items.length + i)
      setItems((prev) => [...prev, ...newItems])
    }

    return (
      <div>
        <Button label={`Add 500 items (${items.length} total)`} onClick={addItems} />
        <div style={{ marginTop: "16px", maxHeight: "300px", overflow: "auto" }}>
          {items.map((item) => (
            <div
              key={item}
              style={{
                padding: "4px 8px",
                borderBottom: "1px solid #eee",
                fontSize: "12px"
              }}
            >
              Item #{item}
            </div>
          ))}
        </div>
      </div>
    )
  }
}
