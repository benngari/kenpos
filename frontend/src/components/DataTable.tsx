import { ReactNode } from "react";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export default function DataTable<T extends { _id: string }>({
  columns,
  rows,
  emptyText = "No records found",
  loading = false,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyText?: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            <tr>
              {columns.map((c) => (
                <th key={c.header} className={`text-left px-4 py-3 font-medium ${c.className || ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {columns.map((c, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-slate-400 dark:text-slate-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  {columns.map((c) => (
                    <td key={c.header} className={`px-4 py-3 ${c.className || ""}`}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
