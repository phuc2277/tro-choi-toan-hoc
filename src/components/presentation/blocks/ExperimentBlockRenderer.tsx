import React, { useState } from 'react';
import { ExperimentBlock } from '../../../types/contentBlock';
import { FlaskConical, Play, Sparkles } from 'lucide-react';

interface ExperimentBlockRendererProps {
  block: ExperimentBlock;
  isEditor?: boolean;
  onUpdate?: (updatedContent: ExperimentBlock['content']) => void;
}

export const ExperimentBlockRenderer: React.FC<ExperimentBlockRendererProps> = ({
  block,
  isEditor = false,
  onUpdate,
}) => {
  const { content } = block;
  const [sliderVal, setSliderVal] = useState(3);

  return (
    <div className="w-full h-full p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl flex flex-col justify-between relative overflow-hidden border border-indigo-700/60">
      {/* Glow background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-indigo-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
            <FlaskConical className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-black tracking-wide text-cyan-300">
            {content.title || 'Phòng thí nghiệm Toán học ảo'}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          Tương tác trực tiếp
        </span>
      </div>

      {/* Interactive simulation area */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 my-2 bg-slate-800/60 rounded-xl border border-indigo-800/40">
        <div className="text-xs text-slate-300 mb-2 font-medium">
          Mô phỏng hàm số bậc hai: <span className="font-mono text-amber-400 font-bold">y = {sliderVal}x²</span>
        </div>

        {/* Dynamic parabolic curve SVG */}
        <svg viewBox="0 0 200 120" className="w-48 h-28">
          <line x1="10" y1="100" x2="190" y2="100" stroke="#64748B" strokeWidth="1.5" />
          <line x1="100" y1="10" x2="100" y2="115" stroke="#64748B" strokeWidth="1.5" />
          {/* Parabola y = a * x^2 */}
          <path
            d={`M 20 ${100 - (sliderVal * 1.5 * 4)} Q 100 100 180 ${100 - (sliderVal * 1.5 * 4)}`}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="3"
          />
        </svg>

        <div className="w-full max-w-xs mt-2 flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-mono">Hệ số a:</span>
          <input
            type="range"
            min="1"
            max="6"
            value={sliderVal}
            onChange={(e) => setSliderVal(Number(e.target.value))}
            className="flex-1 accent-cyan-400 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-cyan-300 w-4">{sliderVal}</span>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span>Kéo thanh trượt để quan sát độ mở và bề lõm của đồ thị parabol</span>
      </div>
    </div>
  );
};
