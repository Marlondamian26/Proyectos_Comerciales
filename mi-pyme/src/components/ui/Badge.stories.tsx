import type { Meta, StoryObj } from "@storybook/react";
import { Badge, StatusBadge } from "@/components/ui/Badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Status and label badges with multiple variants and sizes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "primary", "secondary", "success", "warning", "error", "info", "outline"],
      description: "Visual variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Badge size",
    },
    dot: {
      control: "boolean",
      description: "Show indicator dot",
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Predeterminado",
    variant: "default",
  },
};

export const Primary: Story = {
  args: {
    children: "Primario",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secundario",
    variant: "secondary",
  },
};

export const Success: Story = {
  args: {
    children: "Éxito",
    variant: "success",
  },
};

export const Warning: Story = {
  args: {
    children: "Advertencia",
    variant: "warning",
  },
};

export const Error: Story = {
  args: {
    children: "Error",
    variant: "error",
  },
};

export const Info: Story = {
  args: {
    children: "Información",
    variant: "info",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
};

export const Small: Story = {
  args: {
    children: "Pequeño",
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    children: "Mediano",
    size: "md",
  },
};

export const Large: Story = {
  args: {
    children: "Grande",
    size: "lg",
  },
};

export const WithDot: Story = {
  args: {
    children: "Con punto",
    variant: "success",
    dot: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const AllVariantsWithDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default" dot>Default</Badge>
      <Badge variant="primary" dot>Primary</Badge>
      <Badge variant="secondary" dot>Secondary</Badge>
      <Badge variant="success" dot>Success</Badge>
      <Badge variant="warning" dot>Warning</Badge>
      <Badge variant="error" dot>Error</Badge>
      <Badge variant="info" dot>Info</Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="pending" />
      <StatusBadge status="active" />
      <StatusBadge status="completed" />
      <StatusBadge status="cancelled" />
      <StatusBadge status="failed" />
      <StatusBadge status="draft" />
    </div>
  ),
};

export const StatusBadgesLarge: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="pending" size="lg" />
      <StatusBadge status="active" size="lg" />
      <StatusBadge status="completed" size="lg" />
      <StatusBadge status="cancelled" size="lg" />
    </div>
  ),
};

export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <div className="dark p-8 rounded-xl bg-background border border-border">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">Default</Badge>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <StatusBadge status="pending" />
        <StatusBadge status="active" />
        <StatusBadge status="completed" />
        <StatusBadge status="cancelled" />
      </div>
    </div>
  ),
};