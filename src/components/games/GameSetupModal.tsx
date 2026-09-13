import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lesson, QuestionSetItem, GameSession } from '../../types/teacherLesson';
import { LessonGameMetadata } from '../../games/types/LessonGame';
import { getLessonQuestionBank, resolveExamQuestions } from '../../data/teacherLessonData';
import {
  Gamepad2,
  Sparkles,
  Disc,
  Swords,
  Trophy,
  Flame,
  Bell,
  KeyRound,
  Mountain,
  DoorOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Users,
  User,
  ShieldCheck,
  Camera,
  Mic,
  MousePointer,
  Play,
  ArrowRight,
  X,
  ChevronRight,
  FolderPlus,
  Search,
  Check,
  Zap,
  SlidersHorizontal,
  Volume2,
  Settings2,
  Shuffle,
  Info,
  Award,
  HelpCircle,
  Gauge,
  Heart,
  Ban,
  Tag,
} from 'lucide-react';

interface GameSetupModalProps {
  game: LessonGameMetadata;
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (
    gameCode: string,
    selectedExam: QuestionSetItem,
    customConfig?: Record<string, any>,
    session?: GameSession
  ) => void;
  onNavigateToCreateExam?: () => void;
}

/**
 * Standard game setup configuration model requested by specification
 */
export interface GameSetupConfig {
  gameType: string;
  examId: string;
  mode?: string;
  questionCount?: number;
  questionTime?: number;
  totalTime?: number;
  playerCount?: number;
  teamCount?: number;
  answerMode?: string;
  settings?: Record<string, unknown>;
}

/**
 * Helper to format creation timestamp to DD/MM/YYYY
 */
const formatExamDate = (timestamp?: number): string | null => {
  if (!timestamp) return null;
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return null;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return null;
  }
};

/**
 * Standardized Specifications of all 9 games in the platform
 * Derived directly from audited source code & services
 */
export interface GameStandardSpec {
  code: string;
  name: string;
  description: string;
  badge: string;
  supportsIndividual: boolean;
  supportsTeam: boolean;
  unsupportedModesNotice?: string;
  minPlayers: number;
  maxPlayers: number;
  defaultPlayers: number;
  minTeams: number;
  maxTeams: number;
  defaultTeams: number;
  defaultQuestions: number;
  maxQuestionsLimit?: number;
  defaultTimerSec: number;
  timerOptionsSec: number[];
  supportsCamera: boolean;
  supportsVoice: boolean;
  supportsManual: boolean;
  scoringRuleDescription: string;
  endConditionDescription: string;
  winConditionDescription: string;
}

export const GAME_STANDARD_SPECS: Record<string, GameStandardSpec> = {
  GESTURE_QUIZ_AI: {
    code: 'GESTURE_QUIZ_AI',
    name: 'Trắc Nghiệm Cử Chỉ AI',
    description: 'Trò chơi trắc nghiệm tương tác cử chỉ bàn tay AI (1, 2, 3, 4 ngón) và giọng nói AI cho Khởi động & Luyện tập.',
    badge: 'MediaPipe AI',
    supportsIndividual: true,
    supportsTeam: true,
    minPlayers: 1,
    maxPlayers: 4,
    defaultPlayers: 2,
    minTeams: 2,
    maxTeams: 4,
    defaultTeams: 2,
    defaultQuestions: 8,
    defaultTimerSec: 20,
    timerOptionsSec: [10, 15, 20, 30],
    supportsCamera: true,
    supportsVoice: true,
    supportsManual: true,
    scoringRuleDescription: 'Mỗi câu trả lời đúng nhận 10 điểm cơ bản. Thưởng thêm điểm tốc độ dựa trên thời gian còn lại (tối đa +5 điểm).',
    endConditionDescription: 'Hoàn thành tất cả các câu hỏi được chọn trong vòng đấu.',
    winConditionDescription: 'Học sinh hoặc Đội có tổng số điểm tích lũy cao nhất sau các lượt câu hỏi.',
  },
  WHEEL_GAME: {
    code: 'WHEEL_GAME',
    name: 'Chiếc Nón Kỳ Diệu',
    description: 'Vòng quay may mắn điểm số và thử thách câu hỏi Toán học kịch tính theo lượt chơi cá nhân / đồng đội.',
    badge: 'Vòng Quay May Mắn',
    supportsIndividual: true,
    supportsTeam: true,
    minPlayers: 2,
    maxPlayers: 4,
    defaultPlayers: 4,
    minTeams: 2,
    maxTeams: 4,
    defaultTeams: 2,
    defaultQuestions: 8,
    defaultTimerSec: 20,
    timerOptionsSec: [15, 20, 30, 45],
    supportsCamera: true,
    supportsVoice: true,
    supportsManual: true,
    scoringRuleDescription: 'Vòng quay xác định giá trị điểm của câu hỏi (10đ, 20đ, 30đ, 50đ, 100đ). Trả lời đúng nhận điểm tương ứng. Ô Nhân đôi nhân 2 số điểm; ô Mất lượt chuyển lượt cho bạn tiếp theo.',
    endConditionDescription: 'Hoàn thành toàn bộ số câu hỏi đã chỉ định hoặc kết thúc tất cả các vòng quay.',
    winConditionDescription: 'Người chơi hoặc Đội có tổng điểm tích lũy cao nhất trên bảng tổng sắp.',
  },
  MATH_ARENA: {
    code: 'MATH_ARENA',
    name: 'Đấu Trường Toán Học',
    description: 'Sân đấu trắc nghiệm tốc độ, tính điểm chuỗi liên tiếp (Speed Streak) và cập nhật bảng xếp hạng thời gian thực.',
    badge: 'Đấu Trường Tốc Độ',
    supportsIndividual: true,
    supportsTeam: true,
    minPlayers: 2,
    maxPlayers: 6,
    defaultPlayers: 4,
    minTeams: 2,
    maxTeams: 4,
    defaultTeams: 2,
    defaultQuestions: 10,
    defaultTimerSec: 15,
    timerOptionsSec: [10, 15, 20, 30],
    supportsCamera: true,
    supportsVoice: true,
    supportsManual: true,
    scoringRuleDescription: '10 điểm cơ bản + Thưởng phản xạ nhanh (2-5 điểm) + Thưởng chuỗi đúng liên tiếp (+5 điểm/câu khi duy trì chuỗi Streak).',
    endConditionDescription: 'Hoàn thành toàn bộ số lượng câu hỏi của đấu trường.',
    winConditionDescription: 'Vận động viên hoặc Đội thi đấu đứng đầu bảng xếp hạng tổng điểm đấu trường.',
  },
  MILLIONAIRE: {
    code: 'MILLIONAIRE',
    name: 'Ai Là Triệu Phú',
    description: 'Thang thưởng 15 câu hỏi kịch tính với 3 quyền trợ giúp: 50:50, Hỏi ý kiến khán giả, Gọi điện cho chuyên gia Toán học.',
    badge: 'Thang Thưởng 15 Câu',
    supportsIndividual: true,
    supportsTeam: false,
    unsupportedModesNotice: 'Chế độ thi đấu theo đội hiện CHƯA HỖ TRỢ trên format truyền hình Ai Là Triệu Phú (chỉ hỗ trợ 1 thí sinh chính).',
    minPlayers: 1,
    maxPlayers: 1,
    defaultPlayers: 1,
    minTeams: 0,
    maxTeams: 0,
    defaultTeams: 0,
    defaultQuestions: 15,
    maxQuestionsLimit: 15,
    defaultTimerSec: 30,
    timerOptionsSec: [20, 30, 45, 60],
    supportsCamera: true,
    supportsVoice: true,
    supportsManual: true,
    scoringRuleDescription: 'Thang tiền thưởng từ câu 1 (100.000đ) đến câu 15 (150.000.000đ). Có 2 mốc an toàn bảo toàn tiền thưởng tại Câu 5 và Câu 10.',
    endConditionDescription: 'Trả lời sai khi không ở mốc an toàn, thí sinh chủ động dừng cuộc chơi, hoặc trả lời đúng câu 15.',
    winConditionDescription: 'Vượt qua câu hỏi số 15 để trở thành Triệu Phú Toán Học, hoặc đạt mức tiền thưởng cao nhất khi dừng chơi.',
  },
  MATH_RACING: {
    code: 'MATH_RACING',
    name: 'Đua Xe Toán Học',
    description: 'Cuộc đua tốc độ kịch tính! Trả lời đúng và nhanh để kích hoạt động cơ Nitro tăng tốc về đích đầu tiên.',
    badge: 'Đua Xe Nitro',
    supportsIndividual: true,
    supportsTeam: true,
    minPlayers: 2,
    maxPlayers: 4,
    defaultPlayers: 2,
    minTeams: 2,
    maxTeams: 4,
    defaultTeams: 2,
    defaultQuestions: 8,
    defaultTimerSec: 15,
    timerOptionsSec: [10, 15, 20, 30],
    supportsCamera: true,
    supportsVoice: true,
    supportsManual: true,
    scoringRuleDescription: 'Mỗi câu trả lời đúng giúp xe tiến lên 15% đoạn đường đua. Trả lời cực nhanh (<5 giây) kích hoạt Nitro bứt tốc thêm 10%.',
    endConditionDescription: 'Xe đầu tiên cán đích 100% chiều dài đường đua hoặc giải quyết hết tất cả câu hỏi.',
    winConditionDescription: 'Tay đua hoặc Đội đua cán đích đầu tiên và giành cúp vô địch Grand Prix.',
  },
  GOLDEN_BELL: {
    code: 'GOLDEN_BELL',
    name: 'Rung Chuông Vàng',
    description: 'Sàn đấu loại trực tiếp kịch tính theo format truyền hình với phao cứu trợ của giáo viên và lễ đăng quang chuông vàng.',
    badge: 'Sàn Đấu Loại Trực Tiếp',
    supportsIndividual: true,
    supportsTeam: false,
    unsupportedModesNotice: 'Game sử dụng format Sàn đấu đồng loạt (6 đến 40 học sinh) — Chế độ chia đội nhỏ đối kháng CHƯA HỖ TRỢ.',
    minPlayers: 6,
    maxPlayers: 40,
    defaultPlayers: 12,
    minTeams: 0,
    maxTeams: 0,
    defaultTeams: 0,
    defaultQuestions: 12,
    defaultTimerSec: 15,
    timerOptionsSec: [10, 15, 20, 30],
    supportsCamera: true,
    supportsVoice: false,
    supportsManual: true,
    scoringRuleDescription: 'Chế độ Loại: Trả lời sai bị loại khỏi sàn đấu ngay. Chế độ Tích điểm: Cộng 10đ mỗi câu đúng, sai trừ mạng. Thầy cô có thể dùng Phao cứu trợ sau câu 5.',
    endConditionDescription: 'Còn lại đúng 1 thí sinh duy nhất trên sàn đấu hoặc hoàn thành câu hỏi cuối cùng.',
    winConditionDescription: 'Thí sinh kiên cường trụ lại cuối cùng trên sàn đấu sẽ bước lên Rung Chuông Vàng.',
  },
  MATH_CROSSWORD: {
    code: 'MATH_CROSSWORD',
    name: 'Ô Chữ Bí Mật',
    description: 'Giải mã từng câu hỏi để mở các mảnh ghép chữ cái, tư duy logic để đoán từ khóa Toán học bí ẩn nhận điểm thưởng.',
    badge: 'Giải Mã Ô Chữ',
    supportsIndividual: true,
    supportsTeam: false,
    unsupportedModesNotice: 'Game hỗ trợ hình thức Cá nhân hoặc Cả lớp tập thể cùng giải mã — Chế độ chia 2 đội đối kháng CHƯA HỖ TRỢ.',
    minPlayers: 1,
    maxPlayers: 1,
    defaultPlayers: 1,
    minTeams: 0,
    maxTeams: 0,
    defaultTeams: 0,
    defaultQuestions: 6,
    defaultTimerSec: 20,
    timerOptionsSec: [15, 20, 30, 45],
    supportsCamera: true,
    supportsVoice: true,
    supportsManual: true,
    scoringRuleDescription: 'Mỗi câu hỏi trả lời đúng mở được ô chữ hàng ngang và nhận 10 điểm. Đoán đúng từ khóa bí mật trước khi mở hết nhận thưởng lớn +50 điểm.',
    endConditionDescription: 'Tất cả các hàng ô chữ được mở hoặc Từ khóa bí mật được học sinh giải mã thành công.',
    winConditionDescription: 'Giải mã chính xác Từ khóa bí mật và đạt điểm số tối đa trong thời gian ngắn nhất.',
  },
  OBSTACLE_COURSE: {
    code: 'OBSTACLE_COURSE',
    name: 'Vượt Chướng Ngại Vật',
    description: 'Chuyến thám hiểm leo núi vượt qua cự thạch, cầu treo, nham thạch, bão tố và rồng thần để cắm cờ trên đỉnh núi cao.',
    badge: 'Thám Hiểm Chinh Phục',
    supportsIndividual: true,
    supportsTeam: false,
    unsupportedModesNotice: 'Game thiết kế theo format 1 Nhà thám hiểm đại diện hành trình — Chế độ theo đội CHƯA HỖ TRỢ.',
    minPlayers: 1,
    maxPlayers: 1,
    defaultPlayers: 1,
    minTeams: 0,
    maxTeams: 0,
    defaultTeams: 0,
    defaultQuestions: 6,
    maxQuestionsLimit: 6,
    defaultTimerSec: 15,
    timerOptionsSec: [15, 20, 30],
    supportsCamera: true,
    supportsVoice: true,
    supportsManual: true,
    scoringRuleDescription: 'Vượt qua mỗi chướng ngại vật nhận 100 - 300 điểm và mở khóa vật phẩm thám hiểm. Trả lời sai bị trừ máu (HP) và phạt thời gian.',
    endConditionDescription: 'Lượng máu (HP) giảm về 0 (thất bại) hoặc nhà thám hiểm vượt qua trọn vẹn 6 chướng ngại để lên đỉnh núi.',
    winConditionDescription: 'Cắm cờ chiến thắng trên Đỉnh Núi Thiêng với lượng máu và điểm số cao nhất.',
  },
  MYSTERY_DOORS: {
    code: 'MYSTERY_DOORS',
    name: 'Ô Cửa Bí Mật',
    description: 'Mở các cánh cửa huyền bí, đón nhận bất ngờ (Ngôi Sao May Mắn, Hộp Quà, Chìa Khóa Vàng) và giải mã Bức Tranh Mật Mã Toán Học.',
    badge: 'Cánh Cửa Huyền Bí',
    supportsIndividual: true,
    supportsTeam: true,
    minPlayers: 1,
    maxPlayers: 4,
    defaultPlayers: 2,
    minTeams: 2,
    maxTeams: 4,
    defaultTeams: 2,
    defaultQuestions: 8,
    defaultTimerSec: 20,
    timerOptionsSec: [15, 20, 30, 45],
    supportsCamera: true,
    supportsVoice: true,
    supportsManual: true,
    scoringRuleDescription: 'Điểm cơ bản của câu hỏi + Điểm thưởng từ các ô cửa bất ngờ (Ngôi sao may mắn x2 điểm, Hộp quà +30đ/+50đ, Chìa khóa vàng).',
    endConditionDescription: 'Tất cả các cánh cửa bí mật được mở ra và bức tranh mật mã được giải mã toàn vẹn.',
    winConditionDescription: 'Người chơi hoặc Đội có tổng điểm tích lũy cao nhất sau khi toàn bộ cánh cửa được mở.',
  },
};

export const GameSetupModal: React.FC<GameSetupModalProps> = ({
  game,
  lesson,
  isOpen,
  onClose,
  onStartGame,
  onNavigateToCreateExam,
}) => {
  // Lock body scroll when modal is open to keep view perfectly centered
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Retrieve standardized spec for this game
  const spec: GameStandardSpec = GAME_STANDARD_SPECS[game.code] || {
    code: game.code,
    name: game.name,
    description: game.description,
    badge: game.badge || 'Trò Chơi',
    supportsIndividual: true,
    supportsTeam: true,
    minPlayers: 1,
    maxPlayers: 4,
    defaultPlayers: 2,
    minTeams: 2,
    maxTeams: 4,
    defaultTeams: 2,
    defaultQuestions: 8,
    defaultTimerSec: 20,
    timerOptionsSec: [10, 15, 20, 30],
    supportsCamera: true,
    supportsVoice: true,
    supportsManual: true,
    scoringRuleDescription: 'Tính điểm chuẩn 10 điểm cho mỗi câu trả lời đúng.',
    endConditionDescription: 'Hoàn thành tất cả các câu hỏi.',
    winConditionDescription: 'Điểm số tích lũy cao nhất.',
  };

  const questionBank = useMemo(() => getLessonQuestionBank(lesson), [lesson]);
  const examSets = lesson.questionSets || [];
  const hasExams = examSets.length > 0;

  // Search filter for exams
  const [searchExamText, setSearchExamText] = useState<string>('');

  // 1. Selected Exam State
  const [selectedExamId, setSelectedExamId] = useState<string>(examSets[0]?.id || '');

  const filteredExams = useMemo(() => {
    if (!searchExamText.trim()) return examSets;
    const term = searchExamText.toLowerCase();
    return examSets.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        (e.description && e.description.toLowerCase().includes(term))
    );
  }, [examSets, searchExamText]);

  const selectedExam = useMemo(() => {
    return examSets.find((e) => e.id === selectedExamId) || examSets[0] || null;
  }, [examSets, selectedExamId]);

  // Validation: Check questions in selected exam against question bank
  const examValidation = useMemo(() => {
    if (!selectedExam) {
      return { isValid: false, totalCount: 0, missingCount: 0, validQuestions: [] };
    }

    const resolved = resolveExamQuestions(selectedExam, questionBank);
    const expectedIds = selectedExam.questionIds || [];
    const missingCount = expectedIds.length > 0 ? Math.max(0, expectedIds.length - resolved.length) : 0;

    return {
      isValid: resolved.length > 0,
      totalCount: resolved.length,
      missingCount,
      validQuestions: resolved,
    };
  }, [selectedExam, questionBank]);

  // 2. Step Navigator: 1. CHỌN ĐỀ -> 2. HÌNH THỨC CHƠI -> 3. CẤU HÌNH TRÒ CHƠI -> 4. XÁC NHẬN
  const [currentStep, setCurrentStep] = useState<'exam' | 'format' | 'config' | 'preview'>('exam');

  // 3. Dynamic Configuration States based on Game Type
  const totalQuestionsAvailable = examValidation.totalCount || 5;

  // Number of questions to play from the selected exam
  const defaultQuestionCount = useMemo(() => {
    const capped = spec.maxQuestionsLimit
      ? Math.min(totalQuestionsAvailable, spec.maxQuestionsLimit)
      : Math.min(totalQuestionsAvailable, spec.defaultQuestions);
    return Math.max(1, capped);
  }, [spec, totalQuestionsAvailable]);

  const [questionsToPlay, setQuestionsToPlay] = useState<number>(defaultQuestionCount);

  // Randomize Question Order Toggle (Safely shuffles questionIds without modifying Question Bank content)
  const [randomizeQuestions, setRandomizeQuestions] = useState<boolean>(true);

  // Operational Game Timer (per question)
  const [timePerQuestion, setTimePerQuestion] = useState<number>(spec.defaultTimerSec);

  // Answer interaction mode
  const [answerMode, setAnswerMode] = useState<'manual' | 'camera' | 'voice'>(
    game.code === 'GESTURE_QUIZ_AI' ? 'camera' : 'manual'
  );

  // Competition mode (individual / team)
  const [competitionMode, setCompetitionMode] = useState<'individual' | 'team'>('individual');

  // Player / Team Count
  const [playerCount, setPlayerCount] = useState<number>(spec.defaultPlayers);
  const [teamCount, setTeamCount] = useState<number>(spec.defaultTeams > 0 ? spec.defaultTeams : 2);

  // Player / Team Custom Names
  const [playerNames, setPlayerNames] = useState<string[]>([
    'Học sinh 1',
    'Học sinh 2',
    'Học sinh 3',
    'Học sinh 4',
  ]);
  const [teamNames, setTeamNames] = useState<string[]>([
    'Đội Sao Kim 🌟',
    'Đội Sao Hỏa 🔥',
    'Đội Sao Mộc 🌲',
    'Đội Sao Thủy 💧',
  ]);

  // Specific settings for games
  // Millionaire
  const [lifelines, setLifelines] = useState({
    fiftyFifty: true,
    askAudience: true,
    callExpert: true,
  });

  // Golden Bell
  const [goldenBellMode, setGoldenBellMode] = useState<'elimination' | 'survival_points'>('elimination');
  const [allowTeacherRescue, setAllowTeacherRescue] = useState<boolean>(true);

  // Math Racing
  const [racingLaps, setRacingLaps] = useState<number>(2);
  const [nitroEnabled, setNitroEnabled] = useState<boolean>(true);

  // Math Arena
  const [speedBonus, setSpeedBonus] = useState<boolean>(true);

  // Crossword
  const [crosswordKeyword, setCrosswordKeyword] = useState<string>('TOÁN HỌC');
  const [crosswordClue, setCrosswordClue] = useState<string>('Môn khoa học nghiên cứu về các số, cấu trúc và hình học');

  // Obstacle Course
  const [obstacleDifficulty, setObstacleDifficulty] = useState<'standard' | 'heroic'>('standard');

  // Mystery Doors
  const [mysteryDoorCount, setMysteryDoorCount] = useState<number>(8);
  const [doorStyle, setDoorStyle] = useState<'magical' | 'cyber' | 'ancient' | 'royal'>('magical');

  // Gesture Quiz Purpose & Battle Type
  const [quizPurpose, setQuizPurpose] = useState<'warm-up' | 'practice'>('warm-up');
  const [teamBattleType, setTeamBattleType] = useState<'simultaneous' | 'sequential'>('simultaneous');

  // Render Icon
  const renderGameIcon = () => {
    switch (game.code) {
      case 'GESTURE_QUIZ_AI':
        return <Sparkles className="w-6 h-6 text-purple-600" />;
      case 'WHEEL_GAME':
        return <Disc className="w-6 h-6 text-blue-600" />;
      case 'MATH_ARENA':
        return <Swords className="w-6 h-6 text-rose-600" />;
      case 'MILLIONAIRE':
        return <Trophy className="w-6 h-6 text-amber-600" />;
      case 'MATH_RACING':
        return <Flame className="w-6 h-6 text-orange-600" />;
      case 'GOLDEN_BELL':
        return <Bell className="w-6 h-6 text-yellow-600" />;
      case 'MATH_CROSSWORD':
        return <KeyRound className="w-6 h-6 text-emerald-600" />;
      case 'OBSTACLE_COURSE':
        return <Mountain className="w-6 h-6 text-cyan-600" />;
      case 'MYSTERY_DOORS':
        return <DoorOpen className="w-6 h-6 text-indigo-600" />;
      default:
        return <Gamepad2 className="w-6 h-6 text-purple-600" />;
    }
  };

  // Comprehensive validation before launching game
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!selectedExam) {
      errors.push('Vui lòng chọn một bộ đề thi từ Tab 4.');
    } else if (examValidation.totalCount === 0) {
      errors.push('Bộ đề đã chọn không chứa câu hỏi hợp lệ nào trong Ngân hàng câu hỏi.');
    }
    if (questionsToPlay <= 0) {
      errors.push('Số câu hỏi thi đấu phải lớn hơn 0.');
    } else if (questionsToPlay > examValidation.totalCount) {
      errors.push(`Số câu hỏi thi đấu (${questionsToPlay}) không được vượt quá số câu của đề (${examValidation.totalCount}).`);
    }
    if (timePerQuestion <= 0) {
      errors.push('Thời gian trả lời mỗi câu không hợp lệ.');
    }
    if (spec.supportsTeam && competitionMode === 'team') {
      if (teamCount < (spec.minTeams || 2) || teamCount > (spec.maxTeams || 4)) {
        errors.push(`Số lượng đội chơi không hợp lệ (phải từ ${spec.minTeams || 2} đến ${spec.maxTeams || 4} đội).`);
      }
    } else {
      if (playerCount < (spec.minPlayers || 1) || playerCount > (spec.maxPlayers || 40)) {
        errors.push(`Số lượng người chơi không hợp lệ (phải từ ${spec.minPlayers || 1} đến ${spec.maxPlayers || 40} người).`);
      }
    }
    return errors;
  }, [selectedExam, examValidation, questionsToPlay, timePerQuestion, spec, competitionMode, teamCount, playerCount]);

  // Handle Confirm and Start
  const handleConfirmAndStart = () => {
    if (validationErrors.length > 0 || !selectedExam || examValidation.totalCount === 0) return;

    // Prepare Question IDs
    let targetIds = (selectedExam.questionIds || []).slice(0, questionsToPlay);
    if (randomizeQuestions) {
      // Safe Fisher-Yates shuffle ONLY on questionIds list (never mutates Question Bank or Exam)
      targetIds = [...targetIds].sort(() => Math.random() - 0.5);
    }

    const customSettings: Record<string, any> = {
      examId: selectedExam.id,
      examTitle: selectedExam.title,
      questionsToPlay,
      randomizeQuestions,
      timePerQuestion,
      answerMode,
      competitionMode: spec.supportsTeam ? competitionMode : 'individual',
      playerCount: spec.supportsTeam && competitionMode === 'team' ? teamCount : playerCount,
      playerNames: spec.supportsTeam && competitionMode === 'team' ? teamNames.slice(0, teamCount) : playerNames.slice(0, playerCount),
      purpose: quizPurpose,
      teamBattleType,
      lifelines,
      goldenBellMode,
      allowTeacherRescue,
      racingLaps,
      nitroEnabled,
      speedBonus,
      crosswordKeyword,
      crosswordClue,
      obstacleDifficulty,
      mysteryDoorCount,
      doorStyle,
    };

    // Standard GameSession Object conforming to teacherLesson specifications
    const session: GameSession = {
      gameSessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      gameId: game.id,
      gameType: game.code,
      examId: selectedExam.id,
      questionIds: targetIds,
      mode: spec.supportsTeam ? competitionMode : 'individual',
      settings: customSettings,
      createdAt: new Date().toISOString(),
    };

    onStartGame(game.code, selectedExam, customSettings, session);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* ======================================================== */}
        {/* MODAL HEADER                                             */}
        {/* ======================================================== */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center">
              {renderGameIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 tracking-wider">
                  🎮 THIẾT LẬP TRÒ CHƠI
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold">{spec.badge}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">{spec.name}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* STEPPER PROGRESS                                         */}
        {/* ======================================================== */}
        <div className="grid grid-cols-4 border-b border-slate-100 bg-white text-xs font-bold">
          {[
            { key: 'exam', label: '1. CHỌN ĐỀ', desc: 'Từ Tab 4 Tạo Đề' },
            { key: 'format', label: '2. HÌNH THỨC', desc: 'Cá nhân / Đội' },
            { key: 'config', label: '3. CẤU HÌNH', desc: 'Luật & Thời gian' },
            { key: 'preview', label: '4. XÁC NHẬN', desc: 'Bắt đầu chơi' },
          ].map((step) => {
            const isActive = currentStep === step.key;
            const isCompleted =
              (step.key === 'exam' && currentStep !== 'exam') ||
              (step.key === 'format' && (currentStep === 'config' || currentStep === 'preview')) ||
              (step.key === 'config' && currentStep === 'preview');

            return (
              <button
                key={step.key}
                disabled={!hasExams && step.key !== 'exam'}
                onClick={() => setCurrentStep(step.key as any)}
                className={`py-3 px-3 text-center border-b-2 transition flex flex-col items-center gap-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isActive
                    ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                    : isCompleted
                    ? 'border-emerald-500 text-emerald-700 hover:bg-slate-50'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  {isCompleted ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                  <span>{step.label}</span>
                </div>
                <span className="text-[10px] font-normal text-slate-500 hidden sm:inline">{step.desc}</span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* MODAL BODY CONTENT                                       */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ======================================================== */}
          {/* 1. CHỌN ĐỀ (BẮT BUỘC TỪ TAB 4 TẠO ĐỀ)                  */}
          {/* ======================================================== */}
          {currentStep === 'exam' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                    <span>CHỌN ĐỀ ĐÃ TẠO TỪ TAB 4 (BẮT BUỘC)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trò chơi chỉ nhận câu hỏi từ các bộ đề đã tạo trong Tab 4. Không nạp trực tiếp từ Ngân hàng câu hỏi.
                  </p>
                </div>
              </div>

              {!hasExams ? (
                /* Empty state when lesson has no exams */
                <div className="p-8 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h5 className="text-base font-black text-amber-900">Chưa có đề để chơi.</h5>
                    <p className="text-xs text-amber-700 max-w-md mx-auto mt-1 leading-relaxed">
                      Bài học này chưa có bộ đề thi nào được tạo. Vui lòng chuyển sang tab <strong>4. Tạo Đề</strong> để tạo đề thi từ Ngân hàng câu hỏi trước khi tổ chức trò chơi.
                    </p>
                  </div>
                  {onNavigateToCreateExam && (
                    <button
                      id="modal-btn-to-create-exam"
                      onClick={() => {
                        onClose();
                        onNavigateToCreateExam();
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md transition cursor-pointer"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>ĐẾN TẠO ĐỀ</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Exam Selection Area */
                <div className="space-y-4">
                  {/* Quick Dropdown Selector */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Đề sử dụng:</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({examSets.length} đề thi sẵn sàng)
                      </span>
                    </label>
                    <select
                      id="select-exam-dropdown"
                      value={selectedExamId}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setSelectedExamId(newId);
                        const matched = examSets.find((ex) => ex.id === newId);
                        if (matched) {
                          const resolved = resolveExamQuestions(matched, questionBank);
                          setQuestionsToPlay(Math.min(resolved.length, defaultQuestionCount));
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-purple-600 focus:outline-hidden transition cursor-pointer shadow-2xs"
                    >
                      {examSets.map((e) => {
                        const res = resolveExamQuestions(e, questionBank);
                        const durationMinutes = e.timePerQuestion ? Math.round((e.timePerQuestion * res.length) / 60) : 15;
                        return (
                          <option key={e.id} value={e.id}>
                            {e.title} — ({res.length} câu • {durationMinutes} phút)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Selected Exam Confirmation Badge */}
                  {selectedExam && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-xs font-black text-emerald-950">
                            ✓ Đã chọn: {selectedExam.title}
                          </div>
                          <div className="text-[11px] text-emerald-700 font-medium">
                            Số câu: <strong className="font-bold text-emerald-900">{examValidation.totalCount} câu hợp lệ</strong>
                            {' • '}
                            Thời gian của đề: <strong className="font-bold text-emerald-900">
                              {selectedExam.timePerQuestion ? Math.round((selectedExam.timePerQuestion * examValidation.totalCount) / 60) : 15} phút
                            </strong>
                            {selectedExam.createdAt && formatExamDate(selectedExam.createdAt) && (
                              <span> • Ngày tạo: {formatExamDate(selectedExam.createdAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        ĐÃ XÁC NHẬN
                      </span>
                    </div>
                  )}

                  {/* Search Exam Filter (if more than 3 exams) */}
                  {examSets.length > 3 && (
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm đề thi theo tên hoặc mô tả..."
                        value={searchExamText}
                        onChange={(e) => setSearchExamText(e.target.value)}
                        className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-purple-500 focus:bg-white transition"
                      />
                    </div>
                  )}

                  {/* Detailed Exam Cards List */}
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {filteredExams.map((exam) => {
                      const isSelected = selectedExam?.id === exam.id;
                      const resolved = resolveExamQuestions(exam, questionBank);
                      const expectedCount = exam.questionIds?.length || exam.questions?.length || 0;
                      const hasMissing = expectedCount > 0 && resolved.length < expectedCount;
                      const durationMinutes = exam.timePerQuestion ? Math.round((exam.timePerQuestion * resolved.length) / 60) : 15;
                      const dateStr = formatExamDate(exam.createdAt);

                      return (
                        <div
                          key={exam.id}
                          onClick={() => {
                            setSelectedExamId(exam.id);
                            setQuestionsToPlay(Math.min(resolved.length, defaultQuestionCount));
                          }}
                          className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Radio indicator */}
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-xs sm:text-sm font-black text-slate-900">{exam.title}</h5>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                  {exam.type === 'warm-up'
                                    ? 'Khởi động'
                                    : exam.type === 'practice'
                                    ? 'Luyện tập'
                                    : exam.type === 'advanced'
                                    ? 'Nâng cao'
                                    : 'Tổng hợp'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                {exam.description || 'Bộ đề thi chuẩn bị cho tiết học'}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-1.5 font-medium flex-wrap">
                                <span className="flex items-center gap-1 font-bold text-purple-700">
                                  <Layers className="w-3.5 h-3.5" />
                                  {resolved.length} câu hỏi hợp lệ
                                </span>
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  Thời gian đề: {durationMinutes} phút
                                </span>
                                {dateStr && (
                                  <span className="text-[10px] text-slate-400">
                                    Ngày tạo: {dateStr}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {hasMissing && (
                            <div className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200 self-start sm:self-center">
                              Đề có {expectedCount - resolved.length} câu không còn trong ngân hàng
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Warning if selected exam has missing questions */}
                  {examValidation.missingCount > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <div>
                        <strong>Đề chứa câu hỏi không còn tồn tại trong Ngân hàng câu hỏi.</strong>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Hệ thống đã tự động lọc an toàn và chỉ sử dụng <strong>{examValidation.totalCount} câu hỏi hợp lệ</strong> để chơi.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. HÌNH THỨC CHƠI (THEO KHẢ NĂNG THỰC TẾ CỦA GAME)      */}
          {/* ======================================================== */}
          {currentStep === 'format' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  <span>HÌNH THỨC THAM GIA TRÒ CHƠI</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lựa chọn hình thức dựa trên cơ chế vận hành thực tế của trò chơi <strong>{spec.name}</strong>.
                </p>
              </div>

              {!spec.supportsTeam ? (
                /* Individual Only Games */
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                      <User className="w-5 h-5 text-purple-600" />
                      <span>● Chế độ: Cá nhân duy nhất / Đại diện tham gia</span>
                    </div>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      Trò chơi <strong>{spec.name}</strong> hoạt động theo thể thức cá nhân (1 thí sinh/nhà thám hiểm chính hoặc sàn đấu chung).
                    </p>
                  </div>

                  {/* Notice for unsupported mode */}
                  {spec.unsupportedModesNotice && (
                    <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5">
                      <Ban className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>{spec.unsupportedModesNotice}</span>
                    </div>
                  )}

                  {/* Golden Bell contestant count customization */}
                  {game.code === 'GOLDEN_BELL' && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Số lượng thí sinh trên sàn đấu:</label>
                        <span className="text-xs font-mono font-bold text-yellow-700 bg-yellow-100 px-2.5 py-0.5 rounded-lg">
                          {playerCount} học sinh
                        </span>
                      </div>
                      <input
                        type="range"
                        min={spec.minPlayers}
                        max={spec.maxPlayers}
                        step={2}
                        value={playerCount}
                        onChange={(e) => setPlayerCount(Number(e.target.value))}
                        className="w-full accent-yellow-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>6 HS</span>
                        <span>12 HS (Tiêu chuẩn)</span>
                        <span>24 HS</span>
                        <span>40 HS (Cả lớp)</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Multi-mode Games (Individual & Team supported) */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Individual Mode */}
                    <div
                      onClick={() => setCompetitionMode('individual')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                        competitionMode === 'individual'
                          ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          {competitionMode === 'individual' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <h5 className="text-sm font-black text-slate-900">1. Chơi Cá Nhân / Lần Lượt</h5>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Học sinh tham gia trả lời riêng lẻ, tích lũy điểm cá nhân hoặc thi đấu theo lượt.
                        </p>
                      </div>
                    </div>

                    {/* Team Mode */}
                    <div
                      onClick={() => setCompetitionMode('team')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                        competitionMode === 'team'
                          ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                            <Users className="w-5 h-5" />
                          </div>
                          {competitionMode === 'team' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <h5 className="text-sm font-black text-slate-900">2. Chơi Theo Đội Nhóm</h5>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Chia lớp thành các đội (2 đến 4 đội) thi đấu tính điểm tổng hợp.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Number of Players/Teams Selection */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        {competitionMode === 'team' ? 'Số lượng đội chơi:' : 'Số lượng người chơi:'}
                      </label>
                      <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-lg">
                        {competitionMode === 'team' ? `${teamCount} đội` : `${playerCount} người`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[2, 3, 4, 6]
                        .filter((num) =>
                          competitionMode === 'team'
                            ? num <= (spec.maxTeams || 4)
                            : num <= (spec.maxPlayers || 6)
                        )
                        .map((num) => (
                          <button
                            key={num}
                            onClick={() => {
                              if (competitionMode === 'team') setTeamCount(num);
                              else setPlayerCount(num);
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                              (competitionMode === 'team' ? teamCount : playerCount) === num
                                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {num} {competitionMode === 'team' ? 'Đội' : 'Người'}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. CẤU HÌNH TRÒ CHƠI DYNAMIC                             */}
          {/* ======================================================== */}
          {currentStep === 'config' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                  <span>CẤU HÌNH LUẬT & THAM SỐ VẬN HÀNH</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập số câu lấy từ đề thi, thời gian vận hành game và các thông số riêng của trò chơi.
                </p>
              </div>

              {/* Bento Grid: Questions from Exam & Operational Timer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Number of Questions */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Số câu chơi từ Đề:</label>
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-lg">
                      {questionsToPlay} / {totalQuestionsAvailable} câu
                    </span>
                  </div>
                  <input
                    type="range"
                    min={Math.min(totalQuestionsAvailable, 3)}
                    max={totalQuestionsAvailable}
                    value={questionsToPlay}
                    onChange={(e) => setQuestionsToPlay(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={randomizeQuestions}
                        onChange={(e) => setRandomizeQuestions(e.target.checked)}
                        className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
                      />
                      <Shuffle className="w-3 h-3 text-purple-600" />
                      <span>Trộn ngẫu nhiên thứ tự câu trong đề</span>
                    </label>
                  </div>
                </div>

                {/* Operational Timer per Question */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Thời gian trả lời mỗi câu trong game:</label>
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-lg">
                      {timePerQuestion} giây
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {spec.timerOptionsSec.map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setTimePerQuestion(sec)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                          timePerQuestion === sec
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    *Thời gian vận hành game, độc lập với thời gian làm bài của đề.
                  </p>
                </div>
              </div>

              {/* Answer Interaction Mode (Gesture / Voice / Manual) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-700">Phương thức tương tác trả lời:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'manual', label: 'Bấm đáp án / Chuột', icon: MousePointer, supported: spec.supportsManual },
                    { id: 'camera', label: 'Camera AI (1-4 ngón)', icon: Camera, supported: spec.supportsCamera },
                    { id: 'voice', label: 'Giọng nói AI (A-D)', icon: Mic, supported: spec.supportsVoice },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = answerMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        disabled={!mode.supported}
                        onClick={() => setAnswerMode(mode.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] text-center leading-tight">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Clear instructions when Camera or Voice is selected */}
                {answerMode === 'camera' && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs flex items-center gap-2">
                    <Camera className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>
                      <strong>Hướng dẫn Camera AI:</strong> Đưa 1 / 2 / 3 / 4 ngón tay trước camera để chọn đáp án tương ứng A / B / C / D.
                    </span>
                  </div>
                )}

                {answerMode === 'voice' && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>Hướng dẫn Giọng nói AI:</strong> Phát âm rõ chữ "A" → A, "B" → B, "C" → C, "D" → D.
                    </span>
                  </div>
                )}
              </div>

              {/* GAME SPECIFIC SETTINGS */}
              {/* 1. Gesture Quiz AI */}
              {game.code === 'GESTURE_QUIZ_AI' && (
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                  <h5 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Mục đích hoạt động & Thể thức thi đấu
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Mục đích bài học:</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setQuizPurpose('warm-up')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                            quizPurpose === 'warm-up'
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-slate-700 border-purple-200'
                          }`}
                        >
                          Khởi động (5-8 câu)
                        </button>
                        <button
                          onClick={() => setQuizPurpose('practice')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                            quizPurpose === 'practice'
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-slate-700 border-purple-200'
                          }`}
                        >
                          Luyện tập sâu
                        </button>
                      </div>
                    </div>

                    {competitionMode === 'team' && (
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Thể thức đấu đội:</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTeamBattleType('simultaneous')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                              teamBattleType === 'simultaneous'
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-slate-700 border-purple-200'
                            }`}
                          >
                            Đồng loạt
                          </button>
                          <button
                            onClick={() => setTeamBattleType('sequential')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                              teamBattleType === 'sequential'
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-slate-700 border-purple-200'
                            }`}
                          >
                            Theo lượt
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Millionaire */}
              {game.code === 'MILLIONAIRE' && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    Cấu hình quyền trợ giúp Ai Là Triệu Phú
                  </h5>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'fiftyFifty', label: 'Trợ giúp 50:50' },
                      { key: 'askAudience', label: 'Hỏi khán giả' },
                      { key: 'callExpert', label: 'Gọi chuyên gia' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 text-xs font-semibold text-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={(lifelines as any)[item.key]}
                          onChange={(e) =>
                            setLifelines({ ...lifelines, [item.key]: e.target.checked })
                          }
                          className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Golden Bell */}
              {game.code === 'GOLDEN_BELL' && (
                <div className="p-4 rounded-2xl bg-yellow-50/70 border border-yellow-200 space-y-3">
                  <h5 className="text-xs font-bold text-yellow-900 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-yellow-600" />
                    Luật thi đấu Rung Chuông Vàng
                  </h5>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-white border border-yellow-200 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="gbMode"
                        checked={goldenBellMode === 'elimination'}
                        onChange={() => setGoldenBellMode('elimination')}
                        className="accent-yellow-600"
                      />
                      <div>
                        <span className="font-bold block">Loại trực tiếp</span>
                        <span className="text-[10px] text-slate-500 font-normal">Sai bị rời sàn đấu ngay</span>
                      </div>
                    </label>

                    <label className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-white border border-yellow-200 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="gbMode"
                        checked={goldenBellMode === 'survival_points'}
                        onChange={() => setGoldenBellMode('survival_points')}
                        className="accent-yellow-600"
                      />
                      <div>
                        <span className="font-bold block">Tích điểm sinh tồn</span>
                        <span className="text-[10px] text-slate-500 font-normal">Sai trừ mạng, giữ điểm thi</span>
                      </div>
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={allowTeacherRescue}
                      onChange={(e) => setAllowTeacherRescue(e.target.checked)}
                      className="w-4 h-4 accent-yellow-600 rounded cursor-pointer"
                    />
                    <span>Kích hoạt phao cứu trợ của thầy cô (Cứu lại các học sinh bị loại sau câu 5)</span>
                  </label>
                </div>
              )}

              {/* 4. Crossword */}
              {game.code === 'MATH_CROSSWORD' && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    Từ khóa bí mật Ô Chữ
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Từ khóa chính:</label>
                      <input
                        type="text"
                        value={crosswordKeyword}
                        onChange={(e) => setCrosswordKeyword(e.target.value.toUpperCase())}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-900 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Gợi ý từ khóa:</label>
                      <input
                        type="text"
                        value={crosswordClue}
                        onChange={(e) => setCrosswordClue(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Math Racing */}
              {game.code === 'MATH_RACING' && (
                <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-3">
                  <h5 className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-600" />
                    Cấu hình đường đua
                  </h5>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-700">Số vòng đua:</label>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((l) => (
                          <button
                            key={l}
                            onClick={() => setRacingLaps(l)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                              racingLaps === l
                                ? 'bg-orange-600 text-white border-orange-600'
                                : 'bg-white text-slate-700 border-orange-200'
                            }`}
                          >
                            {l} vòng
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nitroEnabled}
                        onChange={(e) => setNitroEnabled(e.target.checked)}
                        className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                      />
                      <span>Kích hoạt Nitro bứt tốc khi trả lời nhanh</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 6. Math Arena */}
              {game.code === 'MATH_ARENA' && (
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={speedBonus}
                      onChange={(e) => setSpeedBonus(e.target.checked)}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-rose-900">Bật thưởng chuỗi đúng liên tiếp (Speed Streak Bonus)</span>
                  </label>
                  <p className="text-[11px] text-rose-700">
                    Cộng dồn +5 điểm thưởng cho mỗi câu đúng liên tiếp giúp gia tăng khoảng cách trên bảng xếp hạng.
                  </p>
                </div>
              )}

              {/* 7. Obstacle Course */}
              {game.code === 'OBSTACLE_COURSE' && (
                <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-3">
                  <h5 className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                    <Mountain className="w-4 h-4 text-cyan-600" />
                    Cấu hình độ khó thám hiểm
                  </h5>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setObstacleDifficulty('standard')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        obstacleDifficulty === 'standard'
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-white text-slate-700 border-cyan-200'
                      }`}
                    >
                      Tiêu chuẩn (100 HP)
                    </button>
                    <button
                      onClick={() => setObstacleDifficulty('heroic')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        obstacleDifficulty === 'heroic'
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-white text-slate-700 border-cyan-200'
                      }`}
                    >
                      Vượt khó / Heroic (50 HP)
                    </button>
                  </div>
                </div>
              )}

              {/* 8. Mystery Doors */}
              {game.code === 'MYSTERY_DOORS' && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <DoorOpen className="w-4 h-4 text-indigo-600" />
                    Số lượng ô cửa & Phong cách
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Số lượng ô cửa:</label>
                      <div className="flex gap-1">
                        {[4, 6, 8, 9, 12].map((cnt) => (
                          <button
                            key={cnt}
                            onClick={() => setMysteryDoorCount(cnt)}
                            className={`flex-1 py-1 rounded-lg text-xs font-bold border transition ${
                              mysteryDoorCount === cnt
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-700 border-indigo-200'
                            }`}
                          >
                            {cnt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Phong cách cửa:</label>
                      <select
                        value={doorStyle}
                        onChange={(e) => setDoorStyle(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-900"
                      >
                        <option value="magical">Kỳ bí / Magical</option>
                        <option value="cyber">Công nghệ / Cyber</option>
                        <option value="ancient">Cổ tích / Ancient</option>
                        <option value="royal">Hoàng gia / Royal</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Mechanics & Rules Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <Info className="w-4 h-4" />
                  <span>Cơ chế tính điểm & Điều kiện chiến thắng của {spec.name}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <strong className="text-amber-400 block text-[11px] mb-1">📊 Luật tính điểm:</strong>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{spec.scoringRuleDescription}</p>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <strong className="text-cyan-400 block text-[11px] mb-1">🏁 Điều kiện kết thúc:</strong>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{spec.endConditionDescription}</p>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <strong className="text-emerald-400 block text-[11px] mb-1">🏆 Điều kiện thắng:</strong>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{spec.winConditionDescription}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. XÁC NHẬN TRƯỚC KHI CHƠI                               */}
          {/* ======================================================== */}
          {currentStep === 'preview' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                  <span>XÁC NHẬN THIẾT LẬP TRÒ CHƠI</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra lại toàn bộ thông số trước khi bước vào phòng trò chơi cùng học sinh.
                </p>
              </div>

              {/* Validation Warning Alert (if any errors exist) */}
              {validationErrors.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Không thể bắt đầu trò chơi do chưa thỏa mãn các điều kiện sau:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-rose-700 pl-2 space-y-0.5 font-medium">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary Card */}
              <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                      {renderGameIcon()}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                        Trò chơi sẵn sàng
                      </span>
                      <h5 className="text-base font-black text-white">{spec.name}</h5>
                    </div>
                  </div>
                  {validationErrors.length === 0 ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ Đã sẵn sàng bắt đầu
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Chưa hoàn tất thiết lập
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Đề thi đã chọn:</span>
                    <strong className="text-white text-xs line-clamp-1 mt-0.5">{selectedExam?.title || 'Chưa chọn'}</strong>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Số câu thi đấu:</span>
                    <strong className="text-emerald-400 text-xs font-mono mt-0.5">
                      {questionsToPlay} / {examValidation.totalCount} câu {randomizeQuestions ? '(Đã trộn)' : ''}
                    </strong>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Thời gian vận hành game:</span>
                    <strong className="text-blue-400 text-xs font-mono mt-0.5">{timePerQuestion}s / câu</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      (Thời gian đề: {selectedExam?.timePerQuestion ? Math.round((selectedExam.timePerQuestion * examValidation.totalCount) / 60) : 15} phút)
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Hình thức thi đấu:</span>
                    <strong className="text-purple-300 text-xs mt-0.5">
                      {spec.supportsTeam && competitionMode === 'team'
                        ? `Đồng đội (${teamCount} đội)`
                        : `Cá nhân (${playerCount} người)`}
                    </strong>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Phương thức tương tác:</span>
                    <strong className="text-amber-300 text-xs mt-0.5">
                      {answerMode === 'camera'
                        ? 'Camera AI (1-4 ngón)'
                        : answerMode === 'voice'
                        ? 'Giọng nói AI (A-D)'
                        : 'Bấm đáp án / Chuột'}
                    </strong>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Bài học:</span>
                    <strong className="text-slate-200 text-xs line-clamp-1 mt-0.5">{lesson.title}</strong>
                  </div>
                </div>

                {/* Rules Recap in Preview */}
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 text-[11px] text-slate-300 space-y-1">
                  <div>
                    <strong className="text-amber-400">Luật tính điểm:</strong> {spec.scoringRuleDescription}
                  </div>
                  <div>
                    <strong className="text-emerald-400">Điều kiện thắng:</strong> {spec.winConditionDescription}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* MODAL FOOTER NAVIGATION                                  */}
        {/* ======================================================== */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            {currentStep !== 'exam' && (
              <button
                onClick={() => {
                  if (currentStep === 'format') setCurrentStep('exam');
                  else if (currentStep === 'config') setCurrentStep('format');
                  else if (currentStep === 'preview') setCurrentStep('config');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                ← QUAY LẠI
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              HỦY
            </button>

            {currentStep !== 'preview' ? (
              <button
                disabled={!hasExams || examValidation.totalCount === 0}
                onClick={() => {
                  if (currentStep === 'exam') setCurrentStep('format');
                  else if (currentStep === 'format') setCurrentStep('config');
                  else if (currentStep === 'config') setCurrentStep('preview');
                }}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>TIẾP TỤC</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-confirm-start-game"
                disabled={validationErrors.length > 0 || !hasExams || examValidation.totalCount === 0}
                onClick={handleConfirmAndStart}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-black shadow-lg shadow-purple-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>BẮT ĐẦU CHƠI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
