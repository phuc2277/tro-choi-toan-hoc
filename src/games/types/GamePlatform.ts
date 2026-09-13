import { GamePurposeEnum, GameTypeCode, QuizOptionKeyEnum, GradeRatingEnum } from './GameEnums';
import { QuestionItem, QuizOption } from './GestureQuiz';

/**
 * Base game lifecycle states standard across all games in the platform
 */
export type GameLifecycleState =
  | 'idle'
  | 'configuring'
  | 'ready'
  | 'playing'
  | 'question-result'
  | 'next-question'
  | 'finished';

/**
 * Standard configuration required by every game in the platform
 */
export interface BaseGameConfig {
  purpose: 'warm-up' | 'practice';
  subject: string;
  lessonTitle: string;
  questionPoolIds: string[];
  questionsPerRound: number;
  timeLimitPerQuestion: number;
}

/**
 * Standard result format produced by all educational games
 */
export interface BaseGameResult {
  gameId: string;
  gameType: GameTypeCode | string;
  lessonTitle: string;
  subject: string;
  totalQuestions: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  percentage: number;
  ratingLabel: string;
  startedAt: string;
  finishedAt: string;
  details?: unknown;
}

/* =========================================================
 * 1. CHIẾC NÓN KỲ DIỆU (WHEEL GAME) TYPES
 * ========================================================= */
export type WheelSectorType = 'points' | 'double' | 'lose_turn' | 'special_bonus' | 'free_turn';

export interface WheelSector {
  id: string;
  label: string;
  value: number; // Điểm số cộng (ví dụ 10, 20, 30, 50, 100)
  type: WheelSectorType;
  color: string;
  textColor: string;
}

export interface WheelPlayerState {
  id: string;
  name: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  isTurnLost: boolean;
  avatarColor: string;
}

export interface WheelGameConfig extends BaseGameConfig {
  competitionMode: 'individual' | 'team';
  playerNames: string[];
}

/* =========================================================
 * 2. ĐẤU TRƯỜNG TOÁN HỌC (MATH ARENA) TYPES
 * ========================================================= */
export interface ArenaPlayerState {
  id: string;
  name: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  currentStreak: number;
  maxStreak: number;
  avatarColor: string;
  selectedOption: QuizOptionKeyEnum | null;
  responseTimeMs: number;
  lastScoreGain: number;
}

export interface MathArenaConfig extends BaseGameConfig {
  competitionMode: 'individual' | 'team';
  playerNames: string[];
  speedBonusEnabled: boolean;
}

/* =========================================================
 * 3. AI LÀ TRIỆU PHÚ (MILLIONAIRE) TYPES
 * ========================================================= */
export interface MillionaireLifelines {
  fiftyFiftyUsed: boolean;
  askAudienceUsed: boolean;
  callExpertUsed: boolean;
}

export interface AudienceVoteResult {
  option: QuizOptionKeyEnum;
  percent: number;
}

export interface ExpertAdvice {
  expertName: string;
  recommendedOption: QuizOptionKeyEnum;
  confidence: number;
  message: string;
}

export interface MillionaireConfig extends BaseGameConfig {
  playerName: string;
  prizeLadder: number[];
}

/**
 * Shared standard GamePlayConfig specified in instructions
 */
export interface GamePlayConfig {
  purpose: 'warmup' | 'practice';
  questionPoolSize: number;
  questionsPerGame: number;
  timeLimitPerQuestion: number;
  randomizeQuestions: boolean;
  allowReplay: boolean;
}

/* =========================================================
 * 4. ĐUA XE TOÁN HỌC (MATH RACING) TYPES
 * ========================================================= */
export interface RacingPlayerState {
  id: string;
  name: string;
  color: string;
  carIcon: string;
  trackPositionPercent: number; // 0 to 100%
  speed: number;
  nitroBoost: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  selectedOption: QuizOptionKeyEnum | null;
  responseTimeMs: number;
  status: 'idle' | 'accelerating' | 'turbo' | 'stalled' | 'finished';
  finishTimeSec?: number;
  rank?: number;
}

export interface RacingGameConfig extends BaseGameConfig {
  competitionMode: 'individual' | 'team';
  playerNames: string[];
  trackLengthLaps: number;
}

/* =========================================================
 * 5. RUNG CHUÔNG VÀNG (GOLDEN BELL) TYPES
 * ========================================================= */
export interface GoldenBellContestant {
  id: string;
  name: string;
  avatarColor: string;
  isEliminated: boolean;
  eliminatedAtQuestion?: number;
  score: number;
  correctCount: number;
  selectedOption: QuizOptionKeyEnum | null;
  responseTimeMs: number;
  rescuedCount: number;
}

export interface GoldenBellConfig extends BaseGameConfig {
  eliminationMode: 'elimination' | 'survival_points';
  contestantCount: number;
  contestantNames: string[];
  allowTeacherRescue: boolean;
}

/* =========================================================
 * 6. Ô CHỮ BÍ MẬT (MATH CROSSWORD) TYPES
 * ========================================================= */
export interface CrosswordTile {
  index: number;
  letter: string;
  isRevealed: boolean;
  unlockedByQuestionIndex?: number;
}

export interface CrosswordGameConfig extends BaseGameConfig {
  keyword: string;
  keywordClue: string;
  pointsPerQuestion: number;
  bonusForEarlyKeyword: number;
  playerNames: string[];
}

/* =========================================================
 * 7. VƯỢT CHƯỚNG NGẠI VẬT (OBSTACLE COURSE) TYPES
 * ========================================================= */
export type ObstacleType =
  | 'boulder'
  | 'suspension_bridge'
  | 'lava_pit'
  | 'dragon_guardian'
  | 'cipher_gate'
  | 'vortex'
  | 'summit_temple';

export interface ObstacleItem {
  id: string;
  type: ObstacleType;
  name: string;
  icon: string;
  description: string;
  questionIndex: number;
  isCleared: boolean;
  clearedByCorrect: boolean;
  penaltyTimeSec: number;
}

export interface ExplorerState {
  currentObstacleIndex: number;
  totalObstacles: number;
  score: number;
  health: number; // 0 to 100
  itemsUnlocked: string[];
  totalTimeSeconds: number;
  clearedCount: number;
  status: 'trekking' | 'facing_obstacle' | 'cleared' | 'failed' | 'conquered';
}

export interface ObstacleCourseConfig extends BaseGameConfig {
  explorerName: string;
  difficulty: 'standard' | 'heroic';
}

/* =========================================================
 * 8. Ô CỬA BÍ MẬT (MYSTERY DOORS) TYPES
 * ========================================================= */
export type DoorSurpriseType =
  | 'standard_challenge' // Câu hỏi Toán học tiêu chuẩn
  | 'lucky_star'         // Ngôi sao may mắn x2 điểm
  | 'mystery_gift'       // Hộp quà điểm thưởng tức thì (+30đ hoặc +50đ)
  | 'gold_key'           // Chìa khóa vàng mở 2 mảnh ghép bức tranh bí mật
  | 'time_freeze'        // Đóng băng thời gian (+15s suy nghĩ)
  | 'bomb_challenge';    // Thử thách Bom Tấn (Thưởng x3 nếu trả lời siêu tốc)

export interface MysteryDoorItem {
  id: string;
  number: number;
  label: string;
  doorThemeColor: string;
  icon: string;
  surpriseType: DoorSurpriseType;
  surpriseTitle: string;
  surpriseDescription: string;
  isOpen: boolean;
  isCompleted: boolean;
  questionIndex: number;
  scoreBonus: number;
  solvedByPlayerName?: string;
  isCorrect?: boolean;
}

export interface MysteryThemePreset {
  id: string;
  themeTitle: string;
  secretKeyword: string;
  clue: string;
  bgGradient: string;
  icon: string;
}

export interface MysteryDoorsPlayerState {
  id: string;
  name: string;
  score: number;
  doorsOpened: number;
  correctCount: number;
  wrongCount: number;
  avatarColor: string;
  teamLabel?: string;
}

export interface MysteryDoorsGameConfig extends BaseGameConfig {
  competitionMode: 'individual' | 'team';
  playerNames: string[];
  doorCount: number; // 4, 6, 8, 9, 12
  secretKeyword: string;
  secretClue: string;
  themePresetId: string;
  doorStyle: 'magical' | 'cyber' | 'ancient' | 'royal';
}


