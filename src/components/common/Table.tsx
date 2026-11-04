import React from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface Action<T> {
  label: string;
  onClick: (item: T) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: (item: T) => boolean;
  icon?: React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: Action<T>[];
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  actions,
  loading = false,
  emptyMessage = 'No records found.',
  emptyAction,
  keyExtractor = (item, index) => item.id || item.user_id || index,
  className = '',
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-8 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-800 dark:border-slate-800 dark:border-t-white rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Loading data...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-12 text-center flex flex-col items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`}>
      <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
        <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 whitespace-nowrap ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item, index)}
              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 whitespace-nowrap ${
                    col.align === 'right'
                      ? 'text-right font-mono tabular-nums'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {col.render ? col.render(item) : item[col.key] ?? '—'}
                </td>
              ))}
              {actions && actions.length > 0 && (
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {actions.map((act, actIdx) => {
                      const isDisabled = act.disabled ? act.disabled(item) : false;
                      return (
                        <button
                          key={actIdx}
                          onClick={() => act.onClick(item)}
                          disabled={isDisabled}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            act.className ||
                            'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {act.icon}
                          {act.label}
                        </button>
                      );
                    })}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
