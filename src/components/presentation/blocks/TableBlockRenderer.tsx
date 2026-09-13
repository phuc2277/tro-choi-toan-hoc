import React from 'react';
import { TableBlock } from '../../../types/contentBlock';
import { MathRenderer } from '../../../games/components/MathRenderer';
import { Plus, Trash2 } from 'lucide-react';

interface TableBlockRendererProps {
  block: TableBlock;
  isEditor?: boolean;
  isDarkTheme?: boolean;
  onUpdate?: (updatedContent: TableBlock['content']) => void;
}

export const TableBlockRenderer: React.FC<TableBlockRendererProps> = ({
  block,
  isEditor = false,
  isDarkTheme = !isEditor,
  onUpdate,
}) => {
  const { content } = block;
  const headers = content.headers || ['Cột 1', 'Cột 2', 'Cột 3'];
  const rows = content.rows || [['Giá trị 1', 'Giá trị 2', 'Giá trị 3']];

  const handleUpdateHeader = (index: number, val: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = val;
    onUpdate?.({ ...content, headers: newHeaders });
  };

  const handleUpdateCell = (rIdx: number, cIdx: number, val: string) => {
    const newRows = rows.map((r, i) => (i === rIdx ? [...r] : r));
    newRows[rIdx][cIdx] = val;
    onUpdate?.({ ...content, rows: newRows });
  };

  const addColumn = () => {
    const newHeaders = [...headers, `Cột ${headers.length + 1}`];
    const newRows = rows.map((r) => [...r, '-']);
    onUpdate?.({ ...content, headers: newHeaders, rows: newRows });
  };

  const removeColumn = (cIdx: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, i) => i !== cIdx);
    const newRows = rows.map((r) => r.filter((_, i) => i !== cIdx));
    onUpdate?.({ ...content, headers: newHeaders, rows: newRows });
  };

  const addRow = () => {
    const newRow = new Array(headers.length).fill('-');
    onUpdate?.({ ...content, rows: [...rows, newRow] });
  };

  const removeRow = (rIdx: number) => {
    if (rows.length <= 1) return;
    onUpdate?.({ ...content, rows: rows.filter((_, i) => i !== rIdx) });
  };

  return (
    <div className="w-full h-full flex flex-col p-2 overflow-x-auto">
      {content.title && (
        <div
          className={`text-xs sm:text-sm font-black mb-2 text-center ${
            isDarkTheme ? 'text-slate-100' : 'text-slate-800'
          }`}
        >
          <MathRenderer text={content.title} />
        </div>
      )}

      {isEditor && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={addRow}
              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded border border-indigo-200 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Thêm hàng</span>
            </button>
            <button
              type="button"
              onClick={addColumn}
              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded border border-indigo-200 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Thêm cột</span>
            </button>
          </div>
        </div>
      )}

      <div
        className={`overflow-x-auto border rounded-xl shadow-sm ${
          isDarkTheme ? 'border-slate-700 bg-slate-800/90 text-slate-100' : 'border-slate-200 bg-white text-slate-800'
        }`}
      >
        <table className="w-full text-center border-collapse text-xs sm:text-sm">
          <thead>
            <tr
              className={`border-b font-bold ${
                isDarkTheme ? 'bg-slate-700/80 border-slate-600 text-teal-300' : 'bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              {headers.map((h, cIdx) => (
                <th
                  key={cIdx}
                  className={`p-2 border-r last:border-r-0 relative group ${
                    isDarkTheme ? 'border-slate-600' : 'border-slate-200'
                  }`}
                >
                  {isEditor ? (
                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => handleUpdateHeader(cIdx, e.target.value)}
                        className="w-full text-center bg-transparent border-b border-transparent focus:border-indigo-500 outline-none font-bold"
                      />
                      {headers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColumn(cIdx)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition"
                          title="Xóa cột"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <MathRenderer text={h} />
                  )}
                </th>
              ))}
              {isEditor && <th className="w-8 p-1"></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={`border-b last:border-b-0 ${
                  isDarkTheme
                    ? 'border-slate-700/80 hover:bg-slate-700/50'
                    : 'border-slate-100 hover:bg-slate-50/80'
                }`}
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`p-2 border-r last:border-r-0 ${
                      isDarkTheme ? 'border-slate-700/80 text-slate-200' : 'border-slate-100 text-slate-700'
                    }`}
                  >
                    {isEditor ? (
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => handleUpdateCell(rIdx, cIdx, e.target.value)}
                        className="w-full text-center bg-transparent border-b border-transparent focus:border-indigo-400 outline-none"
                      />
                    ) : (
                      <MathRenderer text={cell} />
                    )}
                  </td>
                ))}
                {isEditor && (
                  <td className="w-8 p-1 text-center">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(rIdx)}
                        className="text-slate-300 hover:text-red-500 transition"
                        title="Xóa hàng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
