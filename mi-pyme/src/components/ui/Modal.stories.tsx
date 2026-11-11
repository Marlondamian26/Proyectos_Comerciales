import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const meta = {
  title: "UI/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Accessible modal dialog with focus trapping, keyboard navigation, and multiple sizes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "full"],
      description: "Modal size",
    },
    closeOnOverlayClick: {
      control: "boolean",
      description: "Close when clicking overlay",
    },
    closeOnEscape: {
      control: "boolean",
      description: "Close on Escape key",
    },
    showCloseButton: {
      control: "boolean",
      description: "Show close button",
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

const ModalDemo = ({ size = "md", ...props }: { size?: "sm" | "md" | "lg" | "xl" | "full" } & Omit<React.ComponentProps<typeof Modal>, "isOpen" | "onClose">) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Abrir Modal ({size})</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size={size}
        {...props}
      />
    </div>
  );
};

const defaultArgs = {
  title: "Modal Básico",
  description: "Este es un modal de ejemplo con descripción",
  isOpen: false,
  onClose: () => {},
  children: <p className="text-muted-foreground">Contenido del modal</p>,
};

export const Default: Story = {
  args: defaultArgs,
  render: (args) => (
    <ModalDemo {...args}>
      <p className="text-muted-foreground">Contenido del modal. Puede contener cualquier contenido React.</p>
    </ModalDemo>
  ),
};

export const WithFooter: Story = {
  args: {
    ...defaultArgs,
    title: "Modal con Acciones",
    description: "Modal con botones de acción en el footer",
    footer: (
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => alert("Cancelado")}>Cancelar</Button>
        <Button onClick={() => alert("Confirmado")}>Confirmar</Button>
      </div>
    ),
  },
  render: (args) => (
    <ModalDemo {...args}>
      <p className="text-muted-foreground">¿Estás seguro de que quieres continuar?</p>
    </ModalDemo>
  ),
};

export const Small: Story = {
  args: {
    ...defaultArgs,
    title: "Modal Pequeño",
    size: "sm",
  },
  render: (args) => (
    <ModalDemo {...args}>
      <p className="text-muted-foreground">Contenido compacto para confirmaciones simples.</p>
    </ModalDemo>
  ),
};

export const Large: Story = {
  args: {
    ...defaultArgs,
    title: "Modal Grande",
    size: "lg",
  },
  render: (args) => (
    <ModalDemo {...args}>
      <div className="space-y-4">
        <p className="text-muted-foreground">Modal más ancho para formularios o contenido extenso.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <input type="text" placeholder="Nombre" className="px-3 py-2 border border-border rounded-lg bg-background" />
          <input type="email" placeholder="Email" className="px-3 py-2 border border-border rounded-lg bg-background" />
        </div>
      </div>
    </ModalDemo>
  ),
};

export const ExtraLarge: Story = {
  args: {
    ...defaultArgs,
    title: "Modal Extra Grande",
    size: "xl",
  },
  render: (args) => (
    <ModalDemo {...args}>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        <p className="text-muted-foreground">Modal muy ancho para dashboards o vistas complejas.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium">Elemento {i}</h4>
              <p className="text-sm text-muted-foreground">Descripción del elemento</p>
            </div>
          ))}
        </div>
      </div>
    </ModalDemo>
  ),
};

export const NoCloseOnOverlay: Story = {
  args: {
    ...defaultArgs,
    title: "Sin Cierre en Overlay",
    description: "El modal no se cierra al hacer clic fuera",
    closeOnOverlayClick: false,
  },
  render: (args) => (
    <ModalDemo {...args}>
      <p className="text-muted-foreground">Haz clic fuera para probar - el modal permanecerá abierto.</p>
    </ModalDemo>
  ),
};

export const NoCloseOnEscape: Story = {
  args: {
    ...defaultArgs,
    title: "Sin Cierre con Escape",
    description: "El modal no se cierra con la tecla Escape",
    closeOnEscape: false,
  },
  render: (args) => (
    <ModalDemo {...args}>
      <p className="text-muted-foreground">Presiona Escape - el modal permanecerá abierto.</p>
    </ModalDemo>
  ),
};

export const WithoutCloseButton: Story = {
  args: {
    ...defaultArgs,
    title: "Sin Botón Cerrar",
    description: "Modal sin botón de cerrar visible",
    showCloseButton: false,
    footer: (
      <Button onClick={() => alert("Cerrado desde footer")}>Cerrar</Button>
    ),
  },
  render: (args) => (
    <ModalDemo {...args}>
      <p className="text-muted-foreground">Sin botón X en la esquina superior.</p>
    </ModalDemo>
  ),
};

export const ComplexForm: Story = {
  args: {
    ...defaultArgs,
    title: "Formulario Complejo",
    size: "lg",
    footer: (
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancelar</Button>
        <Button>Guardar</Button>
      </div>
    ),
  },
  render: (args) => (
    <ModalDemo {...args}>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre completo</label>
          <input type="text" className="w-full px-3 py-2 border border-border rounded-lg bg-background" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full px-3 py-2 border border-border rounded-lg bg-background" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mensaje</label>
          <textarea rows={4} className="w-full px-3 py-2 border border-border rounded-lg bg-background" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="terms" className="rounded border-border" />
          <label htmlFor="terms" className="text-sm text-muted-foreground">Acepto los términos</label>
        </div>
      </form>
    </ModalDemo>
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
    ...defaultArgs,
    title: "Modal en Modo Oscuro",
    description: "Este modal se adapta automáticamente al tema oscuro",
    footer: (
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancelar</Button>
        <Button>Confirmar</Button>
      </div>
    ),
  },
  render: (args) => (
    <ModalDemo {...args}>
      <p className="text-muted-foreground">El modal usa las variables CSS del tema actual.</p>
    </ModalDemo>
  ),
};