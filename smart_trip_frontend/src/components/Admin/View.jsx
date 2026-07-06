export default function View({ columns, data, actions }) {
  return (
    <div className="overflow-auto rounded-xl border border-slate-800 bg-slate-900/60">
      <table className="min-w-full divide-y divide-slate-800 text-xs">
        <thead>
          <tr className="bg-slate-950/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider"
              >
                {col.title}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-10 text-center text-slate-500 italic">
                No records found.
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3 text-slate-300 whitespace-nowrap max-w-[220px] truncate">
                    {item[col.key] ?? <span className="text-slate-600 italic">—</span>}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => action.onClick(item)}
                          className={`px-3 py-1 text-[10px] rounded-lg font-bold transition-colors ${action.className}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
