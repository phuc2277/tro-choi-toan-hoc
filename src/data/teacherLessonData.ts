import { QuizOptionKeyEnum } from '../games/types/GameEnums';
import {
  SubjectItem,
  GradeItem,
  Lesson,
  TeacherUser,
  ExtendedQuestionItem,
  QuestionSetItem,
} from '../types/teacherLesson';
import { TOAN_9_LESSONS } from './toan9LessonData';
import { TOAN_8_LESSONS } from './toan8LessonData';
import { TOAN_7_LESSONS } from './toan7LessonData';
import { TOAN_6_LESSONS } from './toan6LessonData';

export const CURRENT_TEACHER: TeacherUser = {
  id: 'teacher-nguyen-phuc',
  name: 'Thầy Nguyễn Quang Phúc',
  title: 'Giáo viên Toán & KHTN THCS',
  school: 'Trường THCS Thành Vinh 1',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  subject: 'Toán học & Khoa học Tự nhiên',
  gradesTeaching: [6, 7, 8, 9],
  email: 'nqp2277@gmail.com',
};

export const DEFAULT_SUBJECTS: SubjectItem[] = [
  {
    id: 'math',
    code: 'TOAN',
    name: 'Toán học',
    iconName: 'Calculator',
    color: 'from-blue-600 to-indigo-600',
    description: 'Đại số, Hình học và Đo lường, Thống kê và Xác suất (GDPT 2018)',
    grades: [6, 7, 8, 9],
  },
  {
    id: 'science',
    code: 'KHTN',
    name: 'Khoa học tự nhiên',
    iconName: 'Atom',
    color: 'from-emerald-600 to-teal-600',
    description: 'Vật lý, Hóa học, Sinh học và Trái đất (GDPT 2018)',
    grades: [6, 7, 8, 9],
  },
  {
    id: 'history',
    code: 'SU_DIA',
    name: 'Lịch sử & Địa lí',
    iconName: 'Compass',
    color: 'from-amber-600 to-orange-600',
    description: 'Lịch sử thế giới, Lịch sử Việt Nam & Địa lý tự nhiên - kinh tế',
    grades: [6, 7, 8, 9],
  },
  {
    id: 'informatics',
    code: 'TIN',
    name: 'Tin học',
    iconName: 'Cpu',
    color: 'from-purple-600 to-pink-600',
    description: 'Khoa học máy tính, Lập trình trực quan & Ứng dụng công nghệ',
    grades: [6, 7, 8, 9],
  },
  {
    id: 'english',
    code: 'ENG',
    name: 'Tiếng Anh',
    iconName: 'Languages',
    color: 'from-rose-600 to-red-600',
    description: 'Từ vựng, Ngữ pháp, Kỹ năng nghe nói và Đọc hiểu chuẩn khung CEFR',
    grades: [6, 7, 8, 9],
  },
];

export const DEFAULT_GRADES: GradeItem[] = [
  { id: 'grade-6', level: 6, name: 'Khối Lớp 6', shortName: 'Lớp 6' },
  { id: 'grade-7', level: 7, name: 'Khối Lớp 7', shortName: 'Lớp 7' },
  { id: 'grade-8', level: 8, name: 'Khối Lớp 8', shortName: 'Lớp 8' },
  { id: 'grade-9', level: 9, name: 'Khối Lớp 9', shortName: 'Lớp 9' },
];

// Helper to compute question set statistics
export function calculateQuestionSetStats(questions: ExtendedQuestionItem[]) {
  const recognition = questions.filter((q) => q.cognitiveLevel === 'Nhận biết').length;
  const understanding = questions.filter((q) => q.cognitiveLevel === 'Thông hiểu').length;
  const application = questions.filter((q) => q.cognitiveLevel === 'Vận dụng' || q.cognitiveLevel === 'Vận dụng cao').length;
  const advanced = questions.filter((q) => q.cognitiveLevel === 'Vận dụng cao').length;
  return { recognition, understanding, application, advanced };
}

export interface BankMatrixStats {
  total: number;
  byType: {
    multipleChoice: number;
    trueFalse: number;
    shortAnswer: number;
  };
  byLevel: {
    recognition: number;
    understanding: number;
    application: number;
    advanced: number;
  };
  matrix: {
    multipleChoice: { recognition: number; understanding: number; application: number; advanced: number; total: number };
    trueFalse: { recognition: number; understanding: number; application: number; advanced: number; total: number };
    shortAnswer: { recognition: number; understanding: number; application: number; advanced: number; total: number };
  };
}

export interface Matrix2DConfig {
  multipleChoice: { recognition: number; understanding: number; application: number; advanced: number };
  trueFalse: { recognition: number; understanding: number; application: number; advanced: number };
  shortAnswer: { recognition: number; understanding: number; application: number; advanced: number };
}

/**
 * Calculates a comprehensive 2D Matrix of question types x cognitive levels for the bank.
 */
export function calculateBankMatrixStats(bank: ExtendedQuestionItem[]): BankMatrixStats {
  const stats: BankMatrixStats = {
    total: bank.length,
    byType: { multipleChoice: 0, trueFalse: 0, shortAnswer: 0 },
    byLevel: { recognition: 0, understanding: 0, application: 0, advanced: 0 },
    matrix: {
      multipleChoice: { recognition: 0, understanding: 0, application: 0, advanced: 0, total: 0 },
      trueFalse: { recognition: 0, understanding: 0, application: 0, advanced: 0, total: 0 },
      shortAnswer: { recognition: 0, understanding: 0, application: 0, advanced: 0, total: 0 },
    },
  };

  bank.forEach((q) => {
    const qType = q.questionType === 'true-false' ? 'trueFalse' : q.questionType === 'short-answer' ? 'shortAnswer' : 'multipleChoice';
    const cLevel = q.cognitiveLevel === 'Thông hiểu' ? 'understanding' : q.cognitiveLevel === 'Vận dụng' ? 'application' : q.cognitiveLevel === 'Vận dụng cao' ? 'advanced' : 'recognition';

    stats.byType[qType]++;
    stats.byLevel[cLevel]++;
    stats.matrix[qType][cLevel]++;
    stats.matrix[qType].total++;
  });

  return stats;
}

/**
 * Validates whether an Exam's requested 2D matrix can be fulfilled by the Question Bank.
 * Checks:
 * 1. Total questions > 0
 * 2. Sum of cognitive levels == total
 * 3. Sum of question types == total
 * 4. Exact availability for each 2D cell (QuestionType x CognitiveLevel) in the bank
 */
export function validate2DExamMatrix(
  bank: ExtendedQuestionItem[],
  config: {
    total: number;
    matrix2D: Matrix2DConfig;
  }
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: BankMatrixStats;
  totalSum: number;
  levelSums: { recognition: number; understanding: number; application: number; advanced: number; total: number };
  typeSums: { multipleChoice: number; trueFalse: number; shortAnswer: number; total: number };
} {
  const stats = calculateBankMatrixStats(bank);
  const errors: string[] = [];
  const warnings: string[] = [];

  const m = config.matrix2D;

  const levelSums = {
    recognition: m.multipleChoice.recognition + m.trueFalse.recognition + m.shortAnswer.recognition,
    understanding: m.multipleChoice.understanding + m.trueFalse.understanding + m.shortAnswer.understanding,
    application: m.multipleChoice.application + m.trueFalse.application + m.shortAnswer.application,
    advanced: m.multipleChoice.advanced + m.trueFalse.advanced + m.shortAnswer.advanced,
    total: 0,
  };
  levelSums.total = levelSums.recognition + levelSums.understanding + levelSums.application + levelSums.advanced;

  const typeSums = {
    multipleChoice: m.multipleChoice.recognition + m.multipleChoice.understanding + m.multipleChoice.application + m.multipleChoice.advanced,
    trueFalse: m.trueFalse.recognition + m.trueFalse.understanding + m.trueFalse.application + m.trueFalse.advanced,
    shortAnswer: m.shortAnswer.recognition + m.shortAnswer.understanding + m.shortAnswer.application + m.shortAnswer.advanced,
    total: 0,
  };
  typeSums.total = typeSums.multipleChoice + typeSums.trueFalse + typeSums.shortAnswer;

  if (config.total <= 0) {
    errors.push('Tổng số câu hỏi của đề thi phải lớn hơn 0.');
  }

  if (levelSums.total !== config.total) {
    errors.push(
      `Tổng số câu theo ma trận (${levelSums.total} câu: ${levelSums.recognition} NB + ${levelSums.understanding} TH + ${levelSums.application} VD + ${levelSums.advanced} VDC) không khớp với Tổng số câu của đề (${config.total} câu). Vui lòng điều chỉnh lại.`
    );
  }

  if (typeSums.total !== config.total) {
    errors.push(
      `Tổng số câu theo dạng câu (${typeSums.total} câu: ${typeSums.multipleChoice} Trắc nghiệm + ${typeSums.trueFalse} Đúng/Sai + ${typeSums.shortAnswer} Trả lời ngắn) không khớp với Tổng số câu của đề (${config.total} câu).`
    );
  }

  // Type labels for human-readable error messages
  const typeLabels = {
    multipleChoice: 'Nhiều lựa chọn',
    trueFalse: 'Đúng / Sai',
    shortAnswer: 'Trả lời ngắn',
  };

  const levelLabels = {
    recognition: 'Nhận biết',
    understanding: 'Thông hiểu',
    application: 'Vận dụng',
    advanced: 'Vận dụng cao',
  };

  const types: Array<'multipleChoice' | 'trueFalse' | 'shortAnswer'> = ['multipleChoice', 'trueFalse', 'shortAnswer'];
  const levels: Array<'recognition' | 'understanding' | 'application' | 'advanced'> = ['recognition', 'understanding', 'application', 'advanced'];

  // Check each 2D cell (Type x Level)
  for (const t of types) {
    for (const l of levels) {
      const needed = m[t][l] || 0;
      const available = stats.matrix[t][l] || 0;
      if (needed > available) {
        errors.push(
          `Yêu cầu: ${levelLabels[l]} – ${typeLabels[t]}: ${needed} câu | Ngân hàng hiện có: ${available} câu | Còn thiếu: ${needed - available} câu.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
    totalSum: levelSums.total,
    levelSums,
    typeSums,
  };
}

/**
 * Validates whether an Exam's requested simple matrix can be fulfilled by the Question Bank.
 */
export function validateExamMatrix(
  bank: ExtendedQuestionItem[],
  config: {
    total: number;
    cognitiveLevels: { recognition: number; understanding: number; application: number; advanced?: number };
    questionTypes?: { multipleChoice: number; trueFalse: number; shortAnswer: number };
  }
): { valid: boolean; errors: string[]; stats: BankMatrixStats } {
  const stats = calculateBankMatrixStats(bank);
  const errors: string[] = [];

  const { recognition, understanding, application, advanced = 0 } = config.cognitiveLevels;
  const levelSum = recognition + understanding + application + advanced;

  if (config.total <= 0) {
    errors.push('Tổng số câu hỏi của đề thi phải lớn hơn 0.');
  }

  if (levelSum !== config.total) {
    errors.push(`Tổng số lượng theo cấp độ nhận thức (${levelSum} câu) không khớp với tổng số câu của đề (${config.total} câu).`);
  }

  if (config.questionTypes) {
    const { multipleChoice, trueFalse, shortAnswer } = config.questionTypes;
    const typeSum = multipleChoice + trueFalse + shortAnswer;
    if (typeSum !== config.total) {
      errors.push(`Tổng số lượng theo loại câu hỏi (${typeSum} câu) không khớp với tổng số câu của đề (${config.total} câu).`);
    }

    if (multipleChoice > stats.byType.multipleChoice) {
      errors.push(`Không đủ câu hỏi Nhiều lựa chọn: Cần ${multipleChoice} câu, nhưng ngân hàng chỉ có ${stats.byType.multipleChoice} câu.`);
    }
    if (trueFalse > stats.byType.trueFalse) {
      errors.push(`Không đủ câu hỏi Đúng/Sai: Cần ${trueFalse} câu, nhưng ngân hàng chỉ có ${stats.byType.trueFalse} câu.`);
    }
    if (shortAnswer > stats.byType.shortAnswer) {
      errors.push(`Không đủ câu hỏi Trả lời ngắn: Cần ${shortAnswer} câu, nhưng ngân hàng chỉ có ${stats.byType.shortAnswer} câu.`);
    }
  }

  if (config.total > stats.total) {
    errors.push(`Ngân hàng câu hỏi của bài học chỉ có ${stats.total} câu, không đủ để tạo đề thi ${config.total} câu.`);
  }

  if (recognition > stats.byLevel.recognition) {
    errors.push(`Không đủ câu hỏi Nhận biết: Cần ${recognition} câu, nhưng ngân hàng chỉ có ${stats.byLevel.recognition} câu.`);
  }
  if (understanding > stats.byLevel.understanding) {
    errors.push(`Không đủ câu hỏi Thông hiểu: Cần ${understanding} câu, nhưng ngân hàng chỉ có ${stats.byLevel.understanding} câu.`);
  }
  if (application > stats.byLevel.application) {
    errors.push(`Không đủ câu hỏi Vận dụng: Cần ${application} câu, nhưng ngân hàng chỉ có ${stats.byLevel.application} câu.`);
  }
  if (advanced > stats.byLevel.advanced) {
    errors.push(`Không đủ câu hỏi Vận dụng cao: Cần ${advanced} câu, nhưng ngân hàng chỉ có ${stats.byLevel.advanced} câu.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    stats,
  };
}

/**
 * 2D Matrix Selection algorithm:
 * Strictly selects questions according to the 2D Matrix (QuestionType x CognitiveLevel),
 * prioritizing:
 * 1. Valid pre-selected questions (Hybrid mode)
 * 2. Questions never used (usageCount === 0)
 * 3. Questions with lowest usageCount
 * 4. Oldest lastUsedAt / createdAt
 */
export function autoSelectQuestionsBy2DMatrix(
  bank: ExtendedQuestionItem[],
  config: {
    total: number;
    matrix2D: Matrix2DConfig;
    preSelectedIds?: string[];
  }
): {
  selectedIds: string[];
  excessWarnings: string[];
} {
  const preSelected = new Set(config.preSelectedIds || []);
  const selectedIds: string[] = [];
  const excessWarnings: string[] = [];

  // Sort candidate pool by priority:
  // 1. usageCount ascending
  // 2. lastUsedAt ascending
  // 3. createdAt ascending
  const pool = [...bank].sort((a, b) => {
    const aUsed = a.usageCount || 0;
    const bUsed = b.usageCount || 0;
    if (aUsed !== bUsed) return aUsed - bUsed;
    const aTime = a.lastUsedAt || a.createdAt || 0;
    const bTime = b.lastUsedAt || b.createdAt || 0;
    return aTime - bTime;
  });

  // Track counts per cell from pre-selected items
  const cellAllocations: Matrix2DConfig = {
    multipleChoice: { recognition: 0, understanding: 0, application: 0, advanced: 0 },
    trueFalse: { recognition: 0, understanding: 0, application: 0, advanced: 0 },
    shortAnswer: { recognition: 0, understanding: 0, application: 0, advanced: 0 },
  };

  const mapQuestionToType = (q: ExtendedQuestionItem): 'multipleChoice' | 'trueFalse' | 'shortAnswer' => {
    return q.questionType === 'true-false' ? 'trueFalse' : q.questionType === 'short-answer' ? 'shortAnswer' : 'multipleChoice';
  };

  const mapQuestionToLevel = (q: ExtendedQuestionItem): 'recognition' | 'understanding' | 'application' | 'advanced' => {
    return q.cognitiveLevel === 'Thông hiểu' ? 'understanding' : q.cognitiveLevel === 'Vận dụng' ? 'application' : q.cognitiveLevel === 'Vận dụng cao' ? 'advanced' : 'recognition';
  };

  // 1. Add valid pre-selected questions first
  pool.forEach((q) => {
    if (preSelected.has(q.id) && !selectedIds.includes(q.id)) {
      selectedIds.push(q.id);
      const t = mapQuestionToType(q);
      const l = mapQuestionToLevel(q);
      cellAllocations[t][l]++;
    }
  });

  const typeLabels = {
    multipleChoice: 'Nhiều lựa chọn',
    trueFalse: 'Đúng / Sai',
    shortAnswer: 'Trả lời ngắn',
  };

  const levelLabels = {
    recognition: 'Nhận biết',
    understanding: 'Thông hiểu',
    application: 'Vận dụng',
    advanced: 'Vận dụng cao',
  };

  const types: Array<'multipleChoice' | 'trueFalse' | 'shortAnswer'> = ['multipleChoice', 'trueFalse', 'shortAnswer'];
  const levels: Array<'recognition' | 'understanding' | 'application' | 'advanced'> = ['recognition', 'understanding', 'application', 'advanced'];

  // Check if manual selection exceeded target for any cell
  for (const t of types) {
    for (const l of levels) {
      const target = config.matrix2D[t][l] || 0;
      const allocated = cellAllocations[t][l] || 0;
      if (allocated > target && target > 0) {
        excessWarnings.push(
          `Thầy/Cô đã chọn ${allocated} câu [${typeLabels[t]} – ${levelLabels[l]}], vượt quá số lượng theo ma trận (${target} câu).`
        );
      }
    }
  }

  // 2. Auto-fill remaining needed for each cell
  for (const t of types) {
    for (const l of levels) {
      const target = config.matrix2D[t][l] || 0;
      const allocated = cellAllocations[t][l] || 0;
      let needed = target - allocated;

      if (needed > 0) {
        for (const q of pool) {
          if (needed <= 0) break;
          if (selectedIds.includes(q.id)) continue;

          const qType = mapQuestionToType(q);
          const qLevel = mapQuestionToLevel(q);

          if (qType === t && qLevel === l) {
            selectedIds.push(q.id);
            cellAllocations[t][l]++;
            needed--;
          }
        }
      }
    }
  }

  // 3. Fallback safeguard: if total still less than target total (e.g. from general fill), fill in priority order
  if (selectedIds.length < config.total) {
    for (const q of pool) {
      if (selectedIds.length >= config.total) break;
      if (!selectedIds.includes(q.id)) {
        selectedIds.push(q.id);
      }
    }
  }

  return {
    selectedIds: selectedIds.slice(0, config.total),
    excessWarnings,
  };
}

/**
 * Deterministic selection algorithm:
 * Picks questions according to cognitive levels and types, prioritizing:
 * 1. Pre-selected items (if specified)
 * 2. Questions with usageCount === 0
 * 3. Questions with lowest usageCount
 * 4. Questions with oldest lastUsedAt / createdAt
 */
export function autoSelectQuestionsByMatrix(
  bank: ExtendedQuestionItem[],
  config: {
    total: number;
    cognitiveLevels: { recognition: number; understanding: number; application: number; advanced?: number };
    questionTypes?: { multipleChoice: number; trueFalse: number; shortAnswer: number };
    preSelectedIds?: string[];
  }
): string[] {
  const preSelected = new Set(config.preSelectedIds || []);
  const selectedIds: string[] = [];

  // Sort candidate pool by priority: usageCount ascending, then lastUsedAt ascending
  const pool = [...bank].sort((a, b) => {
    const aUsed = a.usageCount || 0;
    const bUsed = b.usageCount || 0;
    if (aUsed !== bUsed) return aUsed - bUsed;
    const aTime = a.lastUsedAt || a.createdAt || 0;
    const bTime = b.lastUsedAt || b.createdAt || 0;
    return aTime - bTime;
  });

  // 1. Add valid pre-selected questions first
  pool.forEach((q) => {
    if (preSelected.has(q.id) && !selectedIds.includes(q.id)) {
      selectedIds.push(q.id);
    }
  });

  // Count current allocations from pre-selected
  const currentLevelCount = {
    recognition: 0,
    understanding: 0,
    application: 0,
    advanced: 0,
  };

  selectedIds.forEach((id) => {
    const q = bank.find((item) => item.id === id);
    if (!q) return;
    if (q.cognitiveLevel === 'Thông hiểu') currentLevelCount.understanding++;
    else if (q.cognitiveLevel === 'Vận dụng') currentLevelCount.application++;
    else if (q.cognitiveLevel === 'Vận dụng cao') currentLevelCount.advanced++;
    else currentLevelCount.recognition++;
  });

  const targetLevels = config.cognitiveLevels;
  const levelKeys: Array<keyof typeof targetLevels> = ['recognition', 'understanding', 'application', 'advanced'];

  // Fill by level requirement
  for (const levelKey of levelKeys) {
    const targetCount = targetLevels[levelKey] || 0;
    const currentCount = currentLevelCount[levelKey] || 0;
    let needed = targetCount - currentCount;

    if (needed > 0) {
      for (const q of pool) {
        if (needed <= 0) break;
        if (selectedIds.includes(q.id)) continue;

        const isMatch =
          (levelKey === 'recognition' && (!q.cognitiveLevel || q.cognitiveLevel === 'Nhận biết')) ||
          (levelKey === 'understanding' && q.cognitiveLevel === 'Thông hiểu') ||
          (levelKey === 'application' && q.cognitiveLevel === 'Vận dụng') ||
          (levelKey === 'advanced' && q.cognitiveLevel === 'Vận dụng cao');

        if (isMatch) {
          selectedIds.push(q.id);
          needed--;
        }
      }
    }
  }

  // Fallback: If still under total, fill with any remaining questions in priority order
  if (selectedIds.length < config.total) {
    for (const q of pool) {
      if (selectedIds.length >= config.total) break;
      if (!selectedIds.includes(q.id)) {
        selectedIds.push(q.id);
      }
    }
  }

  return selectedIds.slice(0, config.total);
}

/**
 * Returns the dedicated question bank for a lesson.
 * If not yet explicitly set, derives it from all questions in the lesson's questionSets.
 */
export function getLessonQuestionBank(lesson: Lesson): ExtendedQuestionItem[] {
  if (Array.isArray(lesson.questionBank) && lesson.questionBank.length > 0) {
    return lesson.questionBank.map((q, idx) => ({
      ...q,
      lessonId: q.lessonId || lesson.id,
      subject: q.subject || lesson.subject,
      grade: q.grade || lesson.grade,
      lessonTitle: q.lessonTitle || lesson.title,
      usageCount: typeof q.usageCount === 'number' ? q.usageCount : 0,
      questionType: q.questionType || 'multiple-choice',
      cognitiveLevel: q.cognitiveLevel || 'Nhận biết',
    }));
  }

  // Fallback / initialization from existing question sets
  const questionMap = new Map<string, ExtendedQuestionItem>();
  if (Array.isArray(lesson.questionSets)) {
    lesson.questionSets.forEach((qs) => {
      qs.questions?.forEach((q, idx) => {
        const qId = q.id || `q-${lesson.id}-${idx + 1}`;
        if (!questionMap.has(qId)) {
          questionMap.set(qId, {
            ...q,
            id: qId,
            lessonId: lesson.id,
            subject: q.subject || lesson.subject,
            grade: q.grade || lesson.grade,
            lessonTitle: q.lessonTitle || lesson.title,
            usageCount: typeof q.usageCount === 'number' ? q.usageCount : 1,
            questionType: q.questionType || 'multiple-choice',
            cognitiveLevel: q.cognitiveLevel || 'Nhận biết',
            createdAt: q.createdAt || Date.now(),
          });
        }
      });
    });
  }

  return Array.from(questionMap.values());
}

/**
 * Updates usageCount and lastUsedAt for questions included in a newly created or saved exam.
 */
export function recordExamQuestionUsage(
  bank: ExtendedQuestionItem[],
  selectedIds: string[]
): ExtendedQuestionItem[] {
  const selectedSet = new Set(selectedIds);
  const now = Date.now();
  return bank.map((q) => {
    if (selectedSet.has(q.id)) {
      return {
        ...q,
        usageCount: (q.usageCount || 0) + 1,
        lastUsedAt: now,
        updatedAt: now,
      };
    }
    return q;
  });
}

/**
 * Resolves an exam's questions from the lesson question bank using questionIds.
 * If questionIds is present, looks up the questions from the bank.
 * Fallbacks to exam.questions if any IDs are missing or questionIds is empty.
 */
export function resolveExamQuestions(
  exam: QuestionSetItem,
  questionBank: ExtendedQuestionItem[]
): ExtendedQuestionItem[] {
  if (Array.isArray(exam.questionIds) && exam.questionIds.length > 0) {
    const bankMap = new Map<string, ExtendedQuestionItem>(
      questionBank.map((q) => [q.id, q])
    );
    const resolved = exam.questionIds
      .map((id) => bankMap.get(id))
      .filter((q): q is ExtendedQuestionItem => !!q);

    if (resolved.length > 0) {
      return resolved;
    }
  }

  return exam.questions || [];
}

export const INITIAL_LESSONS: Lesson[] = [
  // ==================== TOÁN 9 (CHƯƠNG TRÌNH ĐẦY ĐỦ CHƯƠNG I -> X) ====================
  ...TOAN_9_LESSONS,

  // ==================== TOÁN 8 (CHƯƠNG TRÌNH ĐẦY ĐỦ CHƯƠNG I -> X) ====================
  ...TOAN_8_LESSONS,

  // ==================== TOÁN 7 (CHƯƠNG TRÌNH ĐẦY ĐỦ CHƯƠNG I -> X) ====================
  ...TOAN_7_LESSONS,

  // ==================== TOÁN 6 (CHƯƠNG TRÌNH ĐẦY ĐỦ CHƯƠNG I -> IX) ====================
  ...TOAN_6_LESSONS,

  // ==================== KHOA HỌC TỰ NHIÊN 8 ====================
  {
    id: 'lesson-sci8-b1',
    subjectId: 'science',
    gradeId: 'grade-8',
    grade: 8,
    subject: 'Khoa học tự nhiên',
    chapter: 'Chương 1: Phản ứng hóa học',
    lessonNumber: 1,
    code: 'KHTN8-B1',
    title: 'Bài 1: Biến đổi vật lí và Biến đổi hóa học',
    shortTitle: 'Biến đổi hóa học',
    description: 'Phân biệt hiện tượng vật lí và hiện tượng hóa học, dấu hiệu nhận biết phản ứng hóa học.',
    presentations: [],
    questionSets: [
      {
        id: 'qs-sci8-1',
        title: 'Bộ đề 1: Phân biệt biến đổi vật lí và hóa học',
        description: 'Trắc nghiệm hiện tượng thực tiễn trong tự nhiên',
        type: 'practice',
        createdAt: Date.now() - 86400000,
        questionCount: 4,
        stats: { recognition: 2, understanding: 2, application: 0, advanced: 0 },
        questions: [
          {
            id: 'qsci-1',
            subject: 'Khoa học tự nhiên',
            grade: 8,
            lessonTitle: 'Biến đổi hóa học',
            questionType: 'multiple-choice',
            cognitiveLevel: 'Nhận biết',
            content: 'Hiện tượng nào sau đây là hiện tượng hóa học?',
            options: [
              { key: QuizOptionKeyEnum.A, text: 'Đinh sắt để ngoài không khí bị gỉ sét' },
              { key: QuizOptionKeyEnum.B, text: 'Cồn bay hơi khi mở nắp lọ' },
              { key: QuizOptionKeyEnum.C, text: 'Nước đá tan thành nước lỏng' },
              { key: QuizOptionKeyEnum.D, text: 'Hòa tan đường vào cốc nước' },
            ],
            correctAnswer: QuizOptionKeyEnum.A,
            explanation: 'Đinh sắt gỉ sinh ra chất mới là gỉ sắt ($Fe_2O_3 \\cdot nH_2O$) nên là hiện tượng hóa học.',
          },
          {
            id: 'qsci-2',
            subject: 'Khoa học tự nhiên',
            grade: 8,
            lessonTitle: 'Biến đổi hóa học',
            questionType: 'multiple-choice',
            cognitiveLevel: 'Thông hiểu',
            content: 'Dấu hiệu nào sau đây CHẮC CHẮN chứng tỏ có phản ứng hóa học xảy ra?',
            options: [
              { key: QuizOptionKeyEnum.A, text: 'Có chất mới sinh ra' },
              { key: QuizOptionKeyEnum.B, text: 'Có sự thay đổi hình dạng' },
              { key: QuizOptionKeyEnum.C, text: 'Chất bị nóng lên do đun' },
              { key: QuizOptionKeyEnum.D, text: 'Chất bị nghiền nhỏ' },
            ],
            correctAnswer: QuizOptionKeyEnum.A,
            explanation: 'Bản chất của phản ứng hóa học là sự tạo thành chất mới có tính chất khác biệt chất ban đầu.',
          },
          {
            id: 'qsci-3',
            subject: 'Khoa học tự nhiên',
            grade: 8,
            lessonTitle: 'Biến đổi hóa học',
            questionType: 'true-false',
            cognitiveLevel: 'Nhận biết',
            content: 'Hiện tượng quang hợp ở cây xanh là một quá trình biến đổi hóa học. Đúng hay Sai?',
            options: [
              { key: QuizOptionKeyEnum.A, text: 'Đúng' },
              { key: QuizOptionKeyEnum.B, text: 'Sai' },
            ],
            correctAnswer: QuizOptionKeyEnum.A,
            explanation: 'Quang hợp biến đổi $CO_2$ và $H_2O$ thành glucose ($C_6H_{12}O_6$) và khí $O_2$ (sinh ra chất mới).',
          },
          {
            id: 'qsci-4',
            subject: 'Khoa học tự nhiên',
            grade: 8,
            lessonTitle: 'Biến đổi hóa học',
            questionType: 'multiple-choice',
            cognitiveLevel: 'Thông hiểu',
            content: 'Khi đốt cháy khí gas (methane $CH_4$), sản phẩm sinh ra gồm những chất nào?',
            options: [
              { key: QuizOptionKeyEnum.A, text: 'Khí carbon dioxide ($CO_2$) và hơi nước ($H_2O$)' },
              { key: QuizOptionKeyEnum.B, text: 'Khí hydrogen ($H_2$) và than carbon' },
              { key: QuizOptionKeyEnum.C, text: 'Chỉ có khí $CO_2$' },
              { key: QuizOptionKeyEnum.D, text: 'Khí oxygen ($O_2$) và nước' },
            ],
            correctAnswer: QuizOptionKeyEnum.A,
            explanation: 'Phản ứng đốt cháy: $CH_4 + 2O_2 \\rightarrow CO_2 + 2H_2O$.',
          },
        ],
      },
    ],
  },
];
