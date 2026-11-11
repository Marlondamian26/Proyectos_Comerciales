import type { Meta, StoryObj } from "@storybook/react";
import { Navbar } from "@/components/Navbar";
import { Rol } from "@/lib/auth/roles";

const meta = {
  title: "Layout/Navbar",
  component: Navbar,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Main navigation bar with role-based menu items and theme toggle.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    userRol: {
      control: "select",
      options: [undefined, "CLIENTE", "NEGOCIO", "LOGISTICA", "ADMIN"],
      description: "User role for conditional menu items",
    },
  },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guest: Story = {
  args: {
    userRol: undefined,
  },
};

export const Cliente: Story = {
  args: {
    userRol: Rol.CLIENTE,
  },
};

export const Negocio: Story = {
  args: {
    userRol: Rol.NEGOCIO,
  },
};

export const Logistica: Story = {
  args: {
    userRol: Rol.LOGISTICA,
  },
};

export const Admin: Story = {
  args: {
    userRol: Rol.ADMIN,
  },
};

export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <div className="dark min-h-screen bg-background">
        <Story />
      </div>
    ),
  ],
  args: {
    userRol: Rol.ADMIN,
  },
};