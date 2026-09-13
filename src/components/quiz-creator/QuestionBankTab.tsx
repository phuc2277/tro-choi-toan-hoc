import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Lesson,
  QuestionSetItem,
  ExtendedQuestionItem,
  CognitiveLevel,
  QuestionType,
} from '../../types/teacherLesson';
import { QuizOptionKeyEnum } from '../../games/types/GameEnums';
import { MathRenderer } from '../../games/components/MathRenderer';
import { MathDiagramView } from '../../games/components/MathDiagramView';
import { QuestionEditorModal } from './QuestionEditorModal';
import { QuestionImportModal } from './QuestionImportModal';
import { QuestionBankAiModal } from './QuestionBankAiModal';
import { getLessonQuestionBank, calculateQuestionSetStats } from '../../data/teacherLessonData';
import {
  Database,
  Search,
  Plus,
  Minus,
  Edit3,
  RefreshCw,
  Trash2,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  Sparkles,
  Loader2,
  CheckSquare,
  FolderPlus,
  Shuffle,
  Check,
  X,
  UploadCloud,
  Layers,
  ArrowRight,
  Hash,
  Download,
} from 'lucide-react';

interface QuestionBankTabProps {
  lesson: Lesson;
  onUpdateLesson: (updatedLesson: Lesson) => void;
  onNavigateToCreateExam?: (newSetId?: string) => void;
  onNavigateToGames?: (selectedSetId?: string) => void;
}

export const QuestionBankTab: React.FC<QuestionBankTabProps> = ({
  lesson,
  onUpdateLesson,
  onNavigateToCreateExam,
  onNavigateToGames,
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Selected Question IDs for batch operations
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Modals & States
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExtendedQuestionItem | null>(null);
  const [regeneratingQuestionId, setRegeneratingQuestionId] = useState<string | null>(null);

  // AI Form States for Question Bank Generation
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

  // Create Set from Selection Modal
  const [isCreateSetFromSelectionOpen, setIsCreateSetFromSelectionOpen] = useState(false);
  const [newSetNameFromSelection, setNewSetNameFromSelection] = useState('');

  // Source of truth: dedicated Question Bank for this lesson
  const allBankQuestions = useMemo(() => {
    return getLessonQuestionBank(lesson);
  }, [lesson]);

  // Total AI Question Count
  const totalAiCount = useMemo(() => {
    const mc = Math.max(0, Number(aiMultipleChoiceCount) || 0);
    const tf = Math.max(0, Number(aiTrueFalseCount) || 0);
    const sa = Math.max(0, Number(aiShortAnswerCount) || 0);
    return mc + tf + sa;
  }, [aiMultipleChoiceCount, aiTrueFalseCount, aiShortAnswerCount]);

  // Bank Statistics
  const bankStats = useMemo(() => {
    const total = allBankQuestions.length;
    const recognition = allBankQuestions.filter(
      (q) => q.cognitiveLevel === 'Nhận biết'
    ).length;
    const understanding = allBankQuestions.filter(
      (q) => q.cognitiveLevel === 'Thông hiểu'
    ).length;
    const application = allBankQuestions.filter(
      (q) => q.cognitiveLevel === 'Vận dụng' || q.cognitiveLevel === 'Vận dụng cao'
    ).length;
    const advanced = allBankQuestions.filter(
      (q) => q.cognitiveLevel === 'Vận dụng cao'
    ).length;

    const multipleChoice = allBankQuestions.filter(
      (q) => !q.questionType || q.questionType === 'multiple-choice'
    ).length;
    const trueFalse = allBankQuestions.filter(
      (q) => q.questionType === 'true-false'
    ).length;
    const shortAnswer = allBankQuestions.filter(
      (q) => q.questionType === 'short-answer'
    ).length;

    return {
      total,
      recognition,
      understanding,
      application,
      advanced,
      multipleChoice,
      trueFalse,
      shortAnswer,
    };
  }, [allBankQuestions]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return allBankQuestions.filter((q) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchContent = q.content?.toLowerCase().includes(query);
        const matchExplanation = q.explanation?.toLowerCase().includes(query);
        const matchOption = q.options?.some((opt) =>
          opt.text?.toLowerCase().includes(query)
        );
        const matchKey = q.shortAnswerKey?.toLowerCase().includes(query);

        if (!matchContent && !matchExplanation && !matchOption && !matchKey) {
          return false;
        }
      }

      // 2. Cognitive Level Filter
      if (selectedLevelFilter !== 'all') {
        if (q.cognitiveLevel !== selectedLevelFilter) {
          return false;
        }
      }

      // 3. Question Type Filter
      if (selectedTypeFilter !== 'all') {
        const type = q.questionType || 'multiple-choice';
        if (type !== selectedTypeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [allBankQuestions, searchQuery, selectedLevelFilter, selectedTypeFilter]);

  // Select / Deselect All
  const handleToggleSelectAll = () => {
    if (selectedQuestionIds.length === filteredQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(filteredQuestions.map((q) => q.id));
    }
  };

  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 1. Save / Edit Question in Bank
  const handleSaveQuestion = (savedQ: ExtendedQuestionItem) => {
    const currentBank = getLessonQuestionBank(lesson);
    const exists = currentBank.some((q) => q.id === savedQ.id);

    let updatedBank: ExtendedQuestionItem[];
    if (exists) {
      updatedBank = currentBank.map((q) => (q.id === savedQ.id ? savedQ : q));
    } else {
      updatedBank = [savedQ, ...currentBank];
    }

    // Update any question sets that have this question embedded
    const updatedSets = (lesson.questionSets || []).map((qs) => {
      const hasQ = (qs.questions || []).some((q) => q.id === savedQ.id);
      if (hasQ) {
        const newQs = qs.questions.map((q) => (q.id === savedQ.id ? savedQ : q));
        return {
          ...qs,
          questions: newQs,
          stats: calculateQuestionSetStats(newQs),
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

  // 2. Delete Question from Bank
  const handleDeleteQuestion = (questionId: string) => {
    if (!window.confirm('Thầy/Cô có chắc muốn xóa câu hỏi này khỏi Ngân hàng câu hỏi?')) {
      return;
    }

    const currentBank = getLessonQuestionBank(lesson);
    const updatedBank = currentBank.filter((q) => q.id !== questionId);

    // Remove from referencing question sets
    const updatedSets = (lesson.questionSets || []).map((qs) => {
      const updatedQuestions = (qs.questions || []).filter((q) => q.id !== questionId);
      const updatedIds = (qs.questionIds || []).filter((id) => id !== questionId);
      return {
        ...qs,
        questionIds: updatedIds,
        questions: updatedQuestions,
        questionCount: updatedQuestions.length,
        stats: calculateQuestionSetStats(updatedQuestions),
      };
    });

    setSelectedQuestionIds((prev) => prev.filter((id) => id !== questionId));

    onUpdateLesson({
      ...lesson,
      questionBank: updatedBank,
      questionSets: updatedSets,
    });
  };

  // 3. AI Regenerate Question in Bank
  const handleRegenerateQuestion = async (q: ExtendedQuestionItem) => {
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

        const currentBank = getLessonQuestionBank(lesson);
        const updatedBank = currentBank.map((item) => (item.id === q.id ? replaced : item));

        const updatedSets = (lesson.questionSets || []).map((qs) => {
          const hasQ = (qs.questions || []).some((item) => item.id === q.id);
          if (hasQ) {
            const updatedQuestions = qs.questions.map((item) =>
              item.id === q.id ? replaced : item
            );
            const updatedIds = (qs.questionIds || []).map((id) =>
              id === q.id ? replaced.id : id
            );
            return {
              ...qs,
              questionIds: updatedIds,
              questions: updatedQuestions,
              stats: calculateQuestionSetStats(updatedQuestions),
            };
          }
          return qs;
        });

        onUpdateLesson({
          ...lesson,
          questionBank: updatedBank,
          questionSets: updatedSets,
        });
      }
    } catch (err: any) {
      alert(`Không thể tạo lại câu hỏi: ${err.message}`);
    } finally {
      setRegeneratingQuestionId(null);
    }
  };

  // 4. AI Generate Multiple Questions Directly into Bank
  const handleGenerateAiToBank = async () => {
    if (totalAiCount <= 0) {
      setAiError('Vui lòng chọn số lượng câu hỏi lớn hơn 0.');
      return;
    }
    if (aiCognitiveLevels.length === 0) {
      setAiError('Vui lòng chọn ít nhất một cấp độ nhận thức.');
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
      if (!response.ok) {
        let msg = data.error || 'Lỗi tạo câu hỏi AI';
        if (typeof msg === 'object') msg = msg.message || JSON.stringify(msg);
        throw new Error(msg);
      }

      const rawQuestions = data.questions || [];
      const formattedQuestions: ExtendedQuestionItem[] = rawQuestions.map(
        (q: any, idx: number) => ({
          id: `q-bank-ai-${Date.now()}-${idx}`,
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

      const currentBank = getLessonQuestionBank(lesson);
      const updatedBank = [...formattedQuestions, ...currentBank];

      onUpdateLesson({
        ...lesson,
        questionBank: updatedBank,
      });

      setIsAiModalOpen(false);
      setAiTeacherNotes('');
    } catch (err: any) {
      let errStr = err.message || 'Không thể tạo câu hỏi AI';
      if (errStr.includes('503') || errStr.includes('UNAVAILABLE')) {
        errStr = 'Máy chủ AI đang bận. Thầy/Cô có thể bấm thử lại hoặc sử dụng tính năng nạp từ kho chuẩn.';
      }
      setAiError(errStr);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Fallback generation for Bank when AI service is busy
  const handleGenerateStandardToBank = () => {
    const newQuestions: ExtendedQuestionItem[] = [];
    for (let i = 0; i < totalAiCount; i++) {
      const type: QuestionType =
        i < aiMultipleChoiceCount
          ? 'multiple-choice'
          : i < aiMultipleChoiceCount + aiTrueFalseCount
          ? 'true-false'
          : 'short-answer';
      const level = aiCognitiveLevels[i % aiCognitiveLevels.length] || 'Thông hiểu';

      if (type === 'true-false') {
        newQuestions.push({
          id: `q-std-bank-${Date.now()}-${i}`,
          subject: lesson.subject,
          grade: lesson.grade,
          lessonTitle: lesson.title,
          content: `Khẳng định sau về bài "${lesson.title}": [Mệnh đề lý thuyết số ${i + 1}] là đúng hay sai?`,
          questionType: 'true-false',
          cognitiveLevel: level,
          options: [
            { key: QuizOptionKeyEnum.A, text: 'Đúng' },
            { key: QuizOptionKeyEnum.B, text: 'Sai' },
          ],
          correctAnswer: i % 2 === 0 ? QuizOptionKeyEnum.A : QuizOptionKeyEnum.B,
          explanation: `Căn cứ kiến thức SGK ${lesson.subject} ${lesson.grade} bài ${lesson.title}, mệnh đề này là ${i % 2 === 0 ? 'đúng' : 'sai'}.`,
        });
      } else if (type === 'short-answer') {
        newQuestions.push({
          id: `q-std-bank-${Date.now()}-${i}`,
          subject: lesson.subject,
          grade: lesson.grade,
          lessonTitle: lesson.title,
          content: `Tính giá trị của biểu thức trong bài "${lesson.title}" khi $x = ${i + 2}$?`,
          questionType: 'short-answer',
          cognitiveLevel: level,
          options: [
            { key: QuizOptionKeyEnum.A, text: `${(i + 2) * 2}` },
            { key: QuizOptionKeyEnum.B, text: `${(i + 2) * 3}` },
            { key: QuizOptionKeyEnum.C, text: `${(i + 2) * 4}` },
            { key: QuizOptionKeyEnum.D, text: `${(i + 2) + 10}` },
          ],
          correctAnswer: QuizOptionKeyEnum.A,
          shortAnswerKey: `${(i + 2) * 2}`,
          explanation: `Thay $x = ${i + 2}$ vào công thức ta được kết quả là ${(i + 2) * 2}.`,
        });
      } else {
        newQuestions.push({
          id: `q-std-bank-${Date.now()}-${i}`,
          subject: lesson.subject,
          grade: lesson.grade,
          lessonTitle: lesson.title,
          content: `Trong bài học "${lesson.title}", khẳng định nào sau đây là chính xác? (Câu ${i + 1})`,
          questionType: 'multiple-choice',
          cognitiveLevel: level,
          options: [
            { key: QuizOptionKeyEnum.A, text: `Phương án chính xác theo SGK ${lesson.subject} ${lesson.grade}` },
            { key: QuizOptionKeyEnum.B, text: `Phương án gây nhiễu 1` },
            { key: QuizOptionKeyEnum.C, text: `Phương án gây nhiễu 2` },
            { key: QuizOptionKeyEnum.D, text: `Phương án chưa đúng` },
          ],
          correctAnswer: QuizOptionKeyEnum.A,
          explanation: `Theo SGK ${lesson.subject} ${lesson.grade} bài ${lesson.title}, đáp án A là chính xác.`,
        });
      }
    }

    const currentBank = getLessonQuestionBank(lesson);
    onUpdateLesson({
      ...lesson,
      questionBank: [...newQuestions, ...currentBank],
    });

    setIsAiModalOpen(false);
    setAiError(null);
  };

  // 5. Import Questions from File into Bank
  const handleImportToBank = (imported: ExtendedQuestionItem[]) => {
    const currentBank = getLessonQuestionBank(lesson);
    const updatedBank = [...imported, ...currentBank];

    onUpdateLesson({
      ...lesson,
      questionBank: updatedBank,
    });
    setIsImportModalOpen(false);
  };

  // 6. Create New Exam (QuestionSetItem) from Selected Bank Questions
  const handleCreateSetFromSelection = () => {
    if (selectedQuestionIds.length === 0) return;

    const chosenQuestions = allBankQuestions.filter((q) =>
      selectedQuestionIds.includes(q.id)
    );

    const title =
      newSetNameFromSelection.trim() ||
      `Đề chọn lọc (${chosenQuestions.length} câu) - ${lesson.shortTitle}`;

    const newSet: QuestionSetItem = {
      id: `qs-selected-${Date.now()}`,
      title,
      description: `Tạo từ ${chosenQuestions.length} câu hỏi chọn lọc trong Ngân hàng câu hỏi`,
      type: 'custom',
      createdAt: Date.now(),
      questionCount: chosenQuestions.length,
      questionIds: selectedQuestionIds,
      questions: chosenQuestions,
      stats: calculateQuestionSetStats(chosenQuestions),
    };

    const currentBank = getLessonQuestionBank(lesson);
    const updatedLesson = {
      ...lesson,
      questionBank: currentBank,
      questionSets: [newSet, ...(lesson.questionSets || [])],
    };

    onUpdateLesson(updatedLesson);
    setIsCreateSetFromSelectionOpen(false);
    setSelectedQuestionIds([]);
    setNewSetNameFromSelection('');

    if (onNavigateToCreateExam) {
      onNavigateToCreateExam(newSet.id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Top Banner & Bank Overview */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>3. NGÂN HÀNG CÂU HỎI BÀI HỌC</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Ngân hàng Câu hỏi
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Lưu trữ toàn bộ kho câu hỏi của bài học {lesson.title}. Cho phép thêm câu hỏi bằng AI, nhập từ file, tự soạn thủ công và tích chọn câu hỏi để tạo thành các Đề thi kiểm tra.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-ai-add-to-bank"
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>🤖 AI tạo câu hỏi vào kho</span>
            </button>

            <button
              id="btn-import-to-bank"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>📤 Đưa lên từ file</span>
            </button>

            <button
              id="btn-manual-add-to-bank"
              onClick={() => {
                setEditingQuestion(null);
                setIsEditorModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>➕ Soạn thủ công</span>
            </button>
          </div>
        </div>

        {/* Matrix & Type Distribution Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Tổng kho</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{bankStats.total}</div>
            <div className="text-[10px] text-slate-400">câu hỏi</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
            <div className="text-[11px] font-bold text-emerald-800 uppercase">Nhận biết</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{bankStats.recognition}</div>
            <div className="text-[10px] text-emerald-600">câu</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
            <div className="text-[11px] font-bold text-blue-800 uppercase">Thông hiểu</div>
            <div className="text-xl font-black text-blue-700 mt-0.5">{bankStats.understanding}</div>
            <div className="text-[10px] text-blue-600">câu</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-center">
            <div className="text-[11px] font-bold text-purple-800 uppercase">Vận dụng</div>
            <div className="text-xl font-black text-purple-700 mt-0.5">{bankStats.application}</div>
            <div className="text-[10px] text-purple-600">câu</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-[11px] font-bold text-slate-600 uppercase">Nhiều L.Chọn</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{bankStats.multipleChoice}</div>
            <div className="text-[10px] text-slate-400">4 đáp án</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-[11px] font-bold text-slate-600 uppercase">Đúng / Sai</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{bankStats.trueFalse}</div>
            <div className="text-[10px] text-slate-400">2 đáp án</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-[11px] font-bold text-slate-600 uppercase">Trả lời ngắn</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{bankStats.shortAnswer}</div>
            <div className="text-[10px] text-slate-400">Điền số</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo từ khóa câu hỏi, đáp án, công thức..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Multi-Filters: Level & Type */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Level Filter */}
          <select
            value={selectedLevelFilter}
            onChange={(e) => setSelectedLevelFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white outline-none cursor-pointer"
          >
            <option value="all">🎯 Tất cả cấp độ</option>
            <option value="Nhận biết">🌱 Nhận biết</option>
            <option value="Thông hiểu">📘 Thông hiểu</option>
            <option value="Vận dụng">🚀 Vận dụng</option>
            <option value="Vận dụng cao">🏆 Vận dụng cao</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white outline-none cursor-pointer"
          >
            <option value="all">📋 Tất cả dạng câu</option>
            <option value="multiple-choice">Trắc nghiệm ABCD</option>
            <option value="true-false">Đúng / Sai</option>
            <option value="short-answer">Trả lời ngắn</option>
          </select>

          {/* Select All Toggle */}
          <button
            onClick={handleToggleSelectAll}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedQuestionIds.length === filteredQuestions.length &&
              filteredQuestions.length > 0
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>
              {selectedQuestionIds.length === filteredQuestions.length &&
              filteredQuestions.length > 0
                ? 'Bỏ chọn tất cả'
                : `Chọn tất cả (${filteredQuestions.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Question List in Bank */}
      {filteredQuestions.length > 0 ? (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase px-1">
            <span>
              Tìm thấy {filteredQuestions.length} câu hỏi phù hợp ({selectedQuestionIds.length} câu đang chọn):
            </span>
            <span>Kho câu hỏi chuẩn GDPT 2018</span>
          </div>

          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => {
              const isSelected = selectedQuestionIds.includes(q.id);

              return (
                <div
                  key={q.id}
                  id={`bank-question-${q.id}`}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 space-y-3 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Header Row: Checkbox, Index, Badges, Action Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelectQuestion(q.id)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                            : 'bg-white border-slate-300 hover:border-emerald-400 text-transparent'
                        }`}
                        title={isSelected ? 'Bỏ chọn' : 'Tích chọn câu này để tạo Đề thi'}
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
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
                          : 'Trắc nghiệm ABCD'}
                      </span>
                    </div>

                    {/* Actions: Sửa, Tạo lại AI, Xóa */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setIsEditorModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        title="Chỉnh sửa nội dung câu hỏi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>

                      <button
                        disabled={regeneratingQuestionId === q.id}
                        onClick={() => handleRegenerateQuestion(q)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        title="AI tạo lại câu tương đương với cùng mức độ nhận thức"
                      >
                        {regeneratingQuestionId === q.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>AI câu tương đương</span>
                      </button>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Xóa câu hỏi khỏi ngân hàng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="text-sm font-bold text-slate-900 leading-relaxed pt-1">
                    <MathRenderer text={q.content} />
                  </div>

                  {/* Geometric Diagram / Table Visualization if present */}
                  {(q.diagram || q.tableData || q.imageUrl) && (
                    <div className="my-2">
                      <MathDiagramView
                        diagram={q.diagram}
                        tableData={q.tableData}
                        imageUrl={q.imageUrl}
                      />
                    </div>
                  )}

                  {/* Short Answer Key if present */}
                  {q.shortAnswerKey && (
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 font-medium flex items-center gap-2">
                      <span className="font-bold">Đáp số chuẩn:</span>
                      <code className="px-2 py-0.5 bg-white rounded-md font-bold text-purple-700 border border-purple-300">
                        {q.shortAnswerKey}
                      </code>
                    </div>
                  )}

                  {/* Options */}
                  {q.options && q.options.length > 0 && (
                    <div
                      className={`grid gap-2 pt-1 ${
                        q.questionType === 'true-false'
                          ? 'grid-cols-1 sm:grid-cols-2'
                          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                      }`}
                    >
                      {q.options.map((opt) => {
                        const isCorrect = opt.key === q.correctAnswer;
                        return (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 transition ${
                              isCorrect
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold shadow-2xs'
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

                  {/* Step-by-Step Explanation */}
                  {q.explanation && (
                    <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Lời giải chi tiết:</span>
                      </div>
                      <MathRenderer text={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-16 px-4 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Chưa có câu hỏi nào trong ngân hàng
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Thầy/Cô hãy thêm câu hỏi bằng AI, nhập từ file hoặc soạn thủ công để bắt đầu xây dựng ngân hàng câu hỏi.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
            >
              🤖 AI tạo câu hỏi
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
            >
              📤 Đưa lên từ file
            </button>
          </div>
        </div>
      )}

      {/* Floating Batch Action Bar when questions are selected */}
      {selectedQuestionIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl px-5 py-3.5 shadow-2xl border border-slate-700 flex items-center gap-4 animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center">
              {selectedQuestionIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold">
              câu hỏi đã chọn
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewSetNameFromSelection(
                  `Đề kiểm tra (${selectedQuestionIds.length} câu) - ${lesson.shortTitle}`
                );
                setIsCreateSetFromSelectionOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Tạo Đề thi từ {selectedQuestionIds.length} câu này</span>
            </button>

            <button
              onClick={() => setSelectedQuestionIds([])}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Bỏ chọn tất cả"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal 1: AI Generate Questions into Bank (3x3 Matrix + Preview Approval) */}
      <QuestionBankAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        lesson={lesson}
        onAddQuestionsToBank={(newQuestions) => {
          const currentBank = getLessonQuestionBank(lesson);
          const updatedBank = [...newQuestions, ...currentBank];
          onUpdateLesson({
            ...lesson,
            questionBank: updatedBank,
          });
        }}
      />

      {/* Modal 2: Create Question Set from Selected Questions */}
      {isCreateSetFromSelectionOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-auto">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Tạo Đề thi từ {selectedQuestionIds.length} câu đã chọn
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Đóng gói các câu hỏi đã chọn từ Ngân hàng thành 1 Đề thi kiểm tra mới:
              </p>
              <input
                type="text"
                placeholder={`Đề kiểm tra ${selectedQuestionIds.length} câu - ${lesson.shortTitle}`}
                value={newSetNameFromSelection}
                onChange={(e) => setNewSetNameFromSelection(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl text-slate-900 mb-4 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none font-medium"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSetFromSelectionOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateSetFromSelection}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Tạo Đề thi ngay
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal 3: Import Questions into Bank */}
      <QuestionImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        lessonTitle={lesson.title}
        subject={lesson.subject}
        grade={lesson.grade}
        onImportQuestions={(questions) => handleImportToBank(questions)}
      />

      {/* Modal 4: Question Editor */}
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
    </div>
  );
};
