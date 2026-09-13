import type { Meta, StoryObj } from "@storybook/react";
import { Input, Textarea, Select } from "@/components/ui/Input";
import React from "react";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Form input components with validation, icons, and accessibility features.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url"],
      description: "Input type",
    },
    error: {
      control: "text",
      description: "Error message",
    },
    hint: {
      control: "text",
      description: "Hint text",
    },
    disabled: {
      control: "boolean",
      description: "Disable input",
    },
    passwordToggle: {
      control: "boolean",
      description: "Show password toggle",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Nombre",
    placeholder: "Escribe tu nombre",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Email",
    placeholder: "tu@email.com",
    type: "email",
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    placeholder: "tu@email.com",
    type: "email",
    error: "El email no es válido",
    value: "email-invalido",
  },
};

export const WithHint: Story = {
  args: {
    label: "Contraseña",
    type: "password",
    hint: "Mínimo 8 caracteres con mayúscula y número",
    passwordToggle: true,
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: "Buscar",
    placeholder: "Buscar...",
    leftIcon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
  },
};

export const WithRightIcon: Story = {
  args: {
    label: "Monto",
    placeholder: "0.00",
    rightIcon: <span className="text-muted-foreground">$</span>,
  },
};

export const Disabled: Story = {
  args: {
    label: "Deshabilitado",
    placeholder: "No editable",
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    label: "Campo Requerido *",
    placeholder: "Obligatorio",
    required: true,
  },
};

export const TextareaDefault: Story = {
  render() {
    return (
      <Textarea
        label="Descripción"
        placeholder="Escribe una descripción..."
        rows={4}
      />
    );
  },
};

export const TextareaWithError: Story = {
  render() {
    return (
      <Textarea
        label="Comentario"
        placeholder="Tu comentario..."
        rows={3}
        error="El comentario es demasiado corto"
        value="Corto"
      />
    );
  },
};

export const SelectDefault: Story = {
  render() {
    return (
      <Select
        label="País"
        placeholder="Selecciona un país"
        options={[
          { value: "es", label: "España" },
          { value: "mx", label: "México" },
          { value: "ar", label: "Argentina" },
          { value: "co", label: "Colombia" },
          { value: "pe", label: "Perú" },
        ]}
      />
    );
  },
};

export const SelectWithError: Story = {
  render() {
    return (
      <Select
        label="Categoría"
        placeholder="Selecciona una categoría"
        options={[
          { value: "1", label: "Electrónica" },
          { value: "2", label: "Ropa" },
          { value: "3", label: "Hogar" },
        ]}
        error="Debes seleccionar una categoría"
      />
    );
  },
};

export const AllStates: Story = {
  render() {
    return (
      <div className="space-y-4 w-full max-w-md">
        <Input label="Normal" placeholder="Estado normal" />
        <Input label="Con valor" defaultValue="Valor predefinido" />
        <Input label="Error" placeholder="Con error" error="Este campo tiene un error" />
        <Input label="Deshabilitado" placeholder="No interactuable" disabled />
        <Input label="Solo lectura" defaultValue="Solo lectura" readOnly />
      </div>
    );
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
  render() {
    return (
      <div className="space-y-4">
        <Input label="Modo Oscuro" placeholder="Entrada en tema oscuro" />
        <Input label="Con error" placeholder="Error en oscuro" error="Error de validación" />
        <Textarea label="Textarea oscuro" placeholder="Área de texto" rows={3} />
        <Select
          label="Select oscuro"
          placeholder="Seleccionar"
          options={[
            { value: "1", label: "Opción 1" },
            { value: "2", label: "Opción 2" },
          ]}
        />
      </div>
    );
  },
};