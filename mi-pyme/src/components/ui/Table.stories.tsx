import type { Meta, StoryObj } from "@storybook/react";
import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";

const meta = {
  title: "UI/Table",
  component: Table,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Data table with sorting, selection, and loading states.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
}

const users: User[] = [
  { id: 1, name: "Juan Pérez", email: "juan@example.com", role: "Admin", status: "active" },
  { id: 2, name: "María García", email: "maria@example.com", role: "Usuario", status: "active" },
  { id: 3, name: "Carlos López", email: "carlos@example.com", role: "Editor", status: "pending" },
  { id: 4, name: "Ana Martín", email: "ana@example.com", role: "Usuario", status: "inactive" },
  { id: 5, name: "Pedro Sánchez", email: "pedro@example.com", role: "Admin", status: "active" },
];

const columns: Column<unknown>[] = [
  { key: "name", header: "Nombre", accessor: (row: unknown) => (row as User).name },
  { key: "email", header: "Email", accessor: (row: unknown) => (row as User).email },
  {
    key: "role",
    header: "Rol",
    accessor: (row: unknown) => (row as User).role,
    align: "center" as const,
  },
{
      key: "status",
      header: "Estado",
      accessor: (row: unknown) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          (row as User).status === "active" ? "bg-success/10 text-success" :
          (row as User).status === "pending" ? "bg-warning/10 text-warning" :
          "bg-muted text-muted-foreground"
        }`}>
          {(row as User).status === "active" ? "Activo" : (row as User).status === "pending" ? "Pendiente" : "Inactivo"}
        </span>
      ),
      align: "center" as const,
    },
];

export const Default: Story = {
  args: {
    data: users,
    columns,
  },
};

export const WithRowClick: Story = {
  args: {
    data: users,
    columns,
    onRowClick: (row: unknown) => alert(`Seleccionado: ${(row as User).name}`),
  },
};

export const Loading: Story = {
  args: {
    data: [],
    columns: columns as Column<unknown>[],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns: columns as Column<unknown>[],
    emptyMessage: "No se encontraron usuarios",
  },
};

export const Striped: Story = {
  args: {
    data: users,
    columns: columns as Column<unknown>[],
    striped: true,
  },
};

export const Compact: Story = {
  args: {
    data: users,
    columns: columns as Column<unknown>[],
    compact: true,
  },
};

export const NoHover: Story = {
  args: {
    data: users,
    columns: columns as Column<unknown>[],
    hoverable: false,
  },
};

export const CustomColumns: Story = {
  args: {
    data: users,
    columns: [
      { key: "name", header: "Usuario", accessor: (row: unknown) => <strong>{(row as User).name}</strong> },
      { key: "email", header: "Contacto", accessor: (row: unknown) => <a href={`mailto:${(row as User).email}`}>{(row as User).email}</a> },
      { key: "actions", header: "Acciones", accessor: () => <button className="text-primary hover:underline text-sm">Editar</button>, align: "center" as const },
    ] as Column<unknown>[],
  },
};

export const LargeDataset: Story = {
  args: {
    data: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Usuario ${i + 1}`,
      email: `usuario${i + 1}@example.com`,
      role: i % 3 === 0 ? "Admin" : i % 3 === 1 ? "Editor" : "Usuario",
      status: i % 3 === 0 ? "active" : i % 3 === 1 ? "pending" : "inactive",
    })) as User[],
    columns: columns as Column<unknown>[],
  },
};

export const DarkMode: Story = {
  decorators: [
    (StoryFn) => (
      <div className="dark p-8 rounded-xl bg-background border border-border w-full max-w-4xl">
        <StoryFn />
      </div>
    ),
  ],
  args: {
    data: users,
    columns: columns as Column<unknown>[],
  },
};