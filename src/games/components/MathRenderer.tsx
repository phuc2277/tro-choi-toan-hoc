import React, { useMemo } from 'react';
import katex from 'katex';
import { MathDiagramView } from './MathDiagramView';
import { MathDiagram, MathTableData } from '../types/GestureQuiz';

interface MathRendererProps {
  text?: string;
  content?: string | { key?: string; text?: string } | any;
  className?: string;
  isLarge?: boolean;
  block?: boolean;
}

/**
 * Enhanced MathRenderer that seamlessly handles:
 * 1. KaTeX LaTeX formulas ($...$, $$...$$, \(...\), \[...\], \frac, \sqrt, \Delta, \angle, \perp, \parallel, \cases)
 * 2. Markdown tables (| Header 1 | Header 2 |) with Math inside
 * 3. Markdown / BBCode images (![alt](url) or [img: url])
 * 4. Rich Unicode/ASCII math expressions (powers, square roots, fractions, parallel/perpendicular lines)
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  text,
  content,
  className = '',
  isLarge = false,
  block = false,
}) => {
  const rawText = useMemo(() => {
    if (typeof content === 'string') return content;
    if (content && typeof content === 'object') {
      if ('text' in content && typeof content.text === 'string') return content.text;
      return String(content);
    }
    return text || '';
  }, [text, content]);

  if (!rawText) return null;

  // Render a LaTeX string safely with KaTeX
  const renderKatexSafe = (latex: string, isBlockMode: boolean, key: string | number) => {
    try {
      const cleanLatex = latex
        .replace(/\\angle/g, '\\widehat')
        .replace(/\\parallel/g, '\\parallel')
        .trim();

      const html = katex.renderToString(cleanLatex, {
        displayMode: isBlockMode,
        throwOnError: false,
        output: 'htmlAndMathml',
      });

      return (
        <span
          key={key}
          className={`inline-math-node font-semibold text-cyan-200 ${isBlockMode ? 'block my-2.5 text-center text-cyan-300' : 'inline-block px-0.5'}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      return (
        <span key={key} className="font-mono text-amber-300 font-bold">
          {latex}
        </span>
      );
    }
  };

  // Helper to parse text containing KaTeX, Markdown Tables, Images, and Text Math
  const parsedContent = useMemo(() => {
    if (!rawText || typeof rawText !== 'string') return null;

    // Check if whole text is a table
    const lines = rawText.trim().split('\n');
    const isMarkdownTable =
      lines.length >= 2 &&
      lines[0].trim().startsWith('|') &&
      lines[0].trim().endsWith('|') &&
      lines[1].includes('---');

    if (isMarkdownTable) {
      try {
        const headerRow = lines[0]
          .split('|')
          .slice(1, -1)
          .map((h) => h.trim());
        const dataRows = lines
          .slice(2)
          .filter((l) => l.trim().startsWith('|'))
          .map((l) =>
            l
              .split('|')
              .slice(1, -1)
              .map((c) => c.trim())
          );

        return (
          <div className="my-3 overflow-x-auto rounded-xl border border-indigo-200 bg-white/90 p-2 shadow-md">
            <table className="w-full text-center border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-indigo-200">
                  {headerRow.map((head, hIdx) => (
                    <th key={hIdx} className="py-2 px-3 font-bold text-indigo-900 border-r border-indigo-100 last:border-r-0">
                      <MathRenderer text={head} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-indigo-100 last:border-b-0 hover:bg-indigo-50/50 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 text-slate-800 font-medium border-r border-indigo-100 last:border-r-0">
                        <MathRenderer text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } catch {
        // Fallback to text parsing
      }
    }

    // Split text into tokens: KaTeX block ($$...$$), KaTeX inline ($...$), markdown images, and normal text
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|!\[([^\]]*)\]\(([^)]+)\)|\\\[[\s\S]+?\\\]|\\\([^\n]+?\\\))/g;
    const parts = rawText.split(regex);

    const elements: React.ReactNode[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      // 1. KaTeX Display / Block Math: $$ ... $$ or \[ ... \]
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2).trim();
        elements.push(renderKatexSafe(formula, true, `katex-block-${i}`));
        continue;
      }
      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        const formula = part.slice(2, -2).trim();
        elements.push(renderKatexSafe(formula, true, `katex-block-alt-${i}`));
        continue;
      }

      // 2. KaTeX Inline Math: $ ... $ or \( ... \)
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const formula = part.slice(1, -1).trim();
        elements.push(renderKatexSafe(formula, false, `katex-inline-${i}`));
        continue;
      }
      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        const formula = part.slice(2, -2).trim();
        elements.push(renderKatexSafe(formula, false, `katex-inline-alt-${i}`));
        continue;
      }

      // 3. Markdown Image: ![alt](url)
      const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        const altText = imgMatch[1];
        const imgUrl = imgMatch[2];
        elements.push(
          <div key={`img-${i}`} className="my-3 flex flex-col items-center justify-center">
            <img
              src={imgUrl}
              alt={altText || 'Hình vẽ toán học'}
              className="max-h-64 rounded-xl border border-slate-200 shadow-md object-contain bg-white p-1"
              referrerPolicy="no-referrer"
            />
            {altText && <span className="text-xs text-slate-500 mt-1 italic">{altText}</span>}
          </div>
        );
        continue;
      }

      // 4. Standard text with Unicode & ASCII math enhancements
      elements.push(
        <span key={`text-${i}`}>
          {formatUnicodeMath(part)}
        </span>
      );
    }

    return elements;
  }, [rawText]);

  return <span className={`math-content ${className}`}>{parsedContent}</span>;
};

/**
 * Format standard Vietnamese text with simple math notations (powers, square roots, degrees, parallel/perpendicular)
 */
function formatUnicodeMath(input: string): React.ReactNode {
  if (!input) return '';

  // Quick check: If there's pure LaTeX command like \frac, \sqrt, \Delta inside the text without $ signs, render via KaTeX
  if (
    input.includes('\\frac') ||
    input.includes('\\sqrt') ||
    input.includes('\\Delta') ||
    input.includes('\\widehat') ||
    input.includes('\\perp') ||
    input.includes('\\parallel') ||
    input.includes('\\pm') ||
    input.includes('\\times') ||
    input.includes('\\approx') ||
    input.includes('\\ge') ||
    input.includes('\\le') ||
    input.includes('\\neq') ||
    input.includes('\\sum')
  ) {
    try {
      const html = katex.renderToString(input, {
        throwOnError: false,
        output: 'htmlAndMathml',
      });
      return <span className="inline-math-node font-semibold px-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      // Fallback
    }
  }

  // Tokenize for common math patterns:
  // - Powers: x^2, (a+b)^2, 10^3
  // - Square root: √16, √2
  // - Parallel: a // b
  // - Perpendicular: ⊥
  // - Fractions: 3/4
  const parts = input.split(
    /(\([^)]+\)\^\d+|\b\w+\^\d+|\b\d+\^\d+|√\w+|√\([^\)]+\)|\b\d+\/\d+\b|\|[^|]+\||[⊥∥]|\b[a-zA-Z]\s*\/\/\s*[a-zA-Z]\b)/g
  );

  return parts.map((part, index) => {
    if (!part) return null;

    // Power with parentheses: (1/2)^3
    const parenPowerMatch = part.match(/^\(([^)]+)\)\^(\d+)$/);
    if (parenPowerMatch) {
      return (
        <span key={index} className="inline-flex items-baseline font-mono font-bold text-amber-300">
          <span>(</span>
          <span>{parenPowerMatch[1]}</span>
          <span>)</span>
          <sup className="text-[0.7em] font-extrabold text-indigo-300 ml-0.5">
            {parenPowerMatch[2]}
          </sup>
        </span>
      );
    }

    // Simple Power: x^2, 2^3
    const powerMatch = part.match(/^([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)$/);
    if (powerMatch) {
      return (
        <span key={index} className="inline-flex items-baseline font-mono font-bold text-cyan-200">
          <span>{powerMatch[1]}</span>
          <sup className="text-[0.7em] font-extrabold text-indigo-300 ml-0.5">
            {powerMatch[2]}
          </sup>
        </span>
      );
    }

    // Square root: √16, √x, √(x+1)
    if (part.startsWith('√')) {
      const rad = part.slice(1);
      return (
        <span key={index} className="inline-flex items-baseline font-mono font-bold text-cyan-300">
          <span className="text-lg leading-none">√</span>
          <span className="border-t-2 border-cyan-400 pt-0.5 px-0.5">{rad}</span>
        </span>
      );
    }

    // Absolute value: |-3.5|
    const absMatch = part.match(/^\|([^|]+)\|$/);
    if (absMatch) {
      return (
        <span key={index} className="inline-flex items-baseline font-mono font-bold text-emerald-300">
          <span className="font-bold opacity-70">|</span>
          <span className="px-0.5">{absMatch[1]}</span>
          <span className="font-bold opacity-70">|</span>
        </span>
      );
    }

    // Parallel lines: a // b
    if (part.includes('//')) {
      const [left, right] = part.split('//').map((s) => s.trim());
      return (
        <span key={index} className="inline-flex items-center gap-1 font-mono font-bold text-cyan-300">
          <span>{left}</span>
          <span className="text-amber-400 font-extrabold text-base">∥</span>
          <span>{right}</span>
        </span>
      );
    }

    // Perpendicular: ⊥
    if (part === '⊥') {
      return (
        <span key={index} className="text-rose-400 font-extrabold text-base px-1 inline-block">
          ⊥
        </span>
      );
    }

    // Fraction: 3/4
    const fracMatch = part.match(/^(-?\d+)\/(\d+)$/);
    if (fracMatch) {
      const num = fracMatch[1];
      const den = fracMatch[2];
      return (
        <span
          key={index}
          className="inline-flex flex-col items-center justify-center align-middle mx-1 font-mono font-bold text-indigo-300 leading-none"
          style={{ verticalAlign: '-0.25em' }}
        >
          <span className="border-b border-indigo-400/80 px-1 pb-0.5 text-[0.85em]">{num}</span>
          <span className="px-1 pt-0.5 text-[0.85em]">{den}</span>
        </span>
      );
    }

    // Standard string with minor cleanups
    return (
      <span key={index}>
        {part.replace(/\s*·\s*/g, ' · ').replace(/\s*\*\s*/g, ' · ')}
      </span>
    );
  });
}
