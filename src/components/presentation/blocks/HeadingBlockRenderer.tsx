import React from 'react';
import { HeadingBlock } from '../../../types/contentBlock';
import { MathRenderer } from '../../../games/components/MathRenderer';
import { getAccessibleTextColor } from '../../../utils/colorContrast';

interface HeadingBlockRendererProps {
  block: HeadingBlock;
  isEditor?: boolean;
  isDarkTheme?: boolean;
  onUpdate?: (updatedContent: HeadingBlock['content']) => void;
}

export const HeadingBlockRenderer: React.FC<HeadingBlockRendererProps> = ({
  block,
  isEditor = false,
  isDarkTheme = !isEditor,
  onUpdate,
}) => {
  const { content } = block;

  const accessibleColor = getAccessibleTextColor(
    content.color || (isDarkTheme ? '#38BDF8' : '#0F172A'),
    isDarkTheme
  );

  const levelStyles = {
    h1: 'text-2xl sm:text-3xl font-black tracking-tight',
    h2: 'text-xl sm:text-2xl font-bold tracking-tight',
    h3: 'text-lg sm:text-xl font-bold',
  };

  const alignStyles = {
    left: 'text-left justify-start',
    center: 'text-center justify-center',
    right: 'text-right justify-end',
  };

  if (isEditor) {
    return (
      <div className="w-full h-full flex flex-col justify-center">
        {content.badge && (
          <div className="mb-1">
            <span
              style={{ backgroundColor: `${content.color || '#2563EB'}15`, color: content.color || '#2563EB' }}
              className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider"
            >
              {content.badge}
            </span>
          </div>
        )}
        <input
          type="text"
          value={content.text}
          onChange={(e) => onUpdate?.({ ...content, text: e.target.value })}
          placeholder="Nhập tiêu đề..."
          style={{ color: accessibleColor }}
          className={`w-full bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-400 focus:bg-white/60 outline-none transition px-1 py-0.5 ${levelStyles[content.level || 'h1']}`}
        />
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col justify-center ${alignStyles[content.textAlign || 'left']}`}>
      {content.badge && (
        <div className="mb-1.5">
          <span
            style={{
              backgroundColor: isDarkTheme ? 'rgba(56, 189, 248, 0.15)' : `${content.color || '#2563EB'}25`,
              color: isDarkTheme ? '#38BDF8' : (content.color || '#2563EB'),
              borderColor: isDarkTheme ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
            }}
            className="inline-block px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border"
          >
            {content.badge}
          </span>
        </div>
      )}
      <div
        style={{ color: accessibleColor }}
        className={`${levelStyles[content.level || 'h1']} antialiased drop-shadow-xs`}
      >
        <MathRenderer text={content.text} />
      </div>
    </div>
  );
};
