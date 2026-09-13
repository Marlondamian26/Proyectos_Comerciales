import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "@/components/Sidebar";
import { Rol } from "@/lib/auth/roles";

const meta = {
  title: "Layout/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Sidebar navigation with role-based items and active state.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    userRol: {
      control: "select",
      options: [null, "CLIENTE", "NEGOCIO", "LOGISTICA", "ADMIN"],
      description: "User role for conditional menu items",
    },
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

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