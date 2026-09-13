import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  Maximize2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { teachingSoundFX } from './soundEffects';

interface CountdownTimerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CountdownTimerWidget: React.FC<CountdownTimerWidgetProps> = ({ isOpen, onClose }) => {
  const [initialSeconds, setInitialSeconds] = useState<number>(180); // Default 3 mins
  const [remainingSeconds, setRemainingSeconds] = useState<number>(180);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Quick preset minutes
  const presets = [
    { label: '30s', secs: 30 },
    { label: '1p', secs: 60 },
    { label: '2p', secs: 120 },
    { label: '3p', secs: 180 },
    { label: '5p', secs: 300 },
    { label: '10p', secs: 600 },
  ];

  // Tick countdown
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            if (isSoundEnabled) {
              teachingSoundFX.playTimerComplete();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, remainingSeconds, isSoundEnabled]);

  if (!isOpen) return null;

  const handleStartPause = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(initialSeconds);
      setIsCompleted(false);
      setIsRunning(true);
    } else {
      setIsRunning((prev) => !prev);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setRemainingSeconds(initialSeconds);
  };

  const handleSelectPreset = (secs: number) => {
    setIsRunning(false);
    setIsCompleted(false);
    setInitialSeconds(secs);
    setRemainingSeconds(secs);
  };

  const handleAddMinute = () => {
    setRemainingSeconds((prev) => prev + 60);
    setInitialSeconds((prev) => prev + 60);
    setIsCompleted(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = initialSeconds > 0 ? (remainingSeconds / initialSeconds) * 100 : 0;
  const isUrgent = remainingSeconds > 0 && remainingSeconds <= 15;

  // Render Minimized Pill
  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2 rounded-2xl backdrop-blur-xl border cursor-pointer shadow-2xl transition-all ${
          isCompleted
            ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
            : isUrgent
            ? 'bg-amber-950/90 border-amber-500 text-amber-300 animate-bounce'
            : 'bg-slate-900/90 border-cyan-500/40 text-cyan-300'
        }`}
      >
        <Clock className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
        <span className="font-mono font-black text-sm tracking-wider">{formatTime(remainingSeconds)}</span>
        <Maximize2 className="w-3.5 h-3.5 opacity-60 ml-1" />
      </div>
    );
  }

  return (
    <div className="fixed top-6 right-6 z-50 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/40 rounded-3xl p-5 shadow-2xl text-white animate-in fade-in slide-in-from-top-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Đồng hồ hoạt động lớp</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSoundEnabled((prev) => !prev)}
            title={isSoundEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            title="Thu nhỏ thành thanh tiện ích"
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Đóng đồng hồ"
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timer Digital Display */}
      <div
        className={`relative py-4 rounded-2xl flex flex-col items-center justify-center transition-colors border ${
          isCompleted
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
            : isUrgent
            ? 'bg-amber-950/30 border-amber-500/50 text-amber-400 animate-pulse'
            : 'bg-slate-950/70 border-cyan-500/20 text-cyan-300'
        }`}
      >
        <span className="font-mono font-black text-4xl sm:text-5xl tracking-widest drop-shadow-md">
          {formatTime(remainingSeconds)}
        </span>

        {/* Status message */}
        <div className="mt-1 text-[11px] font-bold">
          {isCompleted ? (
            <span className="text-rose-400 flex items-center gap-1 animate-bounce">
              <Sparkles className="w-3 h-3" /> HẾT GIỜ THẢO LUẬN!
            </span>
          ) : isUrgent ? (
            <span className="text-amber-400">Sắp hết thời gian!</span>
          ) : isRunning ? (
            <span className="text-cyan-400/80">Đang đếm ngược...</span>
          ) : (
            <span className="text-slate-400">Sẵn sàng bắt đầu</span>
          )}
        </div>

        {/* Visual Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800 rounded-b-2xl overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isCompleted
                ? 'bg-rose-500 w-full'
                : isUrgent
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-6 gap-1.5 mt-3">
        {presets.map((preset) => (
          <button
            key={preset.secs}
            onClick={() => handleSelectPreset(preset.secs)}
            className={`py-1 rounded-xl text-[11px] font-bold font-mono transition cursor-pointer border ${
              initialSeconds === preset.secs && !isRunning
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                : 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 border-slate-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={handleStartPause}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              : 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>TẠM DỪNG</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{remainingSeconds === 0 ? 'BẮT ĐẦU LẠI' : 'BẮT ĐẦU'}</span>
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          title="Đặt lại từ đầu"
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={handleAddMinute}
          title="Cộng thêm 1 phút (+60s)"
          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>1p</span>
        </button>
      </div>
    </div>
  );
};
