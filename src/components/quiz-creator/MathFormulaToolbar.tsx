import React, { useState } from 'react';
import { MathRenderer } from '../../games/components/MathRenderer';
import {
  Sparkles,
  Divide,
  Superscript,
  Subscript,
  Table as TableIcon,
  Shapes,
  Sigma,
  Eye,
  Check,
  Code,
  Info,
} from 'lucide-react';

interface MathFormulaToolbarProps {
  onInsert: (snippet: string) => void;
  previewText?: string;
  className?: string;
}

export const MathFormulaToolbar: React.FC<MathFormulaToolbarProps> = ({
  onInsert,
  previewText,
  className = '',
}) => {
  const [activeCategory, setActiveCategory] = useState<'algebra' | 'geometry' | 'symbols' | 'templates'>('algebra');
  const [showLivePreview, setShowLivePreview] = useState(true);

  const algebraSnippets = [
    { label: 'Phân số', snippet: '$\\frac{a}{b}$', preview: '\\frac{a}{b}' },
    { label: 'Căn bậc 2', snippet: '$\\sqrt{x}$', preview: '\\sqrt{x}' },
    { label: 'Căn bậc n', snippet: '$\\sqrt[n]{x}$', preview: '\\sqrt[n]{x}' },
    { label: 'Lũy thừa', snippet: '$x^2$', preview: 'x^2' },
    { label: 'Chỉ số dưới', snippet: '$x_1$', preview: 'x_1' },
    { label: 'Cộng trừ', snippet: '$\\pm$', preview: '\\pm' },
    { label: 'Hệ phương trình', snippet: '$\\begin{cases} 2x + y = 5 \\\\ x - 3y = 2 \\end{cases}$', preview: '\\begin{cases} 2x+y=5 \\\\ x-3y=2 \\end{cases}' },
    { label: 'Delta', snippet: '$\\Delta = b^2 - 4ac$', preview: '\\Delta = b^2 - 4ac' },
    { label: 'Đẳng thức/BĐT', snippet: '$a^2 + b^2 \\ge 2ab$', preview: 'a^2 + b^2 \\ge 2ab' },
  ];

  const geometrySnippets = [
    { label: 'Tam giác', snippet: '$\\triangle ABC$', preview: '\\triangle ABC' },
    { label: 'Góc', snippet: '$\\widehat{A}$', preview: '\\widehat{A}' },
    { label: 'Độ (°)', snippet: '$60^\\circ$', preview: '60^\\circ' },
    { label: 'Vuông góc', snippet: '$AB \\perp CD$', preview: 'AB \\perp CD' },
    { label: 'Song song', snippet: '$a \\parallel b$', preview: 'a \\parallel b' },
    { label: 'Vectơ', snippet: '$\\vec{AB}$', preview: '\\vec{AB}' },
    { label: 'Đường tròn', snippet: '$(O; R)$', preview: '(O; R)' },
    { label: 'Số Pi', snippet: '$\\pi$', preview: '\\pi' },
    { label: 'Đồng dạng', snippet: '$\\triangle ABC \\sim \\triangle A\'B\'C\'$', preview: '\\triangle ABC \\sim \\triangle A\'B\'C\'' },
  ];

  const symbolsSnippets = [
    { label: 'Thuộc', snippet: '$\\in$', preview: '\\in' },
    { label: 'Không thuộc', snippet: '$\\notin$', preview: '\\notin' },
    { label: 'Tập con', snippet: '$\\subset$', preview: '\\subset' },
    { label: 'Giao', snippet: '$\\cap$', preview: '\\cap' },
    { label: 'Hợp', snippet: '$\\cup$', preview: '\\cup' },
    { label: 'Tập R', snippet: '$\\mathbb{R}$', preview: '\\mathbb{R}' },
    { label: 'Tập N', snippet: '$\\mathbb{N}$', preview: '\\mathbb{N}' },
    { label: 'Tập Z', snippet: '$\\mathbb{Z}$', preview: '\\mathbb{Z}' },
    { label: 'Khác (≠)', snippet: '$\\neq$', preview: '\\neq' },
    { label: 'Xấp xỉ (≈)', snippet: '$\\approx$', preview: '\\approx' },
    { label: 'Vô cùng (∞)', snippet: '$\\infty$', preview: '\\infty' },
  ];

  const templatesSnippets = [
    {
      label: 'Bảng giá trị hàm số',
      snippet: `
| $x$ | -2 | -1 | 0 | 1 | 2 |
|---|---|---|---|---|---|
| $y = 2x + 1$ | -3 | -1 | 1 | 3 | 5 |
`,
      preview: 'Bảng x, y',
    },
    {
      label: 'Bảng xét dấu',
      snippet: `
| $x$ | $-\\infty$ | $x_1$ | $x_2$ | $+\\infty$ |
|---|---|---|---|---|
| $f(x)$ | + | 0 | - | 0 | + |
`,
      preview: 'Bảng dấu',
    },
    {
      label: 'Bảng tần số',
      snippet: `
| Giá trị ($x$) | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|
| Tần số ($n$) | 2 | 5 | 8 | 12 | 6 | 3 |
`,
      preview: 'Bảng tần số',
    },
  ];

  return (
    <div className={`border border-indigo-200 dark:border-indigo-800/60 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 dark:from-slate-900 dark:to-slate-950 p-3 shadow-sm ${className}`}>
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 dark:border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveCategory('algebra')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              activeCategory === 'algebra'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-100/60 dark:hover:bg-slate-800'
            }`}
          >
            <Superscript className="w-3.5 h-3.5" />
            <span>Đại số</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('geometry')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              activeCategory === 'geometry'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-purple-100/60 dark:hover:bg-slate-800'
            }`}
          >
            <Shapes className="w-3.5 h-3.5" />
            <span>Hình học</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('symbols')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              activeCategory === 'symbols'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-100/60 dark:hover:bg-slate-800'
            }`}
          >
            <Sigma className="w-3.5 h-3.5" />
            <span>Ký hiệu & Tập hợp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('templates')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              activeCategory === 'templates'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-amber-100/60 dark:hover:bg-slate-800'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Bảng biểu mẫu</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowLivePreview(!showLivePreview)}
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 border transition ${
            showLivePreview
              ? 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300'
              : 'text-slate-500 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-3 h-3" />
          <span>{showLivePreview ? 'Ẩn xem trước' : 'Xem trước'}</span>
        </button>
      </div>

      {/* Buttons for Active Category */}
      <div className="flex flex-wrap gap-1.5">
        {activeCategory === 'algebra' &&
          algebraSnippets.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onInsert(item.snippet)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition shadow-sm hover:border-indigo-300 hover:shadow flex items-center gap-1.5"
              title={`Chèn ${item.snippet}`}
            >
              <span>{item.label}:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-serif">
                <MathRenderer text={`$${item.preview}$`} />
              </span>
            </button>
          ))}

        {activeCategory === 'geometry' &&
          geometrySnippets.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onInsert(item.snippet)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition shadow-sm hover:border-purple-300 hover:shadow flex items-center gap-1.5"
              title={`Chèn ${item.snippet}`}
            >
              <span>{item.label}:</span>
              <span className="text-purple-600 dark:text-purple-400 font-serif">
                <MathRenderer text={`$${item.preview}$`} />
              </span>
            </button>
          ))}

        {activeCategory === 'symbols' &&
          symbolsSnippets.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onInsert(item.snippet)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition shadow-sm hover:border-emerald-300 hover:shadow flex items-center gap-1.5"
              title={`Chèn ${item.snippet}`}
            >
              <span>{item.label}:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-serif">
                <MathRenderer text={`$${item.preview}$`} />
              </span>
            </button>
          ))}

        {activeCategory === 'templates' &&
          templatesSnippets.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onInsert(item.snippet)}
              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 transition shadow-sm flex items-center gap-1.5"
              title={`Chèn bảng biểu mẫu`}
            >
              <TableIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>{item.label}</span>
            </button>
          ))}
      </div>

      {/* Live Preview Box */}
      {showLivePreview && previewText && (
        <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Hiển thị trực quan trực tiếp:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">KaTeX + Tables Live</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 rounded-xl text-sm min-h-[44px] flex items-center text-slate-900 dark:text-white shadow-inner">
            <MathRenderer text={previewText} />
          </div>
        </div>
      )}
    </div>
  );
};
