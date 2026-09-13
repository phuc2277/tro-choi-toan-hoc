import React, { useState, useMemo } from 'react';
import { ChevronRight, Eye, RotateCcw, CheckCircle, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { MathRenderer } from '../../../games/components/MathRenderer';

export interface SolutionStep {
  id: string;
  stepNumber: number;
  title?: string;
  explanation: string;
  mathExpression?: string;
}

interface StepByStepSolutionViewerProps {
  problem: string;
  solution: string;
  rawSteps?: SolutionStep[];
  title?: string;
  className?: string;
  defaultShowAll?: boolean;
}

/**
 * Parses raw text solution into structured steps if explicit steps are not provided.
 * Recognizes lines with "Bước X", "\Rightarrow", "Ta có", "Thay", "Suy ra", bullet points or double newlines.
 */
function parseSolutionIntoSteps(solutionText: string): SolutionStep[] {
  if (!solutionText || typeof solutionText !== 'string') return [];

  // Check if text already has "Bước 1", "Bước 2" or "Step 1"
  const stepRegex = /(?:Bước|Bước|\+)\s*(\d+)[:.]\s*([\s\S]*?)(?=(?:(?:Bước|Bước|\+)\s*\d+[:.]|$))/gi;
  const matches = [...solutionText.matchAll(stepRegex)];

  if (matches.length >= 2) {
    return matches.map((m, idx) => ({
      id: `step-${idx + 1}`,
      stepNumber: idx + 1,
      title: `Bước ${idx + 1}`,
      explanation: m[2].trim(),
    }));
  }

  // Otherwise split by sentence delimiters or mathematical implication indicators (\Rightarrow, Suy ra, Thay)
  const lines = solutionText
    .split(/(?:\r?\n)+|(?<=\.\s+)(?=[A-ZĐTaThaySuy])/g)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length >= 2) {
    return lines.map((line, idx) => {
      let stepTitle = `Bước ${idx + 1}`;
      if (line.toLowerCase().startsWith('thay ')) stepTitle = `Thay giá trị`;
      else if (line.toLowerCase().startsWith('ta có') || line.toLowerCase().startsWith('xét ')) stepTitle = `Xét hệ thức`;
      else if (line.toLowerCase().startsWith('suy ra') || line.includes('\\Rightarrow')) stepTitle = `Biến đổi`;
      else if (line.toLowerCase().startsWith('vậy') || line.toLowerCase().startsWith('kết luận')) stepTitle = `Kết luận`;

      return {
        id: `step-${idx + 1}`,
        stepNumber: idx + 1,
        title: stepTitle,
        explanation: line,
      };
    });
  }

  // Fallback single step
  return [
    {
      id: 'step-1',
      stepNumber: 1,
      title: 'Lời giải chi tiết',
      explanation: solutionText,
    },
  ];
}

export const StepByStepSolutionViewer: React.FC<StepByStepSolutionViewerProps> = ({
  problem,
  solution,
  rawSteps,
  title = 'Bài toán & Hướng dẫn biến đổi từng bước',
  className = '',
  defaultShowAll = false,
}) => {
  const steps: SolutionStep[] = useMemo(() => {
    if (rawSteps && rawSteps.length > 0) return rawSteps;
    return parseSolutionIntoSteps(solution);
  }, [rawSteps, solution]);

  const totalSteps = steps.length;
  // revealedStepCount: 0 = only problem shown, 1..totalSteps = revealed up to that step
  const [revealedCount, setRevealedCount] = useState<number>(defaultShowAll ? totalSteps : 0);

  const isAllRevealed = revealedCount >= totalSteps;
  const isNoneRevealed = revealedCount === 0;

  const handleRevealNext = () => {
    setRevealedCount((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleRevealAll = () => {
    setRevealedCount(totalSteps);
  };

  const handleReset = () => {
    setRevealedCount(0);
  };

  return (
    <div className={`rounded-2xl border border-cyan-500/30 bg-slate-900/90 backdrop-blur-md overflow-hidden shadow-xl ${className}`}>
      {/* Header with Title & Step Counter */}
      <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-xs shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white tracking-wide flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Từng bước biến đổi
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Học sinh theo dõi mạch lập luận - Bấm để mở dần từng bước giải
            </p>
          </div>
        </div>

        {/* Step progress pills */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Tiến độ:</span>
          <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i < revealedCount
                    ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] scale-110'
                    : 'bg-slate-700'
                }`}
                title={`Bước ${i + 1}`}
              />
            ))}
            <span className="text-xs font-mono font-bold text-cyan-300 ml-1.5">
              {revealedCount}/{totalSteps}
            </span>
          </div>
        </div>
      </div>

      {/* Problem Statement Box */}
      <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-start gap-2.5">
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase shrink-0 mt-0.5">
            Đề bài
          </span>
          <div className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed">
            <MathRenderer text={problem} />
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="p-4 sm:p-5 space-y-3 bg-slate-900/50">
        {isNoneRevealed && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
            <HelpCircle className="w-8 h-8 text-cyan-400 animate-bounce" />
            <p className="text-xs font-bold text-slate-300">
              Lời giải đang được ẩn để học sinh tự suy nghĩ và định hướng
            </p>
            <p className="text-[11px] text-slate-500 max-w-md">
              Bấm nút <strong className="text-cyan-300 font-bold">"▶ Mở Bước 1"</strong> bên dưới để bắt đầu hiển thị từng bước lập luận toán học.
            </p>
          </div>
        )}

        {steps.map((step, idx) => {
          const isRevealed = idx < revealedCount;
          if (!isRevealed) return null;

          const isLatest = idx === revealedCount - 1;

          return (
            <div
              key={step.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
                isLatest
                  ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-[11px]">
                    {step.stepNumber}
                  </span>
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                    {step.title || `Bước ${step.stepNumber}`}
                  </span>
                </div>
                {isLatest && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                    Đang hướng dẫn
                  </span>
                )}
              </div>

              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-7">
                <MathRenderer text={step.explanation} />
              </div>

              {step.mathExpression && (
                <div className="mt-2 pl-7">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-500/30 text-cyan-300 font-mono text-xs sm:text-sm text-center">
                    <MathRenderer text={step.mathExpression} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Controls Toolbar */}
      <div className="p-3.5 sm:p-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {!isAllRevealed ? (
            <button
              id="btn-reveal-next-step"
              onClick={handleRevealNext}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] transition cursor-pointer active:scale-95"
            >
              <span>▶ Mở {isNoneRevealed ? 'Bước 1' : `Bước ${revealedCount + 1}`}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Đã mở đầy đủ toàn bộ lời giải</span>
            </div>
          )}

          {!isAllRevealed && (
            <button
              onClick={handleRevealAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Hiện tất cả ({totalSteps} bước)</span>
            </button>
          )}
        </div>

        {revealedCount > 0 && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-800 text-xs font-semibold transition cursor-pointer ml-auto"
            title="Ẩn lời giải để giảng lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ẩn lại từ đầu</span>
          </button>
        )}
      </div>
    </div>
  );
};
