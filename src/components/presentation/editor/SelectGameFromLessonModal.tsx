import React, { useState } from 'react';
import { Lesson } from '../../../types/teacherLesson';
import { X, Gamepad2, Trophy, Check, Sparkles } from 'lucide-react';

interface SelectGameFromLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  onSelectGame: (gameData: {
    gameType: any;
    gameTitle: string;
    questionSetId: string;
    questionCount: number;
  }) => void;
}

export const SelectGameFromLessonModal: React.FC<SelectGameFromLessonModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onSelectGame,
}) => {
  const [selectedGameType, setSelectedGameType] = useState<string>('GESTURE_QUIZ_AI');
  const [selectedSetId, setSelectedSetId] = useState<string>(
    lesson.questionSets?.[0]?.id || 'default_set'
  );

  if (!isOpen) return null;

  const gamesList = [
    { type: 'GESTURE_QUIZ_AI', title: 'Đấu trường Cử chỉ AI (AI Vision)', desc: 'Học sinh giơ tay A/B/C/D qua webcam', badge: 'AI Camera' },
    { type: 'WHEEL_FORTUNE', title: 'Vòng quay May mắn', desc: 'Quay ngẫu nhiên chọn câu hỏi & điểm số', badge: 'Hấp dẫn' },
    { type: 'GOLDEN_BELL_CHALLENGE', title: 'Rung chuông vàng', desc: 'Đấu trường loại trực tiếp với bảng điểm số', badge: 'Kịch tính' },
    { type: 'MILLIONAIRE_QUIZ', title: 'Ai là Triệu phú Toán học', desc: 'Thử thách 15 mốc thang điểm thưởng', badge: 'Trí tuệ' },
    { type: 'CROSSWORD_PUZZLE', title: 'Ô chữ Bí mật', desc: 'Giải ô chữ từ khóa chủ đề bài học', badge: 'Tư duy' },
    { type: 'MYSTERY_DOORS', title: 'Cánh cửa Bí ẩn', desc: 'Mở cửa khám phá câu hỏi bí mật', badge: 'Bất ngờ' },
    { type: 'OBSTACLE_COURSE', title: 'Vượt chướng ngại vật', desc: 'Vượt từng ải toán học để về đích', badge: 'Thử thách' },
    { type: 'MATH_RACING', title: 'Đua xe Toán học', desc: 'Trả lời đúng để xe tăng tốc', badge: 'Tốc độ' },
    { type: 'MATH_ARENA', title: 'Đấu trường Kiến thức', desc: 'Thi đấu đồng đội theo nhóm', badge: 'Đồng đội' },
  ];

  const questionSets = lesson.questionSets || [];
  const questionCount = (lesson.questionBank || []).length;

  const handleConfirm = () => {
    const selected = gamesList.find((g) => g.type === selectedGameType);
    onSelectGame({
      gameType: selectedGameType,
      gameTitle: selected?.title || 'Trò chơi học tập',
      questionSetId: selectedSetId,
      questionCount,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chọn Trò chơi học tập nhúng vào Slide
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tuân thủ: Ngân hàng câu hỏi → Tạo đề → Đề → 9 Trò chơi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Chọn Trò chơi */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              1. Chọn 1 trong 9 Trò chơi học tập:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {gamesList.map((g) => {
                const isSelected = selectedGameType === g.type;
                return (
                  <div
                    key={g.type}
                    onClick={() => setSelectedGameType(g.type)}
                    className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-900 leading-snug">{g.title}</div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                          {g.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{g.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn Nguồn đề thi / Bộ câu hỏi */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              2. Chọn nguồn đề câu hỏi cho trò chơi:
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="source_bank"
                  name="q_source"
                  checked={selectedSetId === 'default_set'}
                  onChange={() => setSelectedSetId('default_set')}
                  className="accent-purple-600"
                />
                <label htmlFor="source_bank" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Toàn bộ câu hỏi trong Ngân hàng bài học ({questionCount} câu hỏi sẵn có)
                </label>
              </div>

              {questionSets.map((qs) => (
                <div key={qs.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={`source_${qs.id}`}
                    name="q_source"
                    checked={selectedSetId === qs.id}
                    onChange={() => setSelectedSetId(qs.id)}
                    className="accent-purple-600"
                  />
                  <label htmlFor={`source_${qs.id}`} className="text-xs font-bold text-slate-800 cursor-pointer">
                    Đề: {qs.title} ({qs.questions?.length || 0} câu)
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Xác nhận nhúng Trò chơi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
