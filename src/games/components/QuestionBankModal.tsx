import React, { useState } from 'react';
import { QuestionItem } from '../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import { X, Plus, CheckSquare, Square, Search, BookOpen, AlertCircle } from 'lucide-react';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  allLessonQuestions: QuestionItem[];
  selectedPoolIds?: string[];
  selectedQuestionIds?: string[];
  onSavePool: (newPoolIds: string[]) => void;
  lessonTitle: string;
  subject: string;
  minRequired: number;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  allLessonQuestions,
  selectedPoolIds,
  selectedQuestionIds,
  onSavePool,
  lessonTitle,
  subject,
  minRequired,
}) => {
  const [currentSelected, setCurrentSelected] = useState<string[]>(selectedPoolIds || selectedQuestionIds || []);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New question form state
  const [newContent, setNewContent] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState<QuizOptionKeyEnum>(QuizOptionKeyEnum.A);
  const [explanation, setExplanation] = useState('');

  if (!isOpen) return null;

  const filteredQuestions = allLessonQuestions.filter(
    (q) =>
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.options.some((o) => o.text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    if (currentSelected.includes(id)) {
      setCurrentSelected(currentSelected.filter((item) => item !== id));
    } else {
      setCurrentSelected([...currentSelected, id]);
    }
  };

  const selectAll = () => {
    setCurrentSelected(allLessonQuestions.map((q) => q.id));
  };

  const deselectAll = () => {
    setCurrentSelected([]);
  };

  const handleSave = () => {
    if (currentSelected.length < minRequired) {
      alert(`Vui lòng chọn ít nhất ${minRequired} câu hỏi cho Question Pool!`);
      return;
    }
    onSavePool(currentSelected);
    onClose();
  };

  const handleAddNewQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      alert('Vui lòng điền đầy đủ nội dung câu hỏi và 4 phương án A, B, C, D!');
      return;
    }

    const newQuestion: QuestionItem = {
      id: `custom-${Date.now()}`,
      subject,
      grade: 8,
      lessonTitle,
      content: newContent.trim(),
      options: [
        { key: QuizOptionKeyEnum.A, text: optA.trim() },
        { key: QuizOptionKeyEnum.B, text: optB.trim() },
        { key: QuizOptionKeyEnum.C, text: optC.trim() },
        { key: QuizOptionKeyEnum.D, text: optD.trim() },
      ],
      correctAnswer: correctOpt,
      explanation: explanation.trim() || 'Giáo viên tự tạo bổ sung.',
    };

    allLessonQuestions.push(newQuestion);
    setCurrentSelected([...currentSelected, newQuestion.id]);
    setShowAddForm(false);
    // Reset form
    setNewContent('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setExplanation('');
  };

  const isEnough = currentSelected.length >= minRequired;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-[#161B22] border border-[#30363D] shadow-2xl overflow-hidden text-white relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363D] bg-[#0A0E17]/60 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Bạn Chọn Đề Nào (Danh Sách Câu Hỏi)
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Môn: <span className="font-semibold text-blue-400">{subject}</span> • Bài học:{' '}
              <span className="font-semibold text-gray-200">{lessonTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-[#21262D] hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363D] bg-[#161B22] px-6 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#21262D] px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-[#30363D] hover:text-white transition cursor-pointer"
            >
              <CheckSquare className="h-4 w-4 text-blue-400" /> Chọn tất cả ({allLessonQuestions.length})
            </button>
            <button
              onClick={deselectAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#21262D] px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-[#30363D] hover:text-gray-200 transition cursor-pointer"
            >
              <Square className="h-4 w-4 text-gray-500" /> Bỏ chọn tất cả
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" /> {showAddForm ? 'Đóng form tạo' : '+ Thêm câu hỏi'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm nội dung câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-56 rounded-lg border border-[#30363D] bg-[#0A0E17] pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div
              className={`rounded-lg px-3 py-1.5 text-xs font-mono font-bold ${
                isEnough ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              Đã chọn: {currentSelected.length} / {allLessonQuestions.length} câu (Tối thiểu {minRequired})
            </div>
          </div>
        </div>

        {/* Add Question Inline Drawer */}
        {showAddForm && (
          <form onSubmit={handleAddNewQuestion} className="bg-[#0A0E17] p-4 border-b border-[#30363D] text-xs">
            <h4 className="font-bold text-blue-400 mb-2">Thêm câu hỏi mới vào ngân hàng bài học:</h4>
            <div className="mb-2">
              <input
                type="text"
                placeholder="Nội dung câu hỏi trắc nghiệm..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full rounded-lg border border-[#30363D] bg-[#161B22] p-2 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                placeholder="Phương án A (1 ngón tay)"
                value={optA}
                onChange={(e) => setOptA(e.target.value)}
                className="rounded-lg border border-[#30363D] bg-[#161B22] p-1.5 text-xs text-white placeholder-gray-500"
                required
              />
              <input
                type="text"
                placeholder="Phương án B (2 ngón tay)"
                value={optB}
                onChange={(e) => setOptB(e.target.value)}
                className="rounded-lg border border-[#30363D] bg-[#161B22] p-1.5 text-xs text-white placeholder-gray-500"
                required
              />
              <input
                type="text"
                placeholder="Phương án C (3 ngón tay)"
                value={optC}
                onChange={(e) => setOptC(e.target.value)}
                className="rounded-lg border border-[#30363D] bg-[#161B22] p-1.5 text-xs text-white placeholder-gray-500"
                required
              />
              <input
                type="text"
                placeholder="Phương án D (4 ngón tay)"
                value={optD}
                onChange={(e) => setOptD(e.target.value)}
                className="rounded-lg border border-[#30363D] bg-[#161B22] p-1.5 text-xs text-white placeholder-gray-500"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-300">Đáp án đúng:</span>
                <select
                  value={correctOpt}
                  onChange={(e) => setCorrectOpt(e.target.value as QuizOptionKeyEnum)}
                  className="rounded-lg border border-[#30363D] bg-[#161B22] px-2 py-1 font-mono font-bold text-blue-400"
                >
                  <option value={QuizOptionKeyEnum.A}>Đáp án A</option>
                  <option value={QuizOptionKeyEnum.B}>Đáp án B</option>
                  <option value={QuizOptionKeyEnum.C}>Đáp án C</option>
                  <option value={QuizOptionKeyEnum.D}>Đáp án D</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Giải thích ngắn gọn (tùy chọn)..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="flex-1 rounded-lg border border-[#30363D] bg-[#161B22] p-1.5 text-xs text-white placeholder-gray-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-1.5 font-bold text-white hover:bg-blue-500 cursor-pointer transition"
              >
                Lưu câu hỏi
              </button>
            </div>
          </form>
        )}

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
              Không tìm thấy câu hỏi phù hợp.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const isSelected = currentSelected.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelect(q.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    isSelected
                      ? 'border-blue-500/70 bg-blue-950/30 shadow-md'
                      : 'border-[#30363D] bg-[#0A0E17] hover:border-gray-500 hover:bg-[#161B22]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-blue-400" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-mono font-bold text-blue-300 border border-blue-500/30">
                          Câu {idx + 1}
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                          {q.subject}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white mb-2">{q.content}</p>

                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt) => (
                          <div
                            key={opt.key}
                            className={`rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5 ${
                              opt.key === q.correctAnswer
                                ? 'bg-emerald-950/40 text-emerald-300 font-semibold border border-emerald-500/50'
                                : 'bg-[#21262D] text-gray-300 border border-[#30363D]'
                            }`}
                          >
                            <span className="font-mono font-bold text-white">{opt.key}.</span>
                            <span>{opt.text}</span>
                            {opt.key === q.correctAnswer && (
                              <span className="ml-auto text-[10px] text-emerald-400 font-bold font-mono">✓ Đúng</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#30363D] bg-[#0A0E17]/60 px-6 py-4">
          <div className="text-xs">
            {isEnough ? (
              <span className="text-emerald-400 font-medium">
                ✅ Đủ điều kiện tạo đề chơi ({currentSelected.length} câu).
              </span>
            ) : (
              <span className="text-rose-400 font-medium">
                ⚠️ Cần chọn tối thiểu {minRequired} câu để đảm bảo số câu mỗi lượt chơi.
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-[#30363D] bg-[#21262D] px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-[#30363D] hover:text-white transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              disabled={!isEnough}
              className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Xác Nhận Đề ({currentSelected.length} câu)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
