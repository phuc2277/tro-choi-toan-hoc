import React, { useState, useMemo } from 'react';
import {
  Lesson,
  QuestionSetItem,
  ExtendedQuestionItem,
  CognitiveLevel,
  QuestionType,
} from '../../types/teacherLesson';
import { GameRegistry } from '../../games/registry/GameRegistry';
import { LessonGameMetadata } from '../../games/types/LessonGame';
import { MathRenderer } from '../../games/components/MathRenderer';
import { QuestionEditorModal } from './QuestionEditorModal';
import { QuestionImportModal } from './QuestionImportModal';
import { calculateQuestionSetStats } from '../../data/teacherLessonData';
import {
  Gamepad2,
  Sparkles,
  UploadCloud,
  Plus,
  Minus,
  Play,
  Edit3,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Layers,
  ChevronDown,
  FileQuestion,
  HelpCircle,
  Award,
  Swords,
  Flame,
  Clock,
  Search,
  Check,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface QuestionSetTabProps {
  lesson: Lesson;
  onUpdateLesson: (updatedLesson: Lesson) => void;
  onLaunchGame: (gameCode: string, questionSet: QuestionSetItem) => void;
}

export const QuestionSetTab: React.FC<QuestionSetTabProps> = ({
  lesson,
  onUpdateLesson,
  onLaunchGame,
}) => {
  // Selected Question Set ID
  const [selectedSetId, setSelectedSetId] = useState<string>(
    lesson.questionSets[0]?.id || ''
  );

  // Selected Game Code from Registry
  const [selectedGameCode, setSelectedGameCode] = useState<string>('GESTURE_QUIZ_AI');

  // Modals & Panels
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExtendedQuestionItem | null>(null);
  const [regeneratingQuestionId, setRegeneratingQuestionId] = useState<string | null>(null);
  const [showDeleteSetConfirm, setShowDeleteSetConfirm] = useState(false);

  // AI Form States - Direct counts per question type
  const [aiMultipleChoiceCount, setAiMultipleChoiceCount] = useState<number>(6);
  const [aiTrueFalseCount, setAiTrueFalseCount] = useState<number>(3);
  const [aiShortAnswerCount, setAiShortAnswerCount] = useState<number>(1);
  const [aiCognitiveLevels, setAiCognitiveLevels] = useState<CognitiveLevel[]>([
    'Nhận biết',
    'Thông hiểu',
    'Vận dụng',
  ]);
  const [aiTeacherNotes, setAiTeacherNotes] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Computed total questions
  const totalAiCount = useMemo(() => {
    const mc = Math.max(0, Number(aiMultipleChoiceCount) || 0);
    const tf = Math.max(0, Number(aiTrueFalseCount) || 0);
    const sa = Math.max(0, Number(aiShortAnswerCount) || 0);
    return mc + tf + sa;
  }, [aiMultipleChoiceCount, aiTrueFalseCount, aiShortAnswerCount]);

  // Retrieve current active question set
  const currentSet = useMemo(() => {
    return (
      lesson.questionSets.find((s) => s.id === selectedSetId) ||
      lesson.questionSets[0] ||
      null
    );
  }, [lesson.questionSets, selectedSetId]);

  // Dynamically query all games available in Game Engine
  const allRegisteredGames: LessonGameMetadata[] = useMemo(() => {
    return GameRegistry.getAllGames();
  }, []);

  const selectedGameMeta = useMemo(() => {
    return (
      allRegisteredGames.find((g) => g.code === selectedGameCode) ||
      allRegisteredGames[0]
    );
  }, [allRegisteredGames, selectedGameCode]);

  // 1. AI Generate Question Set Handler
  const handleGenerateAiQuestionSet = async () => {
    if (totalAiCount <= 0) {
      setAiError('Vui lòng điền số lượng câu hỏi (lớn hơn 0) cho ít nhất một dạng câu hỏi.');
      return;
    }
    if (aiCognitiveLevels.length === 0) {
      setAiError('Vui lòng chọn ít nhất một cấp độ nhận thức để phân bổ.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    const activeQuestionTypes: QuestionType[] = [];
    if (aiMultipleChoiceCount > 0) activeQuestionTypes.push('multiple-choice');
    if (aiTrueFalseCount > 0) activeQuestionTypes.push('true-false');
    if (aiShortAnswerCount > 0) activeQuestionTypes.push('short-answer');

    try {
      const response = await fetch('/api/ai/generate-question-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: lesson.title,
          subject: lesson.subject,
          grade: lesson.grade,
          count: totalAiCount,
          multipleChoiceCount: Math.max(0, Number(aiMultipleChoiceCount) || 0),
          trueFalseCount: Math.max(0, Number(aiTrueFalseCount) || 0),
          shortAnswerCount: Math.max(0, Number(aiShortAnswerCount) || 0),
          questionTypes: activeQuestionTypes,
          cognitiveLevels: aiCognitiveLevels,
          teacherNotes: aiTeacherNotes,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lỗi tạo câu hỏi AI');

      const rawQuestions = data.questions || [];
      const formattedQuestions: ExtendedQuestionItem[] = rawQuestions.map(
        (q: any, idx: number) => ({
          id: `q-ai-${Date.now()}-${idx}`,
          subject: lesson.subject,
          grade: lesson.grade,
          lessonTitle: lesson.title,
          content: q.content,
          questionType: q.questionType || 'multiple-choice',
          cognitiveLevel: q.cognitiveLevel || 'Thông hiểu',
          options: q.options || [],
          correctAnswer: q.correctAnswer || 'A',
          shortAnswerKey: q.shortAnswerKey,
          explanation: q.explanation,
        })
      );

      const stats = calculateQuestionSetStats(formattedQuestions);

      const newQuestionSet: QuestionSetItem = {
        id: `qs-ai-${Date.now()}`,
        title: `Bộ đề AI (${formattedQuestions.length} câu) - ${lesson.shortTitle}`,
        description: `Tạo tự động bởi Gemini (${aiMultipleChoiceCount} Nhiều lựa chọn, ${aiTrueFalseCount} Đúng/Sai, ${aiShortAnswerCount} Trả lời ngắn)`,
        type: 'custom',
        createdAt: Date.now(),
        questionCount: formattedQuestions.length,
        questions: formattedQuestions,
        stats,
      };

      const updated = {
        ...lesson,
        questionSets: [newQuestionSet, ...lesson.questionSets],
      };

      onUpdateLesson(updated);
      setSelectedSetId(newQuestionSet.id);
      setIsAiModalOpen(false);
      setAiTeacherNotes('');
    } catch (err: any) {
      setAiError(err.message || 'Không thể tạo bộ câu hỏi AI');
    } finally {
      setIsAiLoading(false);
    }
  };

  // 2. AI Regenerate Single Question Handler
  const handleRegenerateSingleQuestion = async (q: ExtendedQuestionItem) => {
    if (!currentSet) return;
    setRegeneratingQuestionId(q.id);

    try {
      const response = await fetch('/api/ai/regenerate-single-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: lesson.title,
          subject: lesson.subject,
          grade: lesson.grade,
          cognitiveLevel: q.cognitiveLevel || 'Thông hiểu',
          questionType: q.questionType || 'multiple-choice',
          oldQuestionContent: q.content,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lỗi tạo lại câu hỏi');

      const newQ = data.question;
      if (newQ) {
        const replaced: ExtendedQuestionItem = {
          id: `q-regen-${Date.now()}`,
          subject: lesson.subject,
          grade: lesson.grade,
          lessonTitle: lesson.title,
          content: newQ.content,
          questionType: newQ.questionType || q.questionType,
          cognitiveLevel: newQ.cognitiveLevel || q.cognitiveLevel,
          options: newQ.options || q.options,
          correctAnswer: newQ.correctAnswer || 'A',
          shortAnswerKey: newQ.shortAnswerKey,
          explanation: newQ.explanation,
        };

        const updatedQuestions = currentSet.questions.map((item) =>
          item.id === q.id ? replaced : item
        );

        const updatedSet: QuestionSetItem = {
          ...currentSet,
          questions: updatedQuestions,
          stats: calculateQuestionSetStats(updatedQuestions),
        };

        const updatedLesson = {
          ...lesson,
          questionSets: lesson.questionSets.map((s) =>
            s.id === currentSet.id ? updatedSet : s
          ),
        };

        onUpdateLesson(updatedLesson);
      }
    } catch (err: any) {
      alert(`Không thể tạo lại câu hỏi: ${err.message}`);
    } finally {
      setRegeneratingQuestionId(null);
    }
  };

  // 3. Save Edited or New Question Handler
  const handleSaveQuestion = (savedQ: ExtendedQuestionItem) => {
    if (!currentSet) return;

    const exists = currentSet.questions.some((q) => q.id === savedQ.id);
    let updatedQuestions: ExtendedQuestionItem[];

    if (exists) {
      updatedQuestions = currentSet.questions.map((q) =>
        q.id === savedQ.id ? savedQ : q
      );
    } else {
      updatedQuestions = [...currentSet.questions, savedQ];
    }

    const updatedSet: QuestionSetItem = {
      ...currentSet,
      questionCount: updatedQuestions.length,
      questions: updatedQuestions,
      stats: calculateQuestionSetStats(updatedQuestions),
    };

    const updatedLesson = {
      ...lesson,
      questionSets: lesson.questionSets.map((s) =>
        s.id === currentSet.id ? updatedSet : s
      ),
    };

    onUpdateLesson(updatedLesson);
  };

  // 4. Delete Single Question Handler
  const handleDeleteQuestion = (qId: string) => {
    if (!currentSet) return;
    const updatedQuestions = currentSet.questions.filter((q) => q.id !== qId);

    const updatedSet: QuestionSetItem = {
      ...currentSet,
      questionCount: updatedQuestions.length,
      questions: updatedQuestions,
      stats: calculateQuestionSetStats(updatedQuestions),
    };

    const updatedLesson = {
      ...lesson,
      questionSets: lesson.questionSets.map((s) =>
        s.id === currentSet.id ? updatedSet : s
      ),
    };

    onUpdateLesson(updatedLesson);
  };

  // 5. Delete Entire Question Set Handler
  const handleDeleteCurrentSet = () => {
    if (!currentSet) return;
    const remaining = lesson.questionSets.filter((s) => s.id !== currentSet.id);
    const updatedLesson = { ...lesson, questionSets: remaining };
    onUpdateLesson(updatedLesson);
    setSelectedSetId(remaining[0]?.id || '');
    setShowDeleteSetConfirm(false);
  };

  // 6. Import Questions Handler
  const handleImportQuestions = (
    importedQuestions: ExtendedQuestionItem[]
  ) => {
    const stats = calculateQuestionSetStats(importedQuestions);
    const newSet: QuestionSetItem = {
      id: `qs-import-${Date.now()}`,
      title: `Đề nhập (${importedQuestions.length} câu)`,
      description: `Được nạp từ tệp đề thi`,
      type: 'custom',
      createdAt: Date.now(),
      questionCount: importedQuestions.length,
      questions: importedQuestions,
      stats,
    };

    const updatedLesson = {
      ...lesson,
      questionSets: [newSet, ...lesson.questionSets],
    };

    onUpdateLesson(updatedLesson);
    setSelectedSetId(newSet.id);
  };

  // Preset helper
  const applyPresetCounts = (mc: number, tf: number, sa: number) => {
    setAiMultipleChoiceCount(mc);
    setAiTrueFalseCount(tf);
    setAiShortAnswerCount(sa);
    setAiError(null);
  };

  const toggleAiLevel = (level: CognitiveLevel) => {
    setAiCognitiveLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  return (
    <div className="space-y-8">
      {/* ======================================================== */}
      {/* BƯỚC 1: TẠO ĐỀ TRÒ CHƠI (Question Set Creation & Management) */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <span>BƯỚC 1</span>
              <span>•</span>
              <span>TẠO & QUẢN LÝ ĐỀ TRÒ CHƠI</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Quản lý Bộ câu hỏi & Quyền kiểm soát của Giáo viên
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tạo đề tự động bằng AI, nạp file từ máy tính hoặc tự biên soạn. Giáo viên có quyền sửa, tạo lại từng câu và điều chỉnh đáp án.
            </p>
          </div>

          {/* Quick Creation Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-ai-create-question-set"
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>🤖 AI tạo đề trò chơi</span>
            </button>

            <button
              id="btn-import-file-question-set"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>📤 Đưa lên từ máy tính</span>
            </button>

            <button
              id="btn-manual-add-question"
              onClick={() => {
                setEditingQuestion(null);
                setIsEditorModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>➕ Thêm câu hỏi</span>
            </button>
          </div>
        </div>

        {/* Question Sets Tabs & Selector */}
        {lesson.questionSets.length > 0 ? (
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                  Chọn bộ đề:
                </span>
                {lesson.questionSets.map((qs) => {
                  const isSelected = qs.id === selectedSetId;
                  return (
                    <button
                      key={qs.id}
                      id={`select-qs-${qs.id}`}
                      onClick={() => setSelectedSetId(qs.id)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{qs.title}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {qs.questions?.length || 0} câu
                      </span>
                    </button>
                  );
                })}
              </div>

              {currentSet && (
                <button
                  onClick={() => setShowDeleteSetConfirm(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-red-600 hover:bg-red-50 border border-red-200 shrink-0 transition"
                  title="Xóa toàn bộ bộ đề này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa bộ đề</span>
                </button>
              )}
            </div>

            {/* Current Active Question Set Details & Stats */}
            {currentSet && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {currentSet.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentSet.description || 'Bộ câu hỏi chuẩn kiến thức bài học'}
                    </p>
                  </div>

                  {/* Cognitive level distribution stats badges */}
                  {currentSet.stats && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Nhận biết: <strong>{currentSet.stats.recognition}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800">
                        Thông hiểu: <strong>{currentSet.stats.understanding}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-800">
                        Vận dụng: <strong>{currentSet.stats.application}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Questions List & Teacher Control Panel */}
            {currentSet && currentSet.questions && currentSet.questions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <span>Danh sách chi tiết từng câu hỏi ({currentSet.questions.length} câu):</span>
                  <span>Quyền kiểm soát: Sửa • Tạo lại câu (AI) • Xóa</span>
                </div>

                <div className="space-y-3">
                  {currentSet.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      id={`question-item-${q.id}`}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all duration-150 space-y-3 shadow-xs"
                    >
                      {/* Question Header: Badges & Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>

                          {/* Cognitive Level Badge */}
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

                          {/* Question Type Badge */}
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                            {q.questionType === 'true-false'
                              ? 'Đúng / Sai'
                              : q.questionType === 'short-answer'
                              ? 'Trả lời ngắn'
                              : 'Trắc nghiệm 4 lựa chọn'}
                          </span>
                        </div>

                        {/* Control Actions: Edit, Regenerate Single, Delete */}
                        <div className="flex items-center gap-2">
                          {/* Sửa câu hỏi */}
                          <button
                            id={`edit-question-btn-${q.id}`}
                            onClick={() => {
                              setEditingQuestion(q);
                              setIsEditorModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold transition cursor-pointer"
                            title="Sửa câu hỏi này"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </button>

                          {/* Tạo lại một câu bằng AI */}
                          <button
                            id={`regen-question-btn-${q.id}`}
                            disabled={regeneratingQuestionId === q.id}
                            onClick={() => handleRegenerateSingleQuestion(q)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            title="AI tạo lại câu này với cùng mức độ nhận thức"
                          >
                            {regeneratingQuestionId === q.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            <span>Tạo lại câu này (AI)</span>
                          </button>

                          {/* Xóa câu */}
                          <button
                            id={`delete-question-btn-${q.id}`}
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Xóa câu hỏi này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                        <MathRenderer text={q.content} />
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt) => {
                          const isCorrect = opt.key === q.correctAnswer;
                          return (
                            <div
                              key={opt.key}
                              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                                isCorrect
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold ring-1 ring-emerald-400/30'
                                  : 'bg-slate-50/60 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className="flex-1">
                                <MathRenderer text={opt.text} />
                              </span>
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-100 flex items-start gap-2">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <strong>Lời giải thích:</strong> <MathRenderer text={q.explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">
                <FileQuestion className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold">Bộ đề hiện chưa có câu hỏi</p>
                <p className="text-xs mt-1">
                  Nhấn "AI tạo đề trò chơi" hoặc "Thêm câu hỏi" để bổ sung câu hỏi.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
            <p className="text-sm font-bold">Chưa có bộ đề nào cho bài học này</p>
            <p className="text-xs mt-1 mb-4">
              Hãy dùng AI tạo tự động bộ câu hỏi chuẩn GDPT 2018.
            </p>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI tạo đề ngay</span>
            </button>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* BƯỚC 2: TRÒ CHƠI (Tích hợp Game Engine hiện có)            */}
      {/* ======================================================== */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-900/50">
        {/* Step Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>BƯỚC 2</span>
              <span>•</span>
              <span>TÍCH HỢP GAME ENGINE HIỆN CÓ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Chọn Trò chơi & Khởi chạy với Bộ đề đã chọn
            </h2>
            <p className="text-xs text-indigo-200/80 mt-1">
              Tất cả các trò chơi dùng chung Question Set đã chọn. Hệ thống tự động chuyển đổi định dạng và truyền vào Game Engine.
            </p>
          </div>

          {/* Direct Launch Control Bar */}
          {currentSet && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Dropdown Select Game */}
              <div className="relative">
                <select
                  id="game-selector-dropdown"
                  value={selectedGameCode}
                  onChange={(e) => setSelectedGameCode(e.target.value)}
                  className="appearance-none pl-4 pr-9 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {allRegisteredGames.map((game) => (
                    <option key={game.code} value={game.code}>
                      🎮 {game.name} ({game.badge || 'Tương tác'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Main Launch Button */}
              <button
                id="btn-main-launch-game"
                onClick={() => onLaunchGame(selectedGameCode, currentSet)}
                className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/30 transition transform active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>▶ Mở trò chơi</span>
              </button>
            </div>
          )}
        </div>

        {/* Selected Game Info Callout */}
        {selectedGameMeta && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg">
                🎮
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    {selectedGameMeta.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                    Mã: {selectedGameMeta.code}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedGameMeta.description}
                </p>
              </div>
            </div>

            <div className="text-xs text-indigo-200">
              Bộ đề nạp: <strong className="text-white font-bold">{currentSet?.title || 'Chưa chọn'}</strong> ({currentSet?.questions.length || 0} câu)
            </div>
          </div>
        )}

        {/* Bento Grid of All Games from Game Registry */}
        <div>
          <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-4">
            Danh mục {allRegisteredGames.length} trò chơi có sẵn trong Game Engine:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allRegisteredGames.map((game) => {
              const isSelected = game.code === selectedGameCode;
              return (
                <div
                  key={game.code}
                  id={`game-card-${game.code}`}
                  onClick={() => setSelectedGameCode(game.code)}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-400 ring-2 ring-indigo-400/40 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-indigo-200">
                        {game.badge ? `🔥 ${game.badge}` : '⭐ Luyện tập'}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                          Đang chọn
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white mb-1">
                      {game.name}
                    </h4>

                    <p className="text-xs text-slate-300 line-clamp-2 mb-4">
                      {game.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Tương thích 100% câu hỏi
                    </span>

                    <button
                      id={`play-now-btn-${game.code}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentSet) {
                          onLaunchGame(game.code, currentSet);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Chơi ngay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MODALS: AI Create, Import, Edit, Delete Confirm            */}
      {/* ======================================================== */}

      {/* 1. Modal AI Create Question Set */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    AI Tạo Bộ Đề Trò Chơi
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lesson.title} ({lesson.subject} Lớp {lesson.grade})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Question Types & Counts configuration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Số lượng câu hỏi theo từng dạng
                  </label>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Tổng: {totalAiCount} câu
                  </span>
                </div>

                {/* 3 Question Type Cards */}
                <div className="space-y-2.5">
                  {/* 1. Multiple Choice */}
                  <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 hover:border-indigo-200 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                        ABCD
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          Nhiều lựa chọn (A, B, C, D)
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          Trắc nghiệm 4 phương án, 1 đáp án đúng
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setAiMultipleChoiceCount((c) => Math.max(0, (Number(c) || 0) - 1))
                        }
                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        title="Giảm 1 câu"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={aiMultipleChoiceCount}
                        onChange={(e) =>
                          setAiMultipleChoiceCount(
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-14 h-7 text-center text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAiMultipleChoiceCount((c) => Math.min(50, (Number(c) || 0) + 1))
                        }
                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        title="Tăng 1 câu"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-slate-500 font-medium w-6 text-right">câu</span>
                    </div>
                  </div>

                  {/* 2. True / False */}
                  <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 hover:border-indigo-200 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                        Đ/S
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          Đúng - sai
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          Trắc nghiệm 2 phương án (Đúng / Sai)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setAiTrueFalseCount((c) => Math.max(0, (Number(c) || 0) - 1))
                        }
                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        title="Giảm 1 câu"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={aiTrueFalseCount}
                        onChange={(e) =>
                          setAiTrueFalseCount(
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-14 h-7 text-center text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAiTrueFalseCount((c) => Math.min(50, (Number(c) || 0) + 1))
                        }
                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        title="Tăng 1 câu"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-slate-500 font-medium w-6 text-right">câu</span>
                    </div>
                  </div>

                  {/* 3. Short Answer */}
                  <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 hover:border-indigo-200 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                        TLN
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          Trả lời ngắn
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          Điền đáp số / Tự luận ngắn kết hợp trắc nghiệm
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setAiShortAnswerCount((c) => Math.max(0, (Number(c) || 0) - 1))
                        }
                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        title="Giảm 1 câu"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={aiShortAnswerCount}
                        onChange={(e) =>
                          setAiShortAnswerCount(
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-14 h-7 text-center text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAiShortAnswerCount((c) => Math.min(50, (Number(c) || 0) + 1))
                        }
                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        title="Tăng 1 câu"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-slate-500 font-medium w-6 text-right">câu</span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-medium">Gợi ý nhanh:</span>
                  <button
                    type="button"
                    onClick={() => applyPresetCounts(6, 3, 1)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition cursor-pointer"
                  >
                    Chuẩn 10 câu (6 - 3 - 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetCounts(9, 4, 2)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition cursor-pointer"
                  >
                    Đề 15 câu (9 - 4 - 2)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetCounts(12, 5, 3)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition cursor-pointer"
                  >
                    Đề 20 câu (12 - 5 - 3)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetCounts(10, 0, 0)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition cursor-pointer"
                  >
                    Chỉ 10 TN
                  </button>
                </div>
              </div>

              {/* Cognitive Levels */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cấp độ nhận thức phân bổ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Nhận biết', label: '1. Nhận biết' },
                    { id: 'Thông hiểu', label: '2. Thông hiểu' },
                    { id: 'Vận dụng', label: '3. Vận dụng' },
                    { id: 'Vận dụng cao', label: '4. Vận dụng cao' },
                  ].map((lvl) => {
                    const isChecked = aiCognitiveLevels.includes(lvl.id as CognitiveLevel);
                    return (
                      <label
                        key={lvl.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAiLevel(lvl.id as CognitiveLevel)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded"
                        />
                        <span>{lvl.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Teacher custom notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Yêu cầu bổ sung của Thầy/Cô
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Tăng cường các câu hỏi liên quan đến thu gọn đơn thức đồng dạng..."
                  value={aiTeacherNotes}
                  onChange={(e) => setAiTeacherNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                />
              </div>

              {aiError && (
                <div className="p-3 rounded-xl bg-red-100 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  id="btn-submit-ai-questions"
                  disabled={isAiLoading || totalAiCount === 0}
                  onClick={handleGenerateAiQuestionSet}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-200 transition cursor-pointer"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini đang soạn {totalAiCount} câu...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Tạo bộ đề ngay ({totalAiCount} câu)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Question Editor */}
      {isEditorModalOpen && (
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

      {/* 3. Modal Question Import */}
      {isImportModalOpen && (
        <QuestionImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          lessonTitle={lesson.title}
          subject={lesson.subject}
          grade={lesson.grade}
          onImportQuestions={handleImportQuestions}
        />
      )}

      {/* 4. Modal Confirm Delete Entire Set */}
      {showDeleteSetConfirm && currentSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xác nhận xóa bộ đề?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Thầy/Cô có chắc chắn muốn xóa bộ đề "{currentSet.title}" gồm {currentSet.questions.length} câu không?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteSetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCurrentSet}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md shadow-red-200"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
