import React, { useState } from 'react';
import {
  MousePointer,
  Sparkles,
  PenTool,
  Highlighter,
  Eraser,
  Trash2,
  Clock,
  Moon,
  Sun,
  RotateCcw,
  Keyboard,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { TeachingTool } from './LiveTeachingCanvas';
import { teachingSoundFX } from './soundEffects';

interface TeachingToolbarProps {
  currentTool: TeachingTool;
  onSelectTool: (tool: TeachingTool) => void;
  penColor: string;
  onChangePenColor: (color: string) => void;
  penWidth: number;
  onChangePenWidth: (w: number) => void;
  highlighterColor: string;
  onChangeHighlighterColor: (color: string) => void;
  hasStrokesOnCurrentSlide: boolean;
  onClearSlideStrokes: () => void;
  onUndoStroke: () => void;
  isTimerOpen: boolean;
  onToggleTimer: () => void;
  focusScreenMode: 'none' | 'black' | 'white';
  onToggleFocusScreen: (mode: 'black' | 'white') => void;
}

const PEN_COLORS = [
  { name: 'Đỏ', hex: '#ef4444' },
  { name: 'Vàng', hex: '#eab308' },
  { name: 'Cyan Neon', hex: '#06b6d4' },
  { name: 'Xanh lá', hex: '#10b981' },
  { name: 'Tím', hex: '#a855f7' },
  { name: 'Trắng', hex: '#ffffff' },
];

const HIGHLIGHTER_COLORS = [
  { name: 'Vàng huỳnh quang', rgba: 'rgba(250, 204, 21, 0.45)' },
  { name: 'Xanh ngọc', rgba: 'rgba(52, 211, 153, 0.45)' },
  { name: 'Hồng dạ quang', rgba: 'rgba(244, 114, 182, 0.45)' },
];

const PEN_WIDTHS = [
  { label: 'Mảnh', width: 2.5 },
  { label: 'Vừa', width: 4.5 },
  { label: 'Đậm', width: 8 },
];

export const TeachingToolbar: React.FC<TeachingToolbarProps> = ({
  currentTool,
  onSelectTool,
  penColor,
  onChangePenColor,
  penWidth,
  onChangePenWidth,
  highlighterColor,
  onChangeHighlighterColor,
  hasStrokesOnCurrentSlide,
  onClearSlideStrokes,
  onUndoStroke,
  isTimerOpen,
  onToggleTimer,
  focusScreenMode,
  onToggleFocusScreen,
}) => {
  const [showPenPalette, setShowPenPalette] = useState(false);
  const [showHighlighterPalette, setShowHighlighterPalette] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToolClick = (tool: TeachingTool) => {
    teachingSoundFX.playClick();
    if (tool === 'pen' && currentTool === 'pen') {
      setShowPenPalette((prev) => !prev);
      setShowHighlighterPalette(false);
    } else if (tool === 'highlighter' && currentTool === 'highlighter') {
      setShowHighlighterPalette((prev) => !prev);
      setShowPenPalette(false);
    } else {
      setShowPenPalette(tool === 'pen');
      setShowHighlighterPalette(tool === 'highlighter');
      onSelectTool(tool);
    }
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Short Cut Info Popover */}
      {showShortcutsHelp && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-80 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-4 shadow-2xl text-xs text-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2 font-bold text-cyan-300">
            <span className="flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              Phím tắt trợ giảng nhanh
            </span>
            <button
              onClick={() => setShowShortcutsHelp(false)}
              className="text-slate-400 hover:text-white px-1"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">L</kbd> : Con trỏ Laser</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">P</kbd> : Bút mực (Pen)</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">H</kbd> : Bút dạ quang</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">E</kbd> : Cục tẩy (Eraser)</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">C</kbd> : Xóa nét slide này</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">T</kbd> : Bật/Tắt đồng hồ</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">B</kbd> : Màn hình đen</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono">W</kbd> : Màn hình trắng</div>
          </div>
        </div>
      )}

      {/* Pen Color & Width Palette Popover */}
      {showPenPalette && currentTool === 'pen' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl z-50 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          {/* Colors */}
          <div className="flex items-center gap-2">
            {PEN_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => onChangePenColor(c.hex)}
                title={c.name}
                className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                  penColor === c.hex ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          {/* Widths */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            {PEN_WIDTHS.map((w) => (
              <button
                key={w.width}
                onClick={() => onChangePenWidth(w.width)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                  penWidth === w.width
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Highlighter Palette Popover */}
      {showHighlighterPalette && currentTool === 'highlighter' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          {HIGHLIGHTER_COLORS.map((c) => (
            <button
              key={c.rgba}
              onClick={() => onChangeHighlighterColor(c.rgba)}
              title={c.name}
              className={`w-7 h-7 rounded-xl border-2 transition-transform cursor-pointer ${
                highlighterColor === c.rgba ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: c.rgba }}
            />
          ))}
        </div>
      )}

      {/* Main Toolbar Container */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl text-white">
        {/* Toggle Expansion */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          title={isExpanded ? 'Thu gọn công cụ trợ giảng' : 'Mở rộng công cụ trợ giảng'}
          className="p-1.5 rounded-xl hover:bg-white/15 text-cyan-400 transition cursor-pointer"
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {isExpanded ? (
          <>
            {/* 1. Normal Pointer */}
            <button
              onClick={() => handleToolClick('pointer')}
              title="Chuột tương tác thông thường"
              className={`p-2 rounded-xl transition cursor-pointer ${
                currentTool === 'pointer'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'hover:bg-white/15 text-slate-300'
              }`}
            >
              <MousePointer className="w-4 h-4" />
            </button>

            {/* 2. Laser Pointer */}
            <button
              onClick={() => handleToolClick('laser')}
              title="Con trỏ Laser phát quang (Phím L)"
              className={`p-2 rounded-xl transition cursor-pointer relative ${
                currentTool === 'laser'
                  ? 'bg-rose-500 text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                  : 'hover:bg-white/15 text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-rose-400" />
            </button>

            {/* 3. Drawing Pen */}
            <button
              onClick={() => handleToolClick('pen')}
              title="Bút vẽ ghi chú (Phím P) - Nhấn lần 2 để đổi màu"
              className={`p-2 rounded-xl transition cursor-pointer relative ${
                currentTool === 'pen'
                  ? 'bg-indigo-600 text-white font-black shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                  : 'hover:bg-white/15 text-slate-300'
              }`}
            >
              <PenTool className="w-4 h-4" />
              {currentTool === 'pen' && (
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full border border-white"
                  style={{ backgroundColor: penColor }}
                />
              )}
            </button>

            {/* 4. Highlighter */}
            <button
              onClick={() => handleToolClick('highlighter')}
              title="Bút dạ quang đánh dấu (Phím H) - Nhấn lần 2 để đổi màu"
              className={`p-2 rounded-xl transition cursor-pointer relative ${
                currentTool === 'highlighter'
                  ? 'bg-yellow-500 text-slate-950 font-black shadow-[0_0_12px_rgba(234,179,8,0.5)]'
                  : 'hover:bg-white/15 text-slate-300'
              }`}
            >
              <Highlighter className="w-4 h-4" />
            </button>

            {/* 5. Eraser */}
            <button
              onClick={() => handleToolClick('eraser')}
              title="Cục tẩy nét vẽ (Phím E)"
              className={`p-2 rounded-xl transition cursor-pointer ${
                currentTool === 'eraser'
                  ? 'bg-purple-600 text-white font-black shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                  : 'hover:bg-white/15 text-slate-300'
              }`}
            >
              <Eraser className="w-4 h-4" />
            </button>

            {/* Undo & Clear Stroke Buttons */}
            {hasStrokesOnCurrentSlide && (
              <>
                <button
                  onClick={onUndoStroke}
                  title="Hoàn tác nét vẽ vừa vẽ"
                  className="p-2 rounded-xl hover:bg-white/15 text-slate-300 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onClearSlideStrokes}
                  title="Xóa toàn bộ nét vẽ của slide này (Phím C)"
                  className="p-2 rounded-xl hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <div className="w-[1px] h-5 bg-white/20 mx-0.5" />

            {/* 6. Activity Countdown Timer */}
            <button
              onClick={onToggleTimer}
              title="Đồng hồ đếm ngược hoạt động nhóm (Phím T)"
              className={`p-2 rounded-xl transition cursor-pointer ${
                isTimerOpen
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'hover:bg-white/15 text-slate-300'
              }`}
            >
              <Clock className="w-4 h-4" />
            </button>

            {/* 7. Focus Black Screen */}
            <button
              onClick={() => onToggleFocusScreen('black')}
              title="Màn hình đen tạm dừng (Phím B)"
              className={`p-2 rounded-xl transition cursor-pointer ${
                focusScreenMode === 'black'
                  ? 'bg-white text-black font-black'
                  : 'hover:bg-white/15 text-slate-300'
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>

            {/* 8. Focus White Screen */}
            <button
              onClick={() => onToggleFocusScreen('white')}
              title="Màn hình trắng tạm dừng (Phím W)"
              className={`p-2 rounded-xl transition cursor-pointer ${
                focusScreenMode === 'white'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'hover:bg-white/15 text-slate-300'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-white/20 mx-0.5" />

            {/* 9. Shortcuts Guide */}
            <button
              onClick={() => setShowShortcutsHelp((prev) => !prev)}
              title="Xem phím tắt trợ giảng"
              className="p-2 rounded-xl hover:bg-white/15 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </>
        ) : (
          <span className="text-[11px] font-bold text-cyan-300 pr-1 cursor-pointer" onClick={() => setIsExpanded(true)}>
            Công cụ trợ giảng
          </span>
        )}
      </div>
    </div>
  );
};
