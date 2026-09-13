import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Toast, ToastContainer, useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

const meta = {
  title: "UI/Toast",
  component: Toast,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Toast notifications with multiple variants and auto-dismiss.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "error", "warning", "info"],
      description: "Toast variant",
    },
    duration: {
      control: "number",
      description: "Auto-dismiss duration in ms",
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

const ToastDemo = () => {
  const { toasts, addToast, dismissToast, success, error, warning, info } = useToast();
  return (
    <div>
      <div className="space-y-2 mb-4">
        <Button onClick={() => success("Operación completada con éxito", { title: "Éxito" })}>Success</Button>
        <Button variant="destructive" onClick={() => error("Ha ocurrido un error", { title: "Error" })}>Error</Button>
        <Button variant="secondary" onClick={() => warning("Advertencia importante", { title: "Advertencia" })}>Warning</Button>
        <Button variant="secondary" onClick={() => info("Información adicional", { title: "Info" })}>Info</Button>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export const Success: Story = {
  args: {
    message: "¡Operación completada exitosamente!",
    variant: "success",
    title: "Éxito",
  },
};

export const Error: Story = {
  args: {
    message: "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
    variant: "error",
    title: "Error",
  },
};

export const Warning: Story = {
  args: {
    message: "Esta acción no se puede deshacer.",
    variant: "warning",
    title: "Advertencia",
  },
};

export const Info: Story = {
  args: {
    message: "Nueva actualización disponible.",
    variant: "info",
    title: "Información",
  },
};

export const WithAction: Story = {
  args: {
    message: "¿Quieres guardar los cambios?",
    variant: "info",
    title: "Confirmar",
    action: (
      <Button size="sm" onClick={() => alert("Guardado")}>Guardar</Button>
    ),
  },
};

export const AllVariants: Story = {
  args: {
    message: "",
    variant: "info",
  },
  render: (args) => (
    <div className="grid gap-2 sm:grid-cols-2 max-w-xl">
      <Toast {...args} message="Operación exitosa" variant="success" title="Éxito" />
      <Toast {...args} message="Error en la operación" variant="error" title="Error" />
      <Toast {...args} message="Advertencia importante" variant="warning" title="Advertencia" />
      <Toast {...args} message="Información del sistema" variant="info" title="Info" />
    </div>
  ),
};

export const Container: Story = {
  args: {
    message: "",
    variant: "info",
  },
  render: () => <ToastDemo />,
};

export const NoAutoDismiss: Story = {
  args: {
    message: "Este toast no se cierra automáticamente",
    variant: "info",
    duration: 0,
    onClose: () => alert("Cerrado manualmente"),
  },
};

export const DarkMode: Story = {
  decorators: [
    (StoryFn) => (
      <div className="dark p-8 rounded-xl bg-background border border-border w-full max-w-md">
        <StoryFn />
      </div>
    ),
  ],
  args: {
    message: "",
    variant: "info",
  },
  render: (args) => (
    <div className="grid gap-2 sm:grid-cols-2">
      <Toast {...args} message="Éxito en modo oscuro" variant="success" title="Éxito" />
      <Toast {...args} message="Error en modo oscuro" variant="error" title="Error" />
      <Toast {...args} message="Advertencia en modo oscuro" variant="warning" title="Advertencia" />
      <Toast {...args} message="Info en modo oscuro" variant="info" title="Info" />
    </div>
  ),
};