import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/Button";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Versatile button component with multiple variants, sizes, and states.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "accent", "outline", "ghost", "destructive", "gradient", "gradientSecondary", "gradientAccent", "link"],
      description: "Visual style variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
      description: "Button size",
    },
    loading: {
      control: "boolean",
      description: "Show loading spinner",
    },
    disabled: {
      control: "boolean",
      description: "Disable button",
    },
    asChild: {
      control: "boolean",
      description: "Render as child component",
    },
    iconPosition: {
      control: "select",
      options: ["left", "right"],
      description: "Icon position",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "Botón Primario",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Botón Secundario",
    variant: "secondary",
  },
};

export const Accent: Story = {
  args: {
    children: "Botón Acento",
    variant: "accent",
  },
};

export const Outline: Story = {
  args: {
    children: "Botón Outline",
    variant: "outline",
  },
};

export const Ghost: Story = {
  args: {
    children: "Botón Ghost",
    variant: "ghost",
  },
};

export const Destructive: Story = {
  args: {
    children: "Botón Destructivo",
    variant: "destructive",
  },
};

export const Gradient: Story = {
  args: {
    children: "Botón Gradiente",
    variant: "gradient",
  },
};

export const GradientSecondary: Story = {
  args: {
    children: "Gradiente Secundario",
    variant: "gradientSecondary",
  },
};

export const GradientAccent: Story = {
  args: {
    children: "Gradiente Acento",
    variant: "gradientAccent",
  },
};

export const Link: Story = {
  args: {
    children: "Botón Enlace",
    variant: "link",
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

export const IconOnly: Story = {
  args: {
    children: "+",
    size: "icon",
    "aria-label": "Agregar",
  },
};

export const WithLeftIcon: Story = {
  args: {
    children: "Con Icono",
    icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>,
    iconPosition: "left",
  },
};

export const WithRightIcon: Story = {
  args: {
    children: "Siguiente",
    icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>,
    iconPosition: "right",
  },
};

export const Loading: Story = {
  args: {
    children: "Cargando...",
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "Deshabilitado",
    disabled: true,
  },
};

export const AllVariants: Story = {
  args: {
    children: "Variant",
  },
  render: (args) => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button {...args} variant="primary">Primario</Button>
      <Button {...args} variant="secondary">Secundario</Button>
      <Button {...args} variant="accent">Acento</Button>
      <Button {...args} variant="outline">Outline</Button>
      <Button {...args} variant="ghost">Ghost</Button>
      <Button {...args} variant="destructive">Destructivo</Button>
      <Button {...args} variant="gradient">Gradiente</Button>
      <Button {...args} variant="gradientSecondary">Grad. Sec.</Button>
      <Button {...args} variant="gradientAccent">Grad. Acc.</Button>
      <Button {...args} variant="link">Enlace</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  args: {
    children: "Size",
  },
  render: (args) => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button {...args} size="sm">Pequeño</Button>
      <Button {...args} size="md">Mediano</Button>
      <Button {...args} size="lg">Grande</Button>
      <Button {...args} size="icon" aria-label="Icono">+</Button>
    </div>
  ),
};

export const DarkMode: Story = {
  decorators: [
    (StoryFn) => (
      <div className="dark p-8 rounded-xl bg-background border border-border">
        <StoryFn />
      </div>
    ),
  ],
  args: {
    children: "Botón",
  },
  render: (args) => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button {...args} variant="primary">Primario</Button>
      <Button {...args} variant="secondary">Secundario</Button>
      <Button {...args} variant="outline">Outline</Button>
      <Button {...args} variant="ghost">Ghost</Button>
      <Button {...args} variant="destructive">Destructivo</Button>
    </div>
  ),
};