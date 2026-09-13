import React from 'react';
import { ListBlock } from '../../../types/contentBlock';
import { MathRenderer } from '../../../games/components/MathRenderer';
import { getAccessibleTextColor } from '../../../utils/colorContrast';
import { Plus, Trash2, List, ListOrdered } from 'lucide-react';

interface ListBlockRendererProps {
  block: ListBlock;
  isEditor?: boolean;
  isDarkTheme?: boolean;
  onUpdate?: (updatedContent: ListBlock['content']) => void;
}

export const ListBlockRenderer: React.FC<ListBlockRendererProps> = ({
  block,
  isEditor = false,
  isDarkTheme = !isEditor,
  onUpdate,
}) => {
  const { content } = block;
  const listType = content.listType || 'bullet';
  const items = content.items || ['Mục danh sách 1', 'Mục danh sách 2'];
  const fontSize = content.fontSize || (isDarkTheme ? 20 : 16);
  const color = getAccessibleTextColor(content.color, isDarkTheme);
  const lineHeight = content.lineHeight || 1.6;

  const handleUpdateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onUpdate?.({ ...content, items: newItems });
  };

  const handleAddItem = () => {
    const newItems = [...items, `Mục danh sách ${items.length + 1}`];
    onUpdate?.({ ...content, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index);
    onUpdate?.({ ...content, items: newItems });
  };

  const handleToggleType = (type: 'bullet' | 'numbered') => {
    onUpdate?.({ ...content, listType: type });
  };

  if (isEditor) {
    return (
      <div className="w-full h-full flex flex-col p-2 bg-transparent">
        {/* Type selector & Add item bar */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-slate-200/60">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => handleToggleType('bullet')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                listType === 'bullet'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3 h-3" />
              <span>Dấu chấm (•)</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleType('numbered')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                listType === 'numbered'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3 h-3" />
              <span>Thứ tự (1, 2..)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer transition"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm mục</span>
          </button>
        </div>

        {/* Editable items list */}
        <div className="space-y-1.5 flex-1">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 group/item">
              <span className="font-bold text-indigo-600 text-xs mt-1 w-5 text-right shrink-0 select-none">
                {listType === 'bullet' ? '•' : `${idx + 1}.`}
              </span>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleUpdateItem(idx, e.target.value)}
                  placeholder={`Nội dung mục ${idx + 1}...`}
                  style={{ fontSize: `${fontSize}px`, color }}
                  className="w-full px-2 py-1 bg-white/70 hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-400 rounded-lg outline-none transition font-medium text-xs sm:text-sm"
                />
              </div>
              <button
                type="button"
                disabled={items.length <= 1}
                onClick={() => handleRemoveItem(idx)}
                className="p-1 rounded text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 disabled:opacity-0 transition cursor-pointer"
                title="Xóa mục này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Presentation View
  if (listType === 'numbered') {
    return (
      <ol
        className="list-decimal list-inside space-y-2 px-2 py-1 select-text antialiased font-medium"
        style={{ fontSize: `${fontSize}px`, color, lineHeight }}
      >
        {items.map((item, idx) => (
          <li key={idx}>
            <span className="inline-block pl-1">
              <MathRenderer text={item} />
            </span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ul
      className="list-disc list-inside space-y-2 px-2 py-1 select-text antialiased font-medium"
      style={{ fontSize: `${fontSize}px`, color, lineHeight }}
    >
      {items.map((item, idx) => (
        <li
          key={idx}
          className={`${isDarkTheme ? 'marker:text-teal-400' : 'marker:text-indigo-600'}`}
        >
          <span className="inline-block pl-1">
            <MathRenderer text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
};
