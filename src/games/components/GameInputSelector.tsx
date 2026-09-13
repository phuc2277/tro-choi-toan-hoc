import React from 'react';
import { Camera, Mic, Keyboard, Smartphone, Video, VideoOff } from 'lucide-react';

export type InputModeType = 'camera' | 'voice' | 'manual' | 'remote';

interface GameInputSelectorProps {
  currentMode: InputModeType;
  onModeChange: (mode: InputModeType) => void;
  allowedModes?: InputModeType[];
  playerCount?: number;
  onOpenRemoteModal?: () => void;
  onTurnOffCamera?: () => void;
}

export const GameInputSelector: React.FC<GameInputSelectorProps> = ({
  currentMode,
  onModeChange,
  allowedModes = ['camera', 'voice', 'manual'],
  playerCount = 1,
  onOpenRemoteModal,
  onTurnOffCamera,
}) => {
  const handleTurnOffCamera = () => {
    if (onTurnOffCamera) {
      onTurnOffCamera();
    } else {
      onModeChange('manual');
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#111622] border border-[#21262D] rounded-2xl">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-300 pl-2">
        <span>Phương thức trả lời:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {allowedModes.includes('camera') && (
          <button
            type="button"
            onClick={() => onModeChange('camera')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentMode === 'camera'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/40'
                : 'bg-[#161B22] text-gray-400 hover:text-white hover:bg-[#21262D] border border-[#30363D]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>
              Camera AI {playerCount > 1 ? `(${playerCount} vùng/Laptop/USB)` : '(Cử chỉ)'}
            </span>
          </button>
        )}

        {/* Quick Turn Off Camera Action Button when Camera is on */}
        {currentMode === 'camera' && (
          <button
            type="button"
            onClick={handleTurnOffCamera}
            title="Tắt Camera ngay lập tức và chuyển sang chế độ thủ công / phím bấm"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600/90 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 border border-rose-400/40 transition cursor-pointer animate-fadeIn"
          >
            <VideoOff className="w-3.5 h-3.5" />
            <span>Tắt Camera</span>
          </button>
        )}

        {allowedModes.includes('voice') && (
          <button
            type="button"
            onClick={() => onModeChange('voice')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentMode === 'voice'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/40'
                : 'bg-[#161B22] text-gray-400 hover:text-white hover:bg-[#21262D] border border-[#30363D]'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Giọng nói (Voice)</span>
          </button>
        )}

        {allowedModes.includes('manual') && (
          <button
            type="button"
            onClick={() => onModeChange('manual')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentMode === 'manual'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                : 'bg-[#161B22] text-gray-400 hover:text-white hover:bg-[#21262D] border border-[#30363D]'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Thủ công (Phím tắt / Bảng)</span>
          </button>
        )}

        {allowedModes.includes('remote') && onOpenRemoteModal && (
          <button
            type="button"
            onClick={onOpenRemoteModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Thiết bị riêng (Điện thoại/PIN)</span>
          </button>
        )}
      </div>
    </div>
  );
};
