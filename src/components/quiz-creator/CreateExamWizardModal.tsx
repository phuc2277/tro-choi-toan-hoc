import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Lesson,
  QuestionSetItem,
  ExtendedQuestionItem,
  CognitiveLevel,
  QuestionType,
} from '../../types/teacherLesson';
import { MathRenderer } from '../../games/components/MathRenderer';
import { MathDiagramView } from '../../games/components/MathDiagramView';
import { SwapExamQuestionModal } from './SwapExamQuestionModal';
import {
  getLessonQuestionBank,
  calculateBankMatrixStats,
  validate2DExamMatrix,
  autoSelectQuestionsBy2DMatrix,
  calculateQuestionSetStats,
  Matrix2DConfig,
} from '../../data/teacherLessonData';
import {
  Sparkles,
  Shuffle,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  Check,
  X,
  Plus,
  Minus,
  HelpCircle,
  Clock,
  Eye,
  Sliders,
  FileText,
  ListFilter,
  CheckSquare,
  ArrowRight,
  BookOpen,
  Hash,
  Timer,
  Info,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Edit3,
} from 'lucide-react';

interface CreateExamWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  onSaveExam: (newExam: QuestionSetItem, updatedQuestionBank: ExtendedQuestionItem[]) => void;
  onNavigateToQuestionBank?: () => void;
}

export const CreateExamWizardModal: React.FC<CreateExamWizardModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onSaveExam,
  onNavigateToQuestionBank,
}) => {
  // Current bank & stats
  const bank = useMemo(() => getLessonQuestionBank(lesson), [lesson]);
  const bankStats = useMemo(() => calculateBankMatrixStats(bank), [bank]);

  // Compute default exam number: Đề 1, Đề 2, Đề 3...
  const defaultExamNumber = useMemo(() => {
    const existingCount = (lesson.questionSets || []).length;
    return existingCount + 1;
  }, [lesson.questionSets]);

  // Creation Mode: 'auto' | 'manual' | 'hybrid'
  const [activeMode, setActiveMode] = useState<'auto' | 'manual' | 'hybrid'>('auto');

  // Exam Info
  const [examTitle, setExamTitle] = useState(`Đề ${defaultExamNumber}`);
  const [examDescription, setExamDescription] = useState(`Đề kiểm tra - ${lesson.title}`);
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(30); // Seconds per question

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Update default title when lesson changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setExamTitle(`Đề ${defaultExamNumber}`);
      setExamDescription(`Đề kiểm tra - ${lesson.title}`);
      setIsPreviewStep(false);
      setSelectedBankIds([]);
      setPreviewQuestions([]);
    }
  }, [isOpen, defaultExamNumber, lesson.title]);

  // 2D Matrix Configuration (QuestionType x CognitiveLevel)
  const [matrix2D, setMatrix2D] = useState<Matrix2DConfig>({
    multipleChoice: { recognition: 4, understanding: 3, application: 1, advanced: 0 },
    trueFalse: { recognition: 1, understanding: 1, application: 0, advanced: 0 },
    shortAnswer: { recognition: 0, understanding: 0, application: 1, advanced: 0 },
  });

  // Manual / Hybrid Selection State
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | CognitiveLevel>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | QuestionType>('all');

  // Preview Step & In-Preview Question Swap State
  const [isPreviewStep, setIsPreviewStep] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<ExtendedQuestionItem[]>([]);
  const [hybridExcessWarnings, setHybridExcessWarnings] = useState<string[]>([]);
  const [swapModalData, setSwapModalData] = useState<{
    isOpen: boolean;
    question: ExtendedQuestionItem | null;
    index: number;
  }>({
    isOpen: false,
    question: null,
    index: -1,
  });

  // Real-time stats for manually selected questions in Method 2 & Method 3
  const manualSelectionStats = useMemo(() => {
    const selectedQuestions = bank.filter((q) => selectedBankIds.includes(q.id));
    const byType = {
      multipleChoice: 0,
      trueFalse: 0,
      shortAnswer: 0,
    };
    const byLevel = {
      recognition: 0,
      understanding: 0,
      application: 0,
      advanced: 0,
    };

    selectedQuestions.forEach((q) => {
      const tp = q.questionType || 'multiple-choice';
      if (tp === 'true-false') byType.trueFalse++;
      else if (tp === 'short-answer') byType.shortAnswer++;
      else byType.multipleChoice++;

      const lvl = q.cognitiveLevel || 'Nhận biết';
      if (lvl === 'Thông hiểu') byLevel.understanding++;
      else if (lvl === 'Vận dụng') byLevel.application++;
      else if (lvl === 'Vận dụng cao') byLevel.advanced++;
      else byLevel.recognition++;
    });

    return {
      total: selectedQuestions.length,
      byType,
      byLevel,
      questions: selectedQuestions,
    };
  }, [bank, selectedBankIds]);

  // 2D Matrix Validation Result
  const validationResult = useMemo(() => {
    if (activeMode === 'manual') {
      const errors: string[] = [];
      if (selectedBankIds.length === 0) {
        errors.push('Thầy/Cô vui lòng chọn ít nhất 1 câu hỏi từ Ngân hàng.');
      }
      if (selectedBankIds.length !== totalQuestions) {
        errors.push(
          `Đã chọn ${selectedBankIds.length} câu, chưa khớp với Tổng số câu của đề (${totalQuestions} câu).`
        );
      }
      return {
        valid: errors.length === 0,
        errors,
        warnings: [],
        stats: bankStats,
        totalSum: selectedBankIds.length,
        levelSums: {
          recognition: manualSelectionStats.byLevel.recognition,
          understanding: manualSelectionStats.byLevel.understanding,
          application: manualSelectionStats.byLevel.application,
          advanced: manualSelectionStats.byLevel.advanced,
          total: selectedBankIds.length,
        },
        typeSums: {
          multipleChoice: manualSelectionStats.byType.multipleChoice,
          trueFalse: manualSelectionStats.byType.trueFalse,
          shortAnswer: manualSelectionStats.byType.shortAnswer,
          total: selectedBankIds.length,
        },
      };
    }

    return validate2DExamMatrix(bank, {
      total: totalQuestions,
      matrix2D,
    });
  }, [activeMode, bank, bankStats, totalQuestions, matrix2D, selectedBankIds, manualSelectionStats]);

  // Check excess selections in Hybrid mode (Method 3)
  const hybridCheck = useMemo(() => {
    if (activeMode !== 'hybrid') return { errors: [], countByLevel: {}, countByType: {} };

    const selectedQuestions = bank.filter((q) => selectedBankIds.includes(q.id));
    const countByLevel: Record<string, number> = {
      'Nhận biết': 0,
      'Thông hiểu': 0,
      'Vận dụng': 0,
      'Vận dụng cao': 0,
    };
    const countByType: Record<string, number> = {
      'multiple-choice': 0,
      'true-false': 0,
      'short-answer': 0,
    };

    selectedQuestions.forEach((q) => {
      const lvl = q.cognitiveLevel || 'Nhận biết';
      countByLevel[lvl] = (countByLevel[lvl] || 0) + 1;
      const tp = q.questionType || 'multiple-choice';
      countByType[tp] = (countByType[tp] || 0) + 1;
    });

    const errors: string[] = [];
    const targetLevels = validationResult.levelSums;

    if (countByLevel['Nhận biết'] > targetLevels.recognition && targetLevels.recognition > 0) {
      errors.push(
        `Thầy/Cô đã chọn ${countByLevel['Nhận biết']} câu [Nhận biết], vượt quá số lượng theo ma trận (${targetLevels.recognition} câu). Vui lòng điều chỉnh lại.`
      );
    }
    if (countByLevel['Thông hiểu'] > targetLevels.understanding && targetLevels.understanding > 0) {
      errors.push(
        `Thầy/Cô đã chọn ${countByLevel['Thông hiểu']} câu [Thông hiểu], vượt quá số lượng theo ma trận (${targetLevels.understanding} câu). Vui lòng điều chỉnh lại.`
      );
    }
    if (countByLevel['Vận dụng'] > targetLevels.application && targetLevels.application > 0) {
      errors.push(
        `Thầy/Cô đã chọn ${countByLevel['Vận dụng']} câu [Vận dụng], vượt quá số lượng theo ma trận (${targetLevels.application} câu). Vui lòng điều chỉnh lại.`
      );
    }
    if (countByLevel['Vận dụng cao'] > targetLevels.advanced && targetLevels.advanced > 0) {
      errors.push(
        `Thầy/Cô đã chọn ${countByLevel['Vận dụng cao']} câu [Vận dụng cao], vượt quá số lượng theo ma trận (${targetLevels.advanced} câu). Vui lòng điều chỉnh lại.`
      );
    }

    if (selectedBankIds.length > totalQuestions) {
      errors.push(
        `Thầy/Cô đã chọn trước ${selectedBankIds.length} câu, vượt quá Tổng số câu của đề (${totalQuestions} câu).`
      );
    }

    return { errors, countByLevel, countByType };
  }, [activeMode, bank, selectedBankIds, totalQuestions, validationResult.levelSums]);

  // Apply standard matrix presets
  const handleApplyPreset = (presetType: 'gdpt' | '15min' | '1period' | 'semester') => {
    if (presetType === '15min') {
      setTotalQuestions(10);
      setMatrix2D({
        multipleChoice: { recognition: 5, understanding: 3, application: 2, advanced: 0 },
        trueFalse: { recognition: 0, understanding: 0, application: 0, advanced: 0 },
        shortAnswer: { recognition: 0, understanding: 0, application: 0, advanced: 0 },
      });
    } else if (presetType === 'gdpt') {
      setTotalQuestions(10);
      setMatrix2D({
        multipleChoice: { recognition: 3, understanding: 2, application: 1, advanced: 1 },
        trueFalse: { recognition: 1, understanding: 1, application: 0, advanced: 0 },
        shortAnswer: { recognition: 0, understanding: 0, application: 1, advanced: 0 },
      });
    } else if (presetType === '1period') {
      setTotalQuestions(20);
      setMatrix2D({
        multipleChoice: { recognition: 6, understanding: 5, application: 2, advanced: 1 },
        trueFalse: { recognition: 2, understanding: 1, application: 1, advanced: 0 },
        shortAnswer: { recognition: 0, understanding: 0, application: 1, advanced: 1 },
      });
    } else if (presetType === 'semester') {
      setTotalQuestions(30);
      setMatrix2D({
        multipleChoice: { recognition: 10, understanding: 8, application: 4, advanced: 2 },
        trueFalse: { recognition: 2, understanding: 2, application: 0, advanced: 0 },
        shortAnswer: { recognition: 0, understanding: 0, application: 1, advanced: 1 },
      });
    }
  };

  // Update cell in 2D Matrix & automatically sync total
  const handleCellChange = (
    qType: 'multipleChoice' | 'trueFalse' | 'shortAnswer',
    cLevel: 'recognition' | 'understanding' | 'application' | 'advanced',
    value: number
  ) => {
    const val = Math.max(0, value);
    const updated = {
      ...matrix2D,
      [qType]: {
        ...matrix2D[qType],
        [cLevel]: val,
      },
    };
    setMatrix2D(updated);

    // Compute sum of all cells to update totalQuestions automatically
    let newSum = 0;
    (['multipleChoice', 'trueFalse', 'shortAnswer'] as const).forEach((t) => {
      (['recognition', 'understanding', 'application', 'advanced'] as const).forEach((l) => {
        newSum += updated[t][l] || 0;
      });
    });
    if (newSum > 0) {
      setTotalQuestions(newSum);
    }
  };

  // Filtered bank list for manual/hybrid selection
  const filteredBank = useMemo(() => {
    return bank.filter((q) => {
      if (searchQuery.trim()) {
        const qText = searchQuery.toLowerCase().trim();
        const matchesContent = q.content?.toLowerCase().includes(qText);
        const matchesExplanation = q.explanation?.toLowerCase().includes(qText);
        if (!matchesContent && !matchesExplanation) return false;
      }
      if (levelFilter !== 'all' && q.cognitiveLevel !== levelFilter) return false;
      if (typeFilter !== 'all' && q.questionType !== typeFilter) return false;
      return true;
    });
  }, [bank, searchQuery, levelFilter, typeFilter]);

  if (!isOpen) return null;

  // Handler: Proceed to Preview step
  const handleGoToPreview = () => {
    if (activeMode === 'manual') {
      const chosen = bank.filter((q) => selectedBankIds.includes(q.id));
      setPreviewQuestions(chosen);
      setIsPreviewStep(true);
      return;
    }

    if (activeMode === 'auto') {
      const { selectedIds } = autoSelectQuestionsBy2DMatrix(bank, {
        total: totalQuestions,
        matrix2D,
      });
      const chosen = bank.filter((q) => selectedIds.includes(q.id));
      setPreviewQuestions(chosen);
      setHybridExcessWarnings([]);
      setIsPreviewStep(true);
      return;
    }

    if (activeMode === 'hybrid') {
      const { selectedIds, excessWarnings } = autoSelectQuestionsBy2DMatrix(bank, {
        total: totalQuestions,
        matrix2D,
        preSelectedIds: selectedBankIds,
      });
      const chosen = bank.filter((q) => selectedIds.includes(q.id));
      setPreviewQuestions(chosen);
      setHybridExcessWarnings(excessWarnings);
      setIsPreviewStep(true);
      return;
    }
  };

  // Handler: Reorder preview questions
  const handleMovePreviewQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= previewQuestions.length) return;

    const list = [...previewQuestions];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setPreviewQuestions(list);
  };

  // Handler: Swap question in Preview step
  const handleSelectPreviewReplacement = (newQuestion: ExtendedQuestionItem) => {
    if (swapModalData.index < 0 || !swapModalData.question) return;

    const updated = [...previewQuestions];
    updated[swapModalData.index] = newQuestion;
    setPreviewQuestions(updated);
    setSwapModalData({ isOpen: false, question: null, index: -1 });
  };

  // Handler: Final Save Exam
  const handleFinalSave = () => {
    if (previewQuestions.length === 0) return;

    const chosenIds = previewQuestions.map((q) => q.id);

    // Update usage metadata in Bank ONLY upon final save
    const updatedBank = bank.map((q) => {
      if (chosenIds.includes(q.id)) {
        return {
          ...q,
          usageCount: (q.usageCount || 0) + 1,
          lastUsedAt: Date.now(),
        };
      }
      return q;
    });

    const newExam: QuestionSetItem = {
      id: `qs-${Date.now()}`,
      lessonId: lesson.id,
      title: examTitle.trim() || `Đề ${defaultExamNumber}`,
      description:
        examDescription.trim() ||
        `Tạo từ Ngân hàng câu hỏi (${previewQuestions.length} câu, chế độ: ${
          activeMode === 'auto'
            ? 'Ma trận 2D tự động'
            : activeMode === 'manual'
            ? 'Chọn thủ công'
            : 'Kết hợp'
        })`,
      type: 'custom',
      createdAt: Date.now(),
      questionCount: previewQuestions.length,
      timePerQuestion: Math.max(5, timePerQuestion || 30),
      questionIds: chosenIds,
      questions: previewQuestions,
      stats: calculateQuestionSetStats(previewQuestions),
    };

    onSaveExam(newExam, updatedBank);
    onClose();
  };

  // Toggle selection for manual/hybrid
  const toggleSelectQuestion = (id: string) => {
    setSelectedBankIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Preview stats
  const previewStats = calculateQuestionSetStats(previewQuestions);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>TẠO ĐỀ THI MỚI</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {isPreviewStep ? 'Bước 2/2: Xem trước & Lưu' : 'Bước 1/2: Cấu hình đề'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Tạo đề từ Ngân hàng câu hỏi của bài học: <strong className="text-slate-800">{lesson.title}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isPreviewStep ? (
            <>
              {/* Step 1: Basic Exam Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tên đề thi</span>
                  </label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="VD: Đề 1, Kiểm tra 15 phút..."
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tổng số câu hỏi</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thời gian mỗi câu (giây)</span>
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    step="5"
                    value={timePerQuestion}
                    onChange={(e) => setTimePerQuestion(Math.max(5, parseInt(e.target.value) || 30))}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* Step 2: Choose 1 of 3 Creation Modes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Chọn Phương Thức Tạo Đề:
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Ngân hàng bài học hiện có: <strong className="text-slate-700">{bank.length} câu</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Mode 1: Auto Matrix 2D */}
                  <button
                    type="button"
                    onClick={() => setActiveMode('auto')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      activeMode === 'auto'
                        ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                          ①
                        </span>
                        {activeMode === 'auto' && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <h4 className="text-xs font-black text-slate-900 mb-1">
                        Tự động theo ma trận
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Thiết lập ma trận 2D chuẩn (Dạng câu × Cấp độ). Hệ thống tự động rút câu hỏi tối ưu.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 mt-3 block">
                      Mặc định khuyên dùng ★
                    </span>
                  </button>

                  {/* Mode 2: Manual Selection */}
                  <button
                    type="button"
                    onClick={() => setActiveMode('manual')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      activeMode === 'manual'
                        ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                          ②
                        </span>
                        {activeMode === 'manual' && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <h4 className="text-xs font-black text-slate-900 mb-1">
                        Thủ công chọn câu
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Tự chọn từng câu hỏi từ Ngân hàng câu hỏi của bài học để đưa vào đề thi.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 mt-3 block">
                      Tự chủ 100% nội dung
                    </span>
                  </button>

                  {/* Mode 3: Hybrid */}
                  <button
                    type="button"
                    onClick={() => setActiveMode('hybrid')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      activeMode === 'hybrid'
                        ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                          ③
                        </span>
                        {activeMode === 'hybrid' && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <h4 className="text-xs font-black text-slate-900 mb-1">
                        Phương thức kết hợp
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Chọn trước một số câu bắt buộc + Thiết lập ma trận 2D để hệ thống tự động bù đủ phần còn thiếu.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 mt-3 block">
                      Linh hoạt & chính xác
                    </span>
                  </button>
                </div>
              </div>

              {/* Step 3: Matrix 2D Config Grid (For Auto & Hybrid) */}
              {(activeMode === 'auto' || activeMode === 'hybrid') && (
                <div className="space-y-3.5 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">
                        Phân bố câu hỏi theo Ma trận 2D (Dạng câu × Cấp độ nhận thức)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Nhập số lượng câu hỏi cần cho từng ô. Số câu trong ô không được vượt quá số câu hiện có trong Ngân hàng.
                      </p>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="text-slate-400 font-medium">Mẫu chuẩn:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('15min')}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                      >
                        15 Phút (10c)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('gdpt')}
                        className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition cursor-pointer"
                      >
                        GDPT 2018 (10c)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('1period')}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                      >
                        1 Tiết (20c)
                      </button>
                    </div>
                  </div>

                  {/* 2D Matrix Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
                          <th className="p-2.5 border-r border-slate-200">Dạng câu hỏi \ Cấp độ</th>
                          <th className="p-2.5 text-center border-r border-slate-200 text-emerald-800">
                            Nhận biết
                          </th>
                          <th className="p-2.5 text-center border-r border-slate-200 text-blue-800">
                            Thông hiểu
                          </th>
                          <th className="p-2.5 text-center border-r border-slate-200 text-purple-800">
                            Vận dụng
                          </th>
                          <th className="p-2.5 text-center border-r border-slate-200 text-amber-800">
                            Vận dụng cao
                          </th>
                          <th className="p-2.5 text-center font-black text-slate-900 bg-slate-200/60">
                            Tổng theo dạng
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Multiple Choice Row */}
                        <tr>
                          <td className="p-3 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/40">
                            Trắc nghiệm nhiều lựa chọn
                          </td>

                          {/* MC - Recognition */}
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={matrix2D.multipleChoice.recognition}
                                onChange={(e) =>
                                  handleCellChange('multipleChoice', 'recognition', parseInt(e.target.value) || 0)
                                }
                                className={`w-12 h-7 text-center font-bold border rounded-lg outline-none text-xs ${
                                  matrix2D.multipleChoice.recognition > bankStats.matrix.multipleChoice.recognition
                                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-slate-400">
                              Có: {bankStats.matrix.multipleChoice.recognition}
                            </div>
                          </td>

                          {/* MC - Understanding */}
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={matrix2D.multipleChoice.understanding}
                                onChange={(e) =>
                                  handleCellChange('multipleChoice', 'understanding', parseInt(e.target.value) || 0)
                                }
                                className={`w-12 h-7 text-center font-bold border rounded-lg outline-none text-xs ${
                                  matrix2D.multipleChoice.understanding > bankStats.matrix.multipleChoice.understanding
                                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-slate-400">
                              Có: {bankStats.matrix.multipleChoice.understanding}
                            </div>
                          </td>

                          {/* MC - Application */}
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={matrix2D.multipleChoice.application}
                                onChange={(e) =>
                                  handleCellChange('multipleChoice', 'application', parseInt(e.target.value) || 0)
                                }
                                className={`w-12 h-7 text-center font-bold border rounded-lg outline-none text-xs ${
                                  matrix2D.multipleChoice.application > bankStats.matrix.multipleChoice.application
                                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-slate-400">
                              Có: {bankStats.matrix.multipleChoice.application}
                            </div>
                          </td>

                          {/* MC - Advanced */}
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={matrix2D.multipleChoice.advanced}
                                onChange={(e) =>
                                  handleCellChange('multipleChoice', 'advanced', parseInt(e.target.value) || 0)
                                }
                                className={`w-12 h-7 text-center font-bold border rounded-lg outline-none text-xs ${
                                  matrix2D.multipleChoice.advanced > bankStats.matrix.multipleChoice.advanced
                                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-slate-400">
                              Có: {bankStats.matrix.multipleChoice.advanced}
                            </div>
                          </td>

                          {/* MC - Total */}
                          <td className="p-2 text-center font-black text-slate-900 bg-slate-50/30">
                            {validationResult.typeSums.multipleChoice} câu
                          </td>
                        </tr>

                        {/* True / False Row */}
                        <tr>
                          <td className="p-3 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/40">
                            Trắc nghiệm Đúng / Sai
                          </td>

                          {/* TF - Recognition */}
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={matrix2D.trueFalse.recognition}
                                onChange={(e) =>
                                  handleCellChange('trueFalse', 'recognition', parseInt(e.target.value) || 0)
                                }
                                className={`w-12 h-7 text-center font-bold border rounded-lg outline-none text-xs ${
                                  matrix2D.trueFalse.recognition > bankStats.matrix.trueFalse.recognition
                                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-slate-400">
                              Có: {bankStats.matrix.trueFalse.recognition}
                            </div>
                          </td>

                          {/* TF - Understanding */}
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={matrix2D.trueFalse.understanding}
                                onChange={(e) =>
                                  handleCellChange('trueFalse', 'understanding', parseInt(e.target.value) || 0)
                                }
                                className={`w-12 h-7 text-center font-bold border rounded-lg outline-none text-xs ${
                                  matrix2D.trueFalse.understanding > bankStats.matrix.trueFalse.understanding
                                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-slate-400">
                              Có: {bankStats.matrix.trueFalse.understanding}
                            </div>
                          </td>

                          {/* TF - Application */}
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={matrix2D.trueFalse.application}
                                onChange={(e) =>
                                  handleCellChange('trueFalse', 'application', parseInt(e.target.value) || 0)
                                }
                                className={`w-12 h-7 text-center font-bold border rounded-lg outline-none text-xs ${
                                  matrix2D.trueFalse.application > bankStats.matrix.trueFalse.application
                                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-slate-400">
                              Có: {bankStats.matrix.trueFalse.application}
                            </div>
                          </td>

                          {/* TF - Advanced */}
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={matrix2D.trueFalse.advanced}
                                onChange={(e) =>
                                  handleCellChange('trueFalse', 'advanced', parseInt(e.target.value) || 0)
                                }
                                className={`w-12 h-7 text-center font-bold border rounded-lg outline-none text-xs ${
                                  matrix2D.trueFalse.advanced > bankStats.matrix.trueFalse.advanced
                                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-slate-400">
                              Có: {bankStats.matrix.trueFalse.advanced}
                            </div>
                          </td>

                          {/* TF - Total */}
                          <td className="p-2 text-center font-black text-slate-900 bg-slate-50/30">
                            {validationResult.typeSums.trueFalse} câu
                          </td>
                        </tr>

                        {/* Short Answer Row */}
                        <tr>
                          <td className="p-3 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/40">
                            Trắc nghiệm trả lời ngắn
                          </td>

                          {/* SA - Recognition */}
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={matrix2D.shortAnswer.recognition}
                                onChange={(e) =>
                                  handleCellChange('shortAnswer', 'recognition', parseInt(e.target.value) || 0)
                                }
                                className={`w-12 h-7 text-center font-bold border rounded-lg outline-none text-xs ${
                                  matrix2D.shortAnswer.recognition > bankStats.matrix.shortAnswer.recognition
                                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-slate-400">
                              Có: {bankStats.matrix.shortAnswer.recognition}
                            </div>
                          </td>

                          {/* SA - Understanding */}
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={matrix2D.shortAnswer.understanding}
                                onChange={(e) =>
                                  handleCellChange('shortAnswer', 'understanding', parseInt(e.target.value) || 0)
                                }
                                className={`w-12 h-7 text-center font-bold border rounded-lg outline-none text-xs ${
                                  matrix2D.shortAnswer.understanding > bankStats.matrix.shortAnswer.understanding
                                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-slate-400">
                              Có: {bankStats.matrix.shortAnswer.understanding}
                            </div>
                          </td>

                          {/* SA - Application */}
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={matrix2D.shortAnswer.application}
                                onChange={(e) =>
                                  handleCellChange('shortAnswer', 'application', parseInt(e.target.value) || 0)
                                }
                                className={`w-12 h-7 text-center font-bold border rounded-lg outline-none text-xs ${
                                  matrix2D.shortAnswer.application > bankStats.matrix.shortAnswer.application
                                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-slate-400">
                              Có: {bankStats.matrix.shortAnswer.application}
                            </div>
                          </td>

                          {/* SA - Advanced */}
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={matrix2D.shortAnswer.advanced}
                                onChange={(e) =>
                                  handleCellChange('shortAnswer', 'advanced', parseInt(e.target.value) || 0)
                                }
                                className={`w-12 h-7 text-center font-bold border rounded-lg outline-none text-xs ${
                                  matrix2D.shortAnswer.advanced > bankStats.matrix.shortAnswer.advanced
                                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-center mt-1 text-slate-400">
                              Có: {bankStats.matrix.shortAnswer.advanced}
                            </div>
                          </td>

                          {/* SA - Total */}
                          <td className="p-2 text-center font-black text-slate-900 bg-slate-50/30">
                            {validationResult.typeSums.shortAnswer} câu
                          </td>
                        </tr>

                        {/* Summary Footer Row */}
                        <tr className="bg-slate-100/80 font-black border-t border-slate-200 text-slate-900">
                          <td className="p-3 border-r border-slate-200">
                            Tổng theo mức độ
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 text-emerald-800">
                            {validationResult.levelSums.recognition} câu
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 text-blue-800">
                            {validationResult.levelSums.understanding} câu
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 text-purple-800">
                            {validationResult.levelSums.application} câu
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 text-amber-800">
                            {validationResult.levelSums.advanced} câu
                          </td>
                          <td className="p-2 text-center text-blue-900 bg-blue-100/60 font-black text-sm">
                            {validationResult.totalSum} / {totalQuestions} câu
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Step 4: Manual & Hybrid Question Picker */}
              {(activeMode === 'manual' || activeMode === 'hybrid') && (
                <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">
                        {activeMode === 'manual'
                          ? `Tích chọn câu hỏi thủ công (${selectedBankIds.length} / ${totalQuestions} câu đã chọn)`
                          : `Chọn trước các câu hỏi bắt buộc (${selectedBankIds.length} câu đã chọn)`}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {activeMode === 'manual'
                          ? 'Đề thi sẽ chỉ bao gồm đúng các câu Thầy/Cô tích chọn bên dưới.'
                          : 'Các câu này sẽ được giữ nguyên, hệ thống sẽ tự rút thêm câu còn thiếu theo Ma trận 2D.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Tìm câu hỏi..."
                          className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none w-48 text-slate-800 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400 font-medium">Lọc:</span>
                    {(['all', 'Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as const).map((lvl) => (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setLevelFilter(lvl)}
                        className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                          levelFilter === lvl
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lvl === 'all' ? 'Tất cả cấp độ' : lvl}
                      </button>
                    ))}

                    <span className="text-slate-300">|</span>

                    {(['all', 'multiple-choice', 'true-false', 'short-answer'] as const).map((tp) => (
                      <button
                        type="button"
                        key={tp}
                        onClick={() => setTypeFilter(tp)}
                        className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                          typeFilter === tp
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tp === 'all'
                          ? 'Mọi dạng câu'
                          : tp === 'multiple-choice'
                          ? 'Nhiều lựa chọn'
                          : tp === 'true-false'
                          ? 'Đúng/Sai'
                          : 'Trả lời ngắn'}
                      </button>
                    ))}
                  </div>

                  {/* Real-time statistics of selected questions */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                      <span>Thống kê các câu đã chọn:</span>
                      <span className="text-blue-700 font-black">
                        Tổng: {selectedBankIds.length} / {totalQuestions} câu
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center text-[11px]">
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 block text-[10px]">Nhiều lựa chọn</span>
                        <strong className="text-slate-800">{manualSelectionStats.byType.multipleChoice}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 block text-[10px]">Đúng / Sai</span>
                        <strong className="text-slate-800">{manualSelectionStats.byType.trueFalse}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 block text-[10px]">Trả lời ngắn</span>
                        <strong className="text-slate-800">{manualSelectionStats.byType.shortAnswer}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                        <span className="text-emerald-700 block text-[10px]">Nhận biết</span>
                        <strong className="text-emerald-900">{manualSelectionStats.byLevel.recognition}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100">
                        <span className="text-blue-700 block text-[10px]">Thông hiểu</span>
                        <strong className="text-blue-900">{manualSelectionStats.byLevel.understanding}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-100">
                        <span className="text-purple-700 block text-[10px]">Vận dụng</span>
                        <strong className="text-purple-900">{manualSelectionStats.byLevel.application}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-100">
                        <span className="text-amber-700 block text-[10px]">Vận dụng cao</span>
                        <strong className="text-amber-900">{manualSelectionStats.byLevel.advanced}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Bank Question List */}
                  <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2.5 bg-white">
                    {filteredBank.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Không có câu hỏi nào khớp với bộ lọc
                      </div>
                    ) : (
                      filteredBank.map((q) => {
                        const isSelected = selectedBankIds.includes(q.id);
                        return (
                          <div
                            key={q.id}
                            onClick={() => toggleSelectQuestion(q.id)}
                            className={`p-3 rounded-xl border text-xs transition cursor-pointer flex items-start gap-3 ${
                              isSelected
                                ? 'bg-blue-50/90 border-blue-400 text-blue-950 font-medium shadow-2xs'
                                : 'bg-slate-50/40 border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 shrink-0 pointer-events-none"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    q.cognitiveLevel === 'Nhận biết'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : q.cognitiveLevel === 'Thông hiểu'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}
                                >
                                  {q.cognitiveLevel || 'Nhận biết'}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  {q.questionType === 'true-false'
                                    ? 'Đúng/Sai'
                                    : q.questionType === 'short-answer'
                                    ? 'Trả lời ngắn'
                                    : 'Trắc nghiệm ABCD'}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-auto">
                                  Đã dùng: {q.usageCount || 0} lần
                                </span>
                              </div>
                              <div className="font-semibold line-clamp-2">
                                <MathRenderer text={q.content} />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Hybrid Excess Warnings Alert */}
              {activeMode === 'hybrid' && hybridCheck.errors.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Cảnh báo chọn vượt mức Ma trận:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-amber-800">
                    {hybridCheck.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Live Matrix Validation Status & Error Alert */}
              {!validationResult.valid && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2.5">
                  <div className="flex items-center gap-2 font-black text-rose-950">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>⚠ Không đủ câu hỏi để tạo đề theo yêu cầu:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-rose-800 font-medium">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-rose-700 italic">
                    Vui lòng bổ sung câu hỏi vào Ngân hàng câu hỏi hoặc điều chỉnh lại ma trận đề thi.
                  </p>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {onNavigateToQuestionBank && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToQuestionBank();
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm shadow-emerald-200"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Quay lại Ngân hàng câu hỏi</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Preview Step */
            <div className="space-y-5">
              {/* Preview Header Banner */}
              <div className="p-5 rounded-2xl bg-blue-50/90 border border-blue-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <h4 className="text-base font-black text-blue-950">{examTitle}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-200 text-blue-900">
                        {previewQuestions.length} câu hỏi
                      </span>
                    </div>
                    <p className="text-xs text-blue-800/80">{examDescription}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 font-bold text-slate-700 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-blue-600" />
                      <span>{timePerQuestion}s / câu</span>
                    </span>
                  </div>
                </div>

                {/* Cognitive & Type Stats Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-blue-200/60">
                  <div className="p-2 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
                    <span className="text-emerald-800 font-bold">Nhận biết:</span>
                    <strong className="text-emerald-950">{previewStats.recognition} câu</strong>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
                    <span className="text-blue-800 font-bold">Thông hiểu:</span>
                    <strong className="text-blue-950">{previewStats.understanding} câu</strong>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
                    <span className="text-purple-800 font-bold">Vận dụng:</span>
                    <strong className="text-purple-950">{previewStats.application + previewStats.advanced} câu</strong>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
                    <span className="text-slate-700 font-bold">Tổng số câu:</span>
                    <strong className="text-slate-950">{previewQuestions.length} câu</strong>
                  </div>
                </div>
              </div>

              {/* Hybrid Excess Warnings (if any) */}
              {hybridExcessWarnings.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <div className="font-bold mb-1">Ghi chú phân bổ ma trận:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {hybridExcessWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Questions List with Reorder & Swap Options */}
              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {previewQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs text-xs hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>

                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMovePreviewQuestion(idx, 'up')}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 flex items-center justify-center text-[10px] cursor-pointer"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === previewQuestions.length - 1}
                            onClick={() => handleMovePreviewQuestion(idx, 'down')}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 flex items-center justify-center text-[10px] cursor-pointer"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
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
                          {q.cognitiveLevel || 'Nhận biết'}
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
                        <span className="text-[11px] text-slate-400 mr-1">
                          Đã dùng: {q.usageCount || 0} lần
                        </span>

                        {/* In-Preview Swap Question Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setSwapModalData({
                              isOpen: true,
                              question: q,
                              index: idx,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition cursor-pointer"
                          title="Thay câu hỏi tương đương từ Ngân hàng"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                          <span>Thay câu</span>
                        </button>
                      </div>
                    </div>

                    <div className="font-bold text-slate-900 leading-relaxed text-sm">
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
                      <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 font-medium flex items-center gap-2">
                        <span className="font-bold">Đáp số:</span>
                        <code className="px-2 py-0.5 bg-white rounded-md font-bold text-purple-700 border border-purple-300">
                          {q.shortAnswerKey}
                        </code>
                      </div>
                    )}

                    {q.options && q.options.length > 0 && (
                      <div
                        className={`grid gap-2 pt-1 ${
                          q.questionType === 'true-false'
                            ? 'grid-cols-1 sm:grid-cols-2'
                            : 'grid-cols-1 sm:grid-cols-2'
                        }`}
                      >
                        {q.options.map((opt) => {
                          const isCorrect = opt.key === q.correctAnswer;
                          return (
                            <div
                              key={opt.key}
                              className={`p-2.5 rounded-xl border flex items-start gap-2 ${
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

                    {q.explanation && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                        <span className="font-bold text-indigo-900">Lời giải: </span>
                        <MathRenderer text={q.explanation} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <button
            type="button"
            onClick={isPreviewStep ? () => setIsPreviewStep(false) : onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            {isPreviewStep ? '← Quay lại chỉnh sửa' : 'Hủy bỏ'}
          </button>

          {!isPreviewStep ? (
            <button
              type="button"
              disabled={!validationResult.valid || (activeMode === 'hybrid' && hybridCheck.errors.length > 0)}
              onClick={handleGoToPreview}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-200 transition cursor-pointer disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              <span>Tiếp tục: Xem trước Đề thi ({totalQuestions} câu) →</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSave}
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-200 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>✓ Lưu đề thi ({previewQuestions.length} câu)</span>
            </button>
          )}
        </div>
      </div>

      {/* In-Preview Swap Question Modal */}
      {swapModalData.isOpen && swapModalData.question && (
        <SwapExamQuestionModal
          isOpen={swapModalData.isOpen}
          onClose={() => setSwapModalData({ isOpen: false, question: null, index: -1 })}
          currentQuestion={swapModalData.question}
          questionIndex={swapModalData.index}
          bank={bank}
          currentExamQuestionIds={previewQuestions.map((q) => q.id)}
          onSelectReplacement={handleSelectPreviewReplacement}
        />
      )}
    </div>,
    document.body
  );
};
