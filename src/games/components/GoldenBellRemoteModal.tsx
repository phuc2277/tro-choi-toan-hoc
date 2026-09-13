import React, { useState, useEffect } from 'react';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import { GoldenBellContestant } from '../types/GamePlatform';
import {
  Smartphone,
  QrCode,
  X,
  Check,
  Users,
  Copy,
  Sparkles,
  Send,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface GoldenBellRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestants: GoldenBellContestant[];
  currentQuestionIndex: number;
  onContestantAnswer: (contestantId: string, option: QuizOptionKeyEnum) => void;
  onBatchAnswer: (option: QuizOptionKeyEnum) => void;
}

export const GoldenBellRemoteModal: React.FC<GoldenBellRemoteModalProps> = ({
  isOpen,
  onClose,
  contestants,
  currentQuestionIndex,
  onContestantAnswer,
  onBatchAnswer,
}) => {
  const [roomPin] = useState<string>('BELL-9988');
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedContestantId, setSelectedContestantId] = useState<string>(
    contestants[0]?.id || ''
  );
  const [deviceSelectedOption, setDeviceSelectedOption] = useState<QuizOptionKeyEnum | null>(null);

  // Sync selected contestant
  useEffect(() => {
    if (!selectedContestantId && contestants.length > 0) {
      setSelectedContestantId(contestants[0].id);
    }
  }, [contestants, selectedContestantId]);

  // Sync choice from active contestant
  useEffect(() => {
    const active = contestants.find((c) => c.id === selectedContestantId);
    setDeviceSelectedOption(active?.selectedOption || null);
  }, [selectedContestantId, contestants]);

  // Real-time BroadcastChannel sync for multi-device/multi-tab response
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('golden_bell_responses');

    channel.onmessage = (event) => {
      const data = event.data;
      if (data && data.type === 'SUBMIT_ANSWER') {
        const { contestantId, option } = data;
        if (contestantId && option) {
          onContestantAnswer(contestantId, option);
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [onContestantAnswer]);

  if (!isOpen) return null;

  const currentContestant = contestants.find((c) => c.id === selectedContestantId);
  const activeContestants = contestants.filter((c) => !c.isEliminated);
  const answeredCount = activeContestants.filter((c) => c.selectedOption !== null).length;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(roomPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeviceSubmit = (opt: QuizOptionKeyEnum) => {
    if (!selectedContestantId || currentContestant?.isEliminated) return;
    setDeviceSelectedOption(opt);
    onContestantAnswer(selectedContestantId, opt);

    // Broadcast
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('golden_bell_responses');
        channel.postMessage({
          type: 'SUBMIT_ANSWER',
          contestantId: selectedContestantId,
          option: opt,
        });
        channel.close();
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0D1117] border border-[#30363D] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262D] bg-[#161B22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Thiết Bị Riêng / Điện Thoại Học Sinh</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono px-2 py-0.5 border border-emerald-500/30">
                  REALTIME
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Học sinh dùng điện thoại hoặc máy tính cá nhân để chọn đáp án A, B, C, D
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#21262D] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Room PIN Card */}
          <div className="bg-gradient-to-r from-amber-950/40 via-[#161B22] to-blue-950/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <div className="text-xs font-medium text-amber-300 flex items-center justify-center sm:justify-start gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                MÃ PHÒNG THI ĐẤU (ROOM PIN)
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white">
                {roomPin}
              </div>
              <div className="text-[11px] text-gray-400">
                Học sinh mở trình duyệt trên điện thoại và tham gia vào số ghế của mình
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-xs font-bold text-white border border-[#30363D] transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
              </button>
            </div>
          </div>

          {/* Quick Batch Options for Teacher */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Giáo viên chấm nhanh theo đáp án học sinh giơ bảng mica:
              </span>
              <span className="text-[11px] font-mono text-gray-400">
                Đã nộp: <strong className="text-emerald-400">{answeredCount}</strong>/{activeContestants.length}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[QuizOptionKeyEnum.A, QuizOptionKeyEnum.B, QuizOptionKeyEnum.C, QuizOptionKeyEnum.D].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onBatchAnswer(opt)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#21262D] hover:bg-blue-600 hover:text-white text-gray-200 border border-[#30363D] text-xs font-bold transition cursor-pointer"
                >
                  <span>Chọn tất cả {opt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Virtual Mobile Screen Simulator */}
          <div className="border border-blue-500/30 bg-[#0A0E17] rounded-3xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Giao diện điều khiển trên điện thoại của thí sinh</span>
              </div>
              {/* Select contestant dropdown to simulate */}
              <select
                value={selectedContestantId}
                onChange={(e) => setSelectedContestantId(e.target.value)}
                className="bg-[#161B22] border border-[#30363D] text-xs rounded-xl px-2.5 py-1 text-white font-medium focus:outline-none"
              >
                {contestants.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isEliminated ? '(Đã loại)' : c.selectedOption ? `(Đã chọn ${c.selectedOption})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {currentContestant?.isEliminated ? (
              <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-center text-rose-300">
                <p className="text-sm font-bold">Thí sinh này đã bị loại</p>
                <p className="text-xs text-rose-400/80 mt-1">Đang chờ lượt cứu trợ từ giáo viên!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#161B22] p-3 rounded-2xl border border-[#30363D]">
                  <div>
                    <div className="text-xs font-bold text-white">{currentContestant?.name}</div>
                    <div className="text-[11px] text-gray-400">Câu hỏi số {currentQuestionIndex + 1}</div>
                  </div>
                  {deviceSelectedOption ? (
                    <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs px-3 py-1.5 border border-emerald-500/40">
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chọn {deviceSelectedOption}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400 font-medium">Chưa nộp đáp án</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[QuizOptionKeyEnum.A, QuizOptionKeyEnum.B, QuizOptionKeyEnum.C, QuizOptionKeyEnum.D].map(
                    (opt) => {
                      const isSelected = deviceSelectedOption === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleDeviceSubmit(opt)}
                          className={`h-16 rounded-2xl font-black text-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white scale-102 ring-4 ring-emerald-500/30'
                              : 'bg-[#161B22] hover:bg-[#21262D] text-white border border-[#30363D]'
                          }`}
                        >
                          <span className="font-mono">{opt}</span>
                          {isSelected && <Check className="w-5 h-5" />}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#21262D] bg-[#161B22] flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Học sinh có thể kết nối đồng thời từ nhiều thiết bị độc lập
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            Đóng & Tiếp tục Ván Đấu
          </button>
        </div>
      </div>
    </div>
  );
};
