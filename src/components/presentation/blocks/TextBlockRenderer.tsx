import React from 'react';
import { TextBlock } from '../../../types/contentBlock';
import { MathRenderer } from '../../../games/components/MathRenderer';
import { getAccessibleTextColor } from '../../../utils/colorContrast';

interface TextBlockRendererProps {
  block: TextBlock;
  isEditor?: boolean;
  isDarkTheme?: boolean;
  onUpdate?: (updatedContent: TextBlock['content']) => void;
}

export const TextBlockRenderer: React.FC<TextBlockRendererProps> = ({
  block,
  isEditor = false,
  isDarkTheme = !isEditor,
  onUpdate,
}) => {
  const { content } = block;

  const accessibleColor = getAccessibleTextColor(content.color, isDarkTheme);

  const style: React.CSSProperties = {
    fontSize: `${content.fontSize || (isDarkTheme ? 20 : 18)}px`,
    fontWeight: content.fontWeight || (isDarkTheme ? '500' : 'normal'),
    fontStyle: content.fontStyle || 'normal',
    textDecoration: content.textDecoration || 'none',
    color: accessibleColor,
    textAlign: content.textAlign || 'left',
    lineHeight: content.lineHeight || 1.65,
    backgroundColor: content.backgroundColor || 'transparent',
  };

  if (isEditor) {
    return (
      <div className="w-full h-full relative group">
        <textarea
          value={content.text}
          onChange={(e) => onUpdate?.({ ...content, text: e.target.value })}
          placeholder="Nhập nội dung văn bản..."
          style={style}
          className="w-full h-full min-h-[60px] p-2 bg-transparent resize-none border border-dashed border-transparent hover:border-slate-300 focus:border-indigo-400 focus:bg-white/60 rounded-lg outline-none transition"
        />
      </div>
    );
  }

  if (!isEditor && block.animation?.revealByParagraph) {
    const paragraphs = (content.text || '')
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length > 1) {
      return (
        <div style={style} className="w-full h-full space-y-3 select-text leading-relaxed antialiased font-normal">
          {paragraphs.map((para, pIdx) => (
            <div
              key={pIdx}
              style={{
                animationDelay: `${pIdx * 0.25}s`,
              }}
              className="anim-entrance-fade"
            >
              <MathRenderer text={para} />
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div style={style} className="w-full h-full whitespace-pre-wrap select-text leading-relaxed antialiased font-normal">
      <MathRenderer text={content.text} />
    </div>
  );
};
