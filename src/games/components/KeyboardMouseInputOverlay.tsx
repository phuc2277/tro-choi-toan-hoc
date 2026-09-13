import React from 'react';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import { MousePointer, Keyboard, CheckCircle2, Sparkles } from 'lucide-react';

interface PlayerInfo {
  id: string;
  name: string;
  playerIndex: number;
  teamId?: string;
  selectedOption?: QuizOptionKeyEnum | null;
}

interface KeyboardMouseInputOverlayProps {
  players: PlayerInfo[];
  currentAnswers: Record<string, { selectedOption: QuizOptionKeyEnum | null }>;
  onSelectOption: (playerId: string, option: QuizOptionKeyEnum) => void;
  isSinglePlayer: boolean;
}

export const KeyboardMouseInputOverlay: React.FC<KeyboardMouseInputOverlayProps> = ({
  players,
  currentAnswers,
  onSelectOption,
  isSinglePlayer,
}) => {
  const options = [
    { key: QuizOptionKeyEnum.A, numKey: '1', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
    { key: QuizOptionKeyEnum.B, numKey: '2', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
    { key: QuizOptionKeyEnum.C, numKey: '3', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
    { key: QuizOptionKeyEnum.D, numKey: '4', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
  ];

  // Key mappings helper for multiplayer
  const playerKeyMaps: Record<number, { title: string; keys: string[] }> = {
    0: { title: 'Phím số 1, 2, 3, 4 hoặc A, B, C, D', keys: ['1 / A', '2 / B', '3 / C', '4 / D'] },
    1: { title: 'Phím số 5, 6, 7, 8 hoặc F, G, H, J', keys: ['5 / F', '6 / G', '7 / H', '8 / J'] },
    2: { title: 'Phím Q, W, E, R', keys: ['Q', 'W', 'E', 'R'] },
    3: { title: 'Phím U, I, O, P', keys: ['U', 'I', 'O', 'P'] },
  };

  if (isSinglePlayer && players[0]) {
    const p = players[0];
    const ans = currentAnswers[p.id]?.selectedOption;
    const isLocked = !!ans;

    return (
      <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-5 space-y-4 shadow-inner">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>ĐIỀU KHIỂN CHUỘT & BÀN PHÍM</span>
                <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/30">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Click chuột hoặc bấm phím số / chữ cái để chọn
              </p>
            </div>
          </div>
          {isLocked && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã chọn [{ans}]</span>
            </div>
          )}
        </div>

        {/* 4 Interactive Big Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => {
            const isSelected = ans === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onSelectOption(p.id, opt.key)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center group cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20'
                    : 'border-[#30363D] bg-[#161B22] hover:border-blue-500/70 hover:bg-[#21262D] text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-9 h-9 rounded-lg font-mono font-black text-lg flex items-center justify-center border transition ${
                      isSelected
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : `${opt.color}`
                    }`}
                  >
                    {opt.key}
                  </span>
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-300">Đáp án {opt.key}</div>
                    <div className="text-[10px] font-mono text-gray-400">
                      Phím: <span className="text-blue-400 font-bold">[{opt.numKey}]</span> hoặc{' '}
                      <span className="text-blue-400 font-bold">[{opt.key}]</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Keyboard Quick Hint */}
        <div className="rounded-xl bg-[#161B22] p-3 border border-[#30363D] flex items-center justify-between text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-blue-400" />
            <span>Click chuột vào bất kỳ ô đáp án bên trái hoặc bên dưới</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <kbd className="px-2 py-0.5 rounded bg-[#21262D] border border-[#30363D] text-blue-300">1</kbd>
            <kbd className="px-2 py-0.5 rounded bg-[#21262D] border border-[#30363D] text-blue-300">2</kbd>
            <kbd className="px-2 py-0.5 rounded bg-[#21262D] border border-[#30363D] text-blue-300">3</kbd>
            <kbd className="px-2 py-0.5 rounded bg-[#21262D] border border-[#30363D] text-blue-300">4</kbd>
          </div>
        </div>
      </div>
    );
  }

  // Multi-player or Team Mode
  return (
    <div className="bg-[#0A0E17] border border-[#30363D] rounded-2xl p-4 space-y-3 shadow-inner">
      <div className="flex items-center justify-between pb-2 border-b border-[#30363D]">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white">BÀN PHÍM & CHUỘT ({players.length} NGƯỜI CHƠI)</span>
        </div>
        <span className="text-[11px] text-gray-400 font-mono">Bấm phím hoặc click chuột</span>
      </div>

      <div className="space-y-3">
        {players.map((p, idx) => {
          const ans = currentAnswers[p.id]?.selectedOption;
          const isLocked = !!ans;
          const keyMap = playerKeyMaps[idx] || playerKeyMaps[0];

          return (
            <div
              key={p.id}
              className={`rounded-xl p-3 border transition ${
                isLocked
                  ? 'bg-blue-950/20 border-blue-500/40'
                  : 'bg-[#161B22] border-[#30363D]'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 font-mono text-[11px]">
                    P{idx + 1}
                  </span>
                  <span className="font-bold text-white">{p.name}</span>
                </div>
                {isLocked ? (
                  <span className="text-[11px] font-bold text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã chọn [{ans}]
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 font-mono">{keyMap.title}</span>
                )}
              </div>

              {/* 4 buttons for this player */}
              <div className="grid grid-cols-4 gap-1.5">
                {options.map((opt, optIdx) => {
                  const isThisSelected = ans === opt.key;
                  const keyLabel = keyMap.keys[optIdx] || opt.key;

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => onSelectOption(p.id, opt.key)}
                      className={`py-2 px-1 rounded-lg border text-center font-mono font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isThisSelected
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                          : 'bg-[#21262D] border-[#30363D] text-gray-200 hover:border-blue-500 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{opt.key}</span>
                      <span className="text-[9px] text-gray-400 opacity-80">[{keyLabel}]</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
