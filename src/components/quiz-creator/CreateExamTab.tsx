import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Lesson,
  QuestionSetItem,
  ExtendedQuestionItem,
} from '../../types/teacherLesson';
import { MathRenderer } from '../../games/components/MathRenderer';
import { MathDiagramView } from '../../games/components/MathDiagramView';
import { QuestionEditorModal } from './QuestionEditorModal';
import { CreateExamWizardModal } from './CreateExamWizardModal';
import { SwapExamQuestionModal } from './SwapExamQuestionModal';
import {
  getLessonQuestionBank,
  resolveExamQuestions,
  calculateQuestionSetStats,
} from '../../data/teacherLessonData';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit3,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Layers,
  FileQuestion,
  HelpCircle,
  Printer,
  Copy,
  Clock,
  Settings2,
  X,
  Check,
  AlertTriangle,
  Eye,
  Gamepad2,
  Play,
} from 'lucide-react';

interface CreateExamTabProps {
  lesson: Lesson;
  onUpdateLesson: (updatedLesson: Lesson) => void;
  onNavigateToGames?: (selectedSetId?: string) => void;
  onNavigateToQuestionBank?: () => void;
  onLaunchGameDirectly?: (questionSet: QuestionSetItem) => void;
  onStartPracticeQuiz?: (questionSet: QuestionSetItem) => void;
}

export const CreateExamTab: React.FC<CreateExamTabProps> = ({
  lesson,
  onUpdateLesson,
  onNavigateToGames,
  onNavigateToQuestionBank,
  onLaunchGameDirectly,
  onStartPracticeQuiz,
}) => {
  // Selected Question Set / Exam ID
  const [selectedSetId, setSelectedSetId] = useState<string>(
    lesson.questionSets[0]?.id || ''
  );

  // Modals & Panels
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExtendedQuestionItem | null>(null);
  const [showDeleteSetConfirm, setShowDeleteSetConfirm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // View Exam Questions Preview Modal
  const [viewingExamSet, setViewingExamSet] = useState<QuestionSetItem | null>(null);
  const [isEditMetaModalOpen, setIsEditMetaModalOpen] = useState(false);
  const [editingMetaSet, setEditingMetaSet] = useState<QuestionSetItem | null>(null);
  const [deletingExamItem, setDeletingExamItem] = useState<QuestionSetItem | null>(null);
  const [editMetaTitle, setEditMetaTitle] = useState('');
  const [editMetaDescription, setEditMetaDescription] = useState('');
  const [editMetaTimePerQuestion, setEditMetaTimePerQuestion] = useState(30);

  // Swap Question Modal State
  const [swapModalData, setSwapModalData] = useState<{
    isOpen: boolean;
    question: ExtendedQuestionItem | null;
    index: number;
  }>({
    isOpen: false,
    question: null,
    index: -1,
  });

  // Bank of questions
  const questionBank = useMemo(() => {
    return getLessonQuestionBank(lesson);
  }, [lesson]);

  // Retrieve current active question set / exam
  const currentSet = useMemo(() => {
    return (
      (lesson.questionSets || []).find((s) => s.id === selectedSetId) ||
      (lesson.questionSets || [])[0] ||
      null
    );
  }, [lesson.questionSets, selectedSetId]);

  // Resolved questions for current exam
  const currentExamQuestions = useMemo(() => {
    if (!currentSet) return [];
    return resolveExamQuestions(currentSet, questionBank);
  }, [currentSet, questionBank]);

  // Exam stats
  const currentStats = useMemo(() => {
    return calculateQuestionSetStats(currentExamQuestions);
  }, [currentExamQuestions]);

  // Handler: Save from Wizard Modal
  const handleSaveWizardExam = (
    newExam: QuestionSetItem,
    updatedQuestionBank: ExtendedQuestionItem[]
  ) => {
    onUpdateLesson({
      ...lesson,
      questionBank: updatedQuestionBank,
      questionSets: [newExam, ...(lesson.questionSets || [])],
    });
    setSelectedSetId(newExam.id);
  };

  // Handler: Duplicate Exam
  const handleDuplicateExam = () => {
    if (!currentSet) return;
    const dupId = `qs-copy-${Date.now()}`;
    const dupTitle = `${currentSet.title} (Bản sao)`;
    const duplicated: QuestionSetItem = {
      ...currentSet,
      id: dupId,
      title: dupTitle,
      createdAt: Date.now(),
    };

    onUpdateLesson({
      ...lesson,
      questionSets: [duplicated, ...(lesson.questionSets || [])],
    });
    setSelectedSetId(dupId);
  };

  // Handler: Duplicate any specific Exam
  const handleDuplicateSpecificExam = (targetSet: QuestionSetItem) => {
    const dupId = `qs-copy-${Date.now()}`;
    const dupTitle = `${targetSet.title} (Bản sao)`;
    const duplicated: QuestionSetItem = {
      ...targetSet,
      id: dupId,
      title: dupTitle,
      createdAt: Date.now(),
    };

    onUpdateLesson({
      ...lesson,
      questionSets: [duplicated, ...(lesson.questionSets || [])],
    });
    setSelectedSetId(dupId);
  };

  // Handler: Open Edit Exam Meta Modal for specific set
  const handleOpenEditMeta = (targetSet?: QuestionSetItem) => {
    const set = targetSet || currentSet;
    if (!set) return;
    setEditingMetaSet(set);
    setEditMetaTitle(set.title);
    setEditMetaDescription(set.description || '');
    setEditMetaTimePerQuestion(set.timePerQuestion || 30);
    setIsEditMetaModalOpen(true);
  };

  // Handler: Save Edit Exam Meta
  const handleSaveEditMeta = () => {
    const targetSet = editingMetaSet || currentSet;
    if (!targetSet) return;
    const updatedSets = (lesson.questionSets || []).map((qs) => {
      if (qs.id === targetSet.id) {
        return {
          ...qs,
          title: editMetaTitle.trim() || qs.title,
          description: editMetaDescription.trim(),
          timePerQuestion: Math.max(5, editMetaTimePerQuestion || 30),
        };
      }
      return qs;
    });

    onUpdateLesson({
      ...lesson,
      questionSets: updatedSets,
    });
    setIsEditMetaModalOpen(false);
    setEditingMetaSet(null);
  };

  // Handler: Swap Question Replacement
  const handleSwapQuestion = (
    oldQuestion: ExtendedQuestionItem,
    newQuestion: ExtendedQuestionItem
  ) => {
    if (!currentSet) return;
    const currentIds = currentSet.questionIds || currentExamQuestions.map((q) => q.id);
    const newIds = currentIds.map((id) => (id === oldQuestion.id ? newQuestion.id : id));

    const updatedSets = (lesson.questionSets || []).map((qs) => {
      if (qs.id === currentSet.id) {
        return {
          ...qs,
          questionIds: newIds,
        };
      }
      return qs;
    });

    onUpdateLesson({
      ...lesson,
      questionSets: updatedSets,
    });

    setSwapModalData({ isOpen: false, question: null, index: -1 });
  };

  // Handler: Move question up or down
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!currentSet) return;
    const currentIds = [...(currentSet.questionIds || currentExamQuestions.map((q) => q.id))];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentIds.length) return;

    const temp = currentIds[index];
    currentIds[index] = currentIds[targetIndex];
    currentIds[targetIndex] = temp;

    const updatedSets = (lesson.questionSets || []).map((qs) => {
      if (qs.id === currentSet.id) {
        return {
          ...qs,
          questionIds: currentIds,
        };
      }
      return qs;
    });

    onUpdateLesson({
      ...lesson,
      questionSets: updatedSets,
    });
  };

  // Save / Edit Question inside Exam (Updates Question Bank too!)
  const handleSaveQuestion = (savedQ: ExtendedQuestionItem) => {
    const currentBank = getLessonQuestionBank(lesson);
    const existsInBank = currentBank.some((q) => q.id === savedQ.id);

    let updatedBank: ExtendedQuestionItem[];
    if (existsInBank) {
      updatedBank = currentBank.map((q) => (q.id === savedQ.id ? savedQ : q));
    } else {
      updatedBank = [savedQ, ...currentBank];
    }

    const updatedSets = (lesson.questionSets || []).map((qs) => {
      if (currentSet && qs.id === currentSet.id) {
        const hasQ = (qs.questions || []).some((q) => q.id === savedQ.id);
        const newQuestions = hasQ
          ? qs.questions.map((q) => (q.id === savedQ.id ? savedQ : q))
          : [savedQ, ...(qs.questions || [])];
        const newIds = (qs.questionIds || []).includes(savedQ.id)
          ? qs.questionIds
          : [savedQ.id, ...(qs.questionIds || [])];

        return {
          ...qs,
          questionIds: newIds,
          questions: newQuestions,
          questionCount: newQuestions.length,
          stats: calculateQuestionSetStats(newQuestions),
        };
      }
      return qs;
    });

    onUpdateLesson({
      ...lesson,
      questionBank: updatedBank,
      questionSets: updatedSets,
    });

    setIsEditorModalOpen(false);
    setEditingQuestion(null);
  };

  // Remove Question from Current Exam
  const handleRemoveQuestionFromExam = (questionId: string) => {
    if (!currentSet) return;

    const updatedSets = (lesson.questionSets || []).map((qs) => {
      if (qs.id === currentSet.id) {
        const newQuestions = (qs.questions || []).filter((q) => q.id !== questionId);
        const newIds = (qs.questionIds || []).filter((id) => id !== questionId);
        return {
          ...qs,
          questionIds: newIds,
          questions: newQuestions,
          questionCount: newQuestions.length,
          stats: calculateQuestionSetStats(newQuestions),
        };
      }
      return qs;
    });

    onUpdateLesson({
      ...lesson,
      questionSets: updatedSets,
    });
  };

  // Delete Exam
  const handleDeleteExam = () => {
    const targetSet = deletingExamItem || currentSet;
    if (!targetSet) return;
    const remainingSets = (lesson.questionSets || []).filter((s) => s.id !== targetSet.id);
    onUpdateLesson({
      ...lesson,
      questionSets: remainingSets,
    });
    setSelectedSetId(remainingSets[0]?.id || '');
    setShowDeleteSetConfirm(false);
    setDeletingExamItem(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Top Banner: Exam Management Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>3. TẠO ĐỀ THI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Tạo Đề Thi & Quản Lý Bộ Đề
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Tạo và quản lý các Đề thi từ Ngân hàng câu hỏi của bài học <strong>{lesson.title}</strong>. Đề thi được rút theo ma trận 2D, chọn thủ công hoặc kết hợp.
            </p>
          </div>

          {/* Quick Actions: Only Main Create Exam Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-main-create-exam-wizard"
              onClick={() => setIsCreateWizardOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-200 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Đề Mới</span>
            </button>
          </div>
        </div>

        {/* Exam Cards List */}
        {(lesson.questionSets || []).length > 0 && (
          <div className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">
                Các đề đã tạo ({lesson.questionSets.length} bộ đề):
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(lesson.questionSets || []).map((qs) => {
                const isSelected = qs.id === selectedSetId;
                const qsQuestions = resolveExamQuestions(qs, questionBank);
                const qsCount = qs.questionIds?.length ?? qs.questions?.length ?? 0;
                const durationMinutes = Math.round((qsCount * (qs.timePerQuestion || 30)) / 60);

                return (
                  <div
                    key={qs.id}
                    onClick={() => setSelectedSetId(qs.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-400 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-black text-slate-900 truncate">
                          {qs.title}
                        </h4>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-600 text-white shrink-0">
                            Đang mở
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-semibold">
                        <span>{qsCount} câu hỏi</span>
                        <span>•</span>
                        <span>{durationMinutes > 0 ? `${durationMinutes} phút` : `${qs.timePerQuestion || 30}s/câu`}</span>
                      </div>
                      {qs.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {qs.description}
                        </p>
                      )}
                    </div>

                    {/* Quick action buttons: [Xem] [Sửa] [Nhân bản] [Xóa] */}
                    <div
                      className="flex items-center gap-1.5 pt-2 border-t border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSetId(qs.id);
                          setViewingExamSet(qs);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold transition cursor-pointer"
                        title="Xem toàn bộ câu hỏi của đề này"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSetId(qs.id);
                          handleOpenEditMeta(qs);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 text-xs font-bold transition cursor-pointer"
                        title="Sửa thông tin đề thi"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateSpecificExam(qs)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 text-xs font-bold transition cursor-pointer"
                        title="Nhân bản đề này"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Nhân bản</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSetId(qs.id);
                          setDeletingExamItem(qs);
                          setShowDeleteSetConfirm(true);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Xóa đề này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active Exam Detail & Question List */}
      {currentSet ? (
        <div className="space-y-6">
          {/* Active Exam Banner & Actions */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-black text-slate-900">{currentSet.title}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {currentExamQuestions.length} câu hỏi
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{currentSet.timePerQuestion || 30}s / câu</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">{currentSet.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-exam-edit-meta"
                onClick={() => handleOpenEditMeta()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                title="Chỉnh sửa thông tin đề thi"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Sửa đề</span>
              </button>

              <button
                id="btn-exam-duplicate"
                onClick={handleDuplicateExam}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                title="Tạo bản sao của đề này"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Nhân bản</span>
              </button>

              <button
                id="btn-take-practice-quiz"
                onClick={() => onStartPracticeQuiz && onStartPracticeQuiz(currentSet)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                title="Làm bài thi thử trắc nghiệm trực tiếp"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Làm bài thi</span>
              </button>

              <button
                id="btn-exam-to-games"
                onClick={() => onNavigateToGames && onNavigateToGames(currentSet.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                title="Sử dụng bộ đề này để tổ chức trò chơi cho học sinh"
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Chơi trò chơi</span>
              </button>

              <button
                id="btn-print-exam"
                onClick={() => setShowPrintModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                title="In hoặc xuất đề thi"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In đề</span>
              </button>

              <button
                onClick={() => setShowDeleteSetConfirm(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                title="Xóa đề này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Exam Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Tổng số câu</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{currentExamQuestions.length}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center shadow-2xs">
              <div className="text-[11px] font-bold text-emerald-800 uppercase">Nhận biết</div>
              <div className="text-xl font-black text-emerald-700 mt-0.5">{currentStats.recognition}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-center shadow-2xs">
              <div className="text-[11px] font-bold text-blue-800 uppercase">Thông hiểu</div>
              <div className="text-xl font-black text-blue-700 mt-0.5">{currentStats.understanding}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-center shadow-2xs">
              <div className="text-[11px] font-bold text-purple-800 uppercase">Vận dụng</div>
              <div className="text-xl font-black text-purple-700 mt-0.5">{currentStats.application + currentStats.advanced}</div>
            </div>
          </div>

          {/* Questions inside Current Exam */}
          {currentExamQuestions.length > 0 ? (
            <div className="space-y-3">
              {currentExamQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  id={`exam-question-${q.id}`}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-1">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>

                        {/* Reorder Buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveQuestion(idx, 'up')}
                            className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 flex items-center justify-center text-[10px] cursor-pointer"
                            title="Di chuyển lên trên"
                          >
                            <ArrowUp className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === currentExamQuestions.length - 1}
                            onClick={() => handleMoveQuestion(idx, 'down')}
                            className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 flex items-center justify-center text-[10px] cursor-pointer"
                            title="Di chuyển xuống dưới"
                          >
                            <ArrowDown className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          q.cognitiveLevel === 'Nhận biết'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : q.cognitiveLevel === 'Thông hiểu'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {q.cognitiveLevel || 'Thông hiểu'}
                      </span>

                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                        {q.questionType === 'true-false'
                          ? 'Đúng / Sai'
                          : q.questionType === 'short-answer'
                          ? 'Trả lời ngắn'
                          : 'Trắc nghiệm ABCD'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Swap Question Button */}
                      <button
                        onClick={() =>
                          setSwapModalData({
                            isOpen: true,
                            question: q,
                            index: idx,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition cursor-pointer"
                        title="Đổi câu tương đương từ Ngân hàng"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Thay câu</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setIsEditorModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>

                      <button
                        onClick={() => handleRemoveQuestionFromExam(q.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Bỏ câu hỏi này khỏi đề (vẫn lưu trong Ngân hàng)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-slate-900 leading-relaxed pt-1">
                    <MathRenderer text={q.content} />
                  </div>

                  {/* Diagrams & Tables */}
                  {(q.diagram || q.tableData || q.imageUrl) && (
                    <div className="my-2">
                      <MathDiagramView
                        diagram={q.diagram}
                        tableData={q.tableData}
                        imageUrl={q.imageUrl}
                      />
                    </div>
                  )}

                  {/* Short Answer Key */}
                  {q.shortAnswerKey && (
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 font-medium flex items-center gap-2">
                      <span className="font-bold">Đáp án ngắn:</span>
                      <code className="px-2 py-0.5 bg-white rounded-md font-bold text-purple-700 border border-purple-300">
                        {q.shortAnswerKey}
                      </code>
                    </div>
                  )}

                  {/* Multiple Choice Options */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => {
                        const isCorrect = opt.key === q.correctAnswer;
                        return (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                              isCorrect
                                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-semibold shadow-2xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <div className="min-w-0 flex-1 leading-snug">
                              <MathRenderer text={opt.text} />
                            </div>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 ml-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      <span className="font-bold text-indigo-900">Lời giải chi tiết: </span>
                      <MathRenderer text={q.explanation} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
              <FileQuestion className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">Đề thi chưa có câu hỏi nào</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hãy bấm nút Tạo Đề Mới bên trên để rút câu hỏi từ Ngân hàng câu hỏi vào đề thi này.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Bài học chưa có Đề thi nào</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Ngân hàng câu hỏi của bài học hiện có <strong>{questionBank.length} câu hỏi</strong>. Hãy tạo Đề thi đầu tiên để chuẩn bị cho học sinh kiểm tra hoặc làm bài.
            </p>
          </div>
          <button
            onClick={() => setIsCreateWizardOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-200 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Đề Mới Ngay</span>
          </button>
        </div>
      )}

      {/* Create Exam Wizard Modal */}
      {isCreateWizardOpen && (
        <CreateExamWizardModal
          isOpen={isCreateWizardOpen}
          onClose={() => setIsCreateWizardOpen(false)}
          lesson={lesson}
          onSaveExam={handleSaveWizardExam}
          onNavigateToQuestionBank={onNavigateToQuestionBank}
        />
      )}

      {/* Edit Question Modal */}
      {isEditorModalOpen && editingQuestion && (
        <QuestionEditorModal
          isOpen={isEditorModalOpen}
          onClose={() => {
            setIsEditorModalOpen(false);
            setEditingQuestion(null);
          }}
          question={editingQuestion}
          lessonTitle={lesson.title}
          subject={lesson.subject}
          grade={lesson.grade}
          onSaveQuestion={handleSaveQuestion}
        />
      )}

      {/* Swap Question Modal */}
      {swapModalData.isOpen && swapModalData.question && (
        <SwapExamQuestionModal
          isOpen={swapModalData.isOpen}
          onClose={() => setSwapModalData({ isOpen: false, question: null, index: -1 })}
          currentQuestion={swapModalData.question}
          questionIndex={swapModalData.index}
          bank={questionBank}
          currentExamQuestionIds={currentSet?.questionIds || currentExamQuestions.map((q) => q.id)}
          onSelectReplacement={(newQ) => handleSwapQuestion(swapModalData.question!, newQ)}
        />
      )}

      {/* Edit Exam Meta Modal */}
      {isEditMetaModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">Sửa thông tin đề thi</h3>
                <button
                  onClick={() => setIsEditMetaModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên đề thi</label>
                  <input
                    type="text"
                    value={editMetaTitle}
                    onChange={(e) => setEditMetaTitle(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mô tả đề thi</label>
                  <textarea
                    rows={2}
                    value={editMetaDescription}
                    onChange={(e) => setEditMetaDescription(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Thời gian làm bài mỗi câu (giây)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={editMetaTimePerQuestion}
                    onChange={(e) =>
                      setEditMetaTimePerQuestion(Math.max(5, parseInt(e.target.value) || 30))
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsEditMetaModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEditMeta}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-blue-200"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Exam Confirmation Modal */}
      {showDeleteSetConfirm &&
        (deletingExamItem || currentSet) &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-black text-slate-900">Xác nhận xóa Đề thi?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bạn có chắc chắn muốn xóa <strong>{(deletingExamItem || currentSet)?.title}</strong>?
                </p>
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2 font-medium">
                  ℹ️ Xóa đề thi không làm mất câu hỏi trong Ngân hàng câu hỏi của bài học.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteSetConfirm(false);
                    setDeletingExamItem(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDeleteExam}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-red-200"
                >
                  Xóa đề thi
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Print / Export Exam Modal */}
      {showPrintModal &&
        currentSet &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">In Đề Thi & Đáp Án</h3>
                  <p className="text-xs text-slate-500">{currentSet.title} - {lesson.title}</p>
                </div>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Printable Content Preview */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-6 text-xs text-slate-800 font-serif">
                <div className="text-center border-b border-slate-300 pb-4 font-sans">
                  <div className="text-xs font-bold uppercase text-slate-500">ĐỀ KIỂM TRA ĐÁNH GIÁ</div>
                  <h2 className="text-base font-black text-slate-900 mt-1">{lesson.title.toUpperCase()}</h2>
                  <div className="text-xs text-slate-600 mt-0.5">Bộ đề: {currentSet.title} | Tổng số câu: {currentExamQuestions.length} câu | Thời gian: {Math.round((currentExamQuestions.length * (currentSet.timePerQuestion || 30)) / 60)} phút</div>
                </div>

                <div className="space-y-4">
                  {currentExamQuestions.map((q, idx) => (
                    <div key={q.id} className="space-y-1.5 font-sans">
                      <div className="font-bold text-slate-900">
                        Câu {idx + 1}: <MathRenderer text={q.content} />
                      </div>

                      {(q.diagram || q.tableData || q.imageUrl) && (
                        <div className="my-2">
                          <MathDiagramView diagram={q.diagram} tableData={q.tableData} imageUrl={q.imageUrl} />
                        </div>
                      )}

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 pl-4 text-xs">
                          {q.options.map((opt) => (
                            <div key={opt.key}>
                              <strong>{opt.key}.</strong> <MathRenderer text={opt.text} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-sans">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-blue-200"
                >
                  <Printer className="w-4 h-4" />
                  <span>In ra máy in / PDF</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* View Exam Details Modal */}
      {viewingExamSet &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>XEM CHI TIẾT ĐỀ THI</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">{viewingExamSet.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {(viewingExamSet.questionIds?.length || viewingExamSet.questions?.length || 0)} câu hỏi • Thời gian: {Math.round(((viewingExamSet.questionIds?.length || viewingExamSet.questions?.length || 0) * (viewingExamSet.timePerQuestion || 30)) / 60)} phút • {lesson.title}
                </p>
              </div>
              <button
                onClick={() => setViewingExamSet(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {resolveExamQuestions(viewingExamSet, questionBank).map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          q.cognitiveLevel === 'Nhận biết'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : q.cognitiveLevel === 'Thông hiểu'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {q.cognitiveLevel || 'Thông hiểu'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200 text-slate-700">
                        {q.questionType === 'true-false'
                          ? 'Đúng / Sai'
                          : q.questionType === 'short-answer'
                          ? 'Trả lời ngắn'
                          : 'Trắc nghiệm ABCD'}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-slate-900 leading-relaxed">
                    <MathRenderer text={q.content} />
                  </div>

                  {(q.diagram || q.tableData || q.imageUrl) && (
                    <div className="my-2">
                      <MathDiagramView
                        diagram={q.diagram}
                        tableData={q.tableData}
                        imageUrl={q.imageUrl}
                      />
                    </div>
                  )}

                  {q.shortAnswerKey && (
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 font-medium flex items-center gap-2">
                      <span className="font-bold">Đáp án ngắn:</span>
                      <code className="px-2 py-0.5 bg-white rounded-md font-bold text-purple-700 border border-purple-300">
                        {q.shortAnswerKey}
                      </code>
                    </div>
                  )}

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt) => {
                        const isCorrect = opt.key === q.correctAnswer;
                        return (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                              isCorrect
                                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-semibold shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <div className="min-w-0 flex-1 leading-snug">
                              <MathRenderer text={opt.text} />
                            </div>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 ml-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
                      <span className="font-bold text-indigo-900">Lời giải chi tiết: </span>
                      <MathRenderer text={q.explanation} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingExamSet(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewingExamSet(null);
                    setShowPrintModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In đề này</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const set = viewingExamSet;
                    setViewingExamSet(null);
                    handleOpenEditMeta(set);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-blue-200"
                >
                  <Settings2 className="w-4 h-4" />
                  <span>Sửa thông tin đề</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
