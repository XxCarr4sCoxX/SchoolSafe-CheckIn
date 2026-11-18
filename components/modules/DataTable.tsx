
export interface TableColumn {
  key: string;
  label: string;
}

export type TableRow = Record<
  string,
  string | number | null
>;

interface DataTableProps {
  columns: TableColumn[];
  rows: TableRow[];
  emptyMessage?: string;
}

export default function DataTable({
  columns,
  rows,
  emptyMessage = "Todavía no hay registros.",
}: DataTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <p className="font-medium text-gray-600">
          {emptyMessage}
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Los registros aparecerán aquí cuando se agreguen.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-5 py-4">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-blue-50/40">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="whitespace-nowrap px-5 py-4 text-gray-700"
                >
                  {row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
