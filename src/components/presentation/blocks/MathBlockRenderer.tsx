import React, { useState } from 'react';
import { MathBlock } from '../../../types/contentBlock';
import { MathRenderer } from '../../../games/components/MathRenderer';
import { Sigma, Edit2, Check } from 'lucide-react';

interface MathBlockRendererProps {
  block: MathBlock;
  isEditor?: boolean;
  isDarkTheme?: boolean;
  onUpdate?: (updatedContent: MathBlock['content']) => void;
}

export const MathBlockRenderer: React.FC<MathBlockRendererProps> = ({
  block,
  isEditor = false,
  isDarkTheme = !isEditor,
  onUpdate,
}) => {
  const { content } = block;
  const [isEditingLatex, setIsEditingLatex] = useState(false);
  const [tempLatex, setTempLatex] = useState(content.latex);

  const handleSaveLatex = () => {
    onUpdate?.({ ...content, latex: tempLatex });
    setIsEditingLatex(false);
  };

  const formattedLatex = content.latex?.trim().startsWith('$') || content.latex?.trim().startsWith('\\(')
    ? content.latex
    : `$$${content.latex}$$`;

  if (isEditor) {
    return (
      <div className="w-full h-full p-3 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-100/80 shadow-sm relative group flex flex-col justify-between">
        <div className="flex items-center justify-between pb-1 border-b border-indigo-100/60 text-xs font-bold text-indigo-700">
          <span className="flex items-center gap-1">
            <Sigma className="w-3.5 h-3.5 text-indigo-600" />
            <span>Công thức Toán học (LaTeX)</span>
          </span>
          <button
            type="button"
            onClick={() => {
              if (isEditingLatex) handleSaveLatex();
              else {
                setTempLatex(content.latex);
                setIsEditingLatex(true);
              }
            }}
            className="px-2 py-0.5 rounded-md bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
          >
            {isEditingLatex ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Xong</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3 h-3 text-indigo-500" />
                <span>Sửa mã LaTeX</span>
              </>
            )}
          </button>
        </div>

        {isEditingLatex ? (
          <div className="my-2 space-y-1.5 flex-1">
            <textarea
              value={tempLatex}
              onChange={(e) => setTempLatex(e.target.value)}
              placeholder="Nhập mã LaTeX (ví dụ: a^2 + b^2 = c^2, \\frac{a}{b})..."
              className="w-full h-20 p-2 text-xs font-mono bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {/* Quick Math formula chips */}
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Phân số', code: '\\frac{a}{b}' },
                { label: 'Căn bậc hai', code: '\\sqrt{x}' },
                { label: 'Lũy thừa', code: 'x^{2}' },
                { label: 'Hằng đẳng thức', code: '(a+b)^2 = a^2 + 2ab + b^2' },
                { label: 'Tam giác', code: '\\Delta ABC' },
                { label: 'Góc', code: '\\angle AOB = 90^\\circ' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTempLatex((prev) => `${prev} ${item.code}`)}
                  className="px-1.5 py-0.5 bg-white hover:bg-indigo-100 text-[10px] font-mono text-slate-700 rounded border border-slate-200"
                >
                  +{item.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-2 overflow-x-auto text-slate-900">
            <MathRenderer text={formattedLatex} block={true} isLarge={content.isLarge !== false} />
          </div>
        )}

        {content.explanation && (
          <div className="text-[11px] text-slate-500 italic text-center pt-1 border-t border-indigo-100/40">
            {content.explanation}
          </div>
        )}
      </div>
    );
  }

  // Presentation Mode
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4">
      <div
        className={`backdrop-blur-sm border-2 rounded-2xl px-6 py-4 shadow-xl max-w-full overflow-x-auto flex items-center justify-center transition-all ${
          isDarkTheme
            ? 'bg-slate-800/95 border-indigo-500/40 text-cyan-200 shadow-indigo-950/40 ring-1 ring-cyan-500/20'
            : 'bg-white/95 border-indigo-200/80 text-slate-900 shadow-md'
        }`}
      >
        <MathRenderer text={formattedLatex} block={true} isLarge={true} />
      </div>
      {content.explanation && (
        <div
          className={`mt-2.5 text-sm sm:text-base ${
            isDarkTheme ? 'text-slate-200' : 'text-slate-600'
          } font-medium italic text-center`}
        >
          {content.explanation}
        </div>
      )}
    </div>
  );
};
