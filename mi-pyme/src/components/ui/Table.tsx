import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
}

export function Table<T>({
  data,
  columns,
  className,
  emptyMessage = "No hay datos disponibles.",
  isLoading = false,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border">
      <table
        className={cn("w-full border-collapse text-sm", className)}
        role="table"
        aria-busy={isLoading}
        aria-label={emptyMessage}
      >
        <thead>
            <tr className="bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "text-left font-medium py-3 px-4",
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="p-6 text-center">
                Cargando...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-6 text-center">
                <span className="text-muted-foreground">{emptyMessage}</span>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                aria-label={onRowClick ? "Seleccionar fila" : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("py-3 px-4", col.className)}
                  >
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

Table.displayName = "Table";
