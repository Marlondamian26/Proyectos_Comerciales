import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardLink } from "@/components/ui/Card";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Flexible card component with multiple variants, image support, and interactive states.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "elevated", "outlined", "ghost"],
      description: "Card visual variant",
    },
    shadow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl"],
      description: "Shadow intensity",
    },
    hoverLift: {
      control: "boolean",
      description: "Enable hover lift animation",
    },
    gradientBorder: {
      control: "boolean",
      description: "Show gradient border",
    },
    imageOverlay: {
      control: "boolean",
      description: "Show overlay on image",
    },
    badge: {
      control: "object",
      description: "Badge configuration",
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Título de la Tarjeta",
    description: "Esta es una descripción de ejemplo para la tarjeta.",
    children: (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Contenido de la tarjeta</p>
        <button className="text-sm font-medium text-primary hover:underline">Ver más</button>
      </div>
    ),
  },
};

export const WithImage: Story = {
  args: {
    title: "Tarjeta con Imagen",
    description: "Tarjeta con imagen superior y overlay",
    image: { src: "https://picsum.photos/seed/card/400/200", alt: "Imagen de ejemplo" },
    children: (
      <button className="text-sm font-medium text-primary hover:underline">Ver detalles</button>
    ),
  },
};

export const WithBadge: Story = {
  args: {
    title: "Tarjeta con Badge",
    description: "Tarjeta con badge de estado",
    badge: { text: "Nuevo", variant: "success" },
    children: <p className="text-sm text-muted-foreground">Contenido con badge</p>,
  },
};

export const WithFooter: Story = {
  args: {
    title: "Tarjeta con Footer",
    description: "Tarjeta con área de footer para acciones",
    footer: (
      <div className="flex gap-2">
        <button className="px-3 py-1.5 text-sm font-medium text-primary hover:underline">Cancelar</button>
        <button className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90">Confirmar</button>
      </div>
    ),
    children: <p className="text-sm text-muted-foreground">Contenido principal</p>,
  },
};

export const Interactive: Story = {
  args: {
    title: "Tarjeta Interactiva",
    description: "Haz clic en la tarjeta",
    onClick: () => alert("Tarjeta clickeada"),
    children: <p className="text-sm text-muted-foreground">Esta tarjeta es clickeable</p>,
  },
};

export const Elevated: Story = {
  args: {
    title: "Tarjeta Elevada",
    description: "Variante elevada con sombra pronunciada",
    variant: "elevated",
    children: <p className="text-sm text-muted-foreground">Contenido elevado</p>,
  },
};

export const Outlined: Story = {
  args: {
    title: "Tarjeta Outline",
    description: "Variada con borde grueso",
    variant: "outlined",
    children: <p className="text-sm text-muted-foreground">Contenido con borde</p>,
  },
};

export const Ghost: Story = {
  args: {
    title: "Tarjeta Ghost",
    description: "Sin fondo ni borde",
    variant: "ghost",
    children: <p className="text-sm text-muted-foreground">Contenido fantasma</p>,
  },
};

export const WithIcon: Story = {
  args: {
    title: "Con Icono",
    description: "Tarjeta con icono decorativo",
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>,
    children: <p className="text-sm text-muted-foreground">Tarjeta con icono</p>,
  },
};

export const GradientBorder: Story = {
  args: {
    title: "Borde Gradiente",
    description: "Tarjeta con borde gradiente animado",
    gradientBorder: true,
    children: <p className="text-sm text-muted-foreground">Borde con gradiente</p>,
  },
};

export const CardGrid: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
      <Card title="Tarjeta 1" description="Descripción 1">Contenido 1</Card>
      <Card title="Tarjeta 2" description="Descripción 2">Contenido 2</Card>
      <Card title="Tarjeta 3" description="Descripción 3">Contenido 3</Card>
      <Card title="Tarjeta 4" description="Descripción 4">Contenido 4</Card>
      <Card title="Tarjeta 5" description="Descripción 5">Contenido 5</Card>
      <Card title="Tarjeta 6" description="Descripción 6">Contenido 6</Card>
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
    <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
      <Card title="Oscuro 1" description="Descripción modo oscuro" variant="default">Contenido</Card>
      <Card title="Oscuro 2" description="Variante elevated" variant="elevated">Contenido</Card>
      <Card title="Oscuro 3" description="Variante outlined" variant="outlined">Contenido</Card>
      <Card title="Oscuro 4" description="Variante ghost" variant="ghost">Contenido</Card>
    </div>
  ),
};