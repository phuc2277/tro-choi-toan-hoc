import {
  GamePurposeEnum,
  CompetitionModeEnum,
  IndividualInputModeEnum,
  TeamCompetitionTypeEnum,
  QuizOptionKeyEnum,
  GradeRatingEnum,
} from './GameEnums';

export type GamePurpose = 'warm-up' | 'practice';
export type CompetitionMode = 'individual' | 'team';
export type IndividualPlayerCount = 1 | 2 | 3 | 4;
export type IndividualInputMode = 'camera' | 'voice' | 'keyboard_mouse';
export type TeamCompetitionType = 'simultaneous' | 'sequential';
export type TeamCount = 2 | 3 | 4;
export type PlayersPerTeam = 2 | 3 | 4;
export type TeamInputMode = 'camera' | 'keyboard_mouse';

export interface QuizOption {
  key: QuizOptionKeyEnum;
  text: string;
}

export interface MathDiagram {
  type:
    | 'parallel-transversal'
    | 'triangle-angles'
    | 'right-triangle'
    | 'rectangular-box'
    | 'circle-radius'
    | 'coordinate-plane'
    | 'communicating-vessels'
    | 'angle-bisector'
    | 'number-line';
  title?: string;
  labels?: Record<string, string | number>;
  caption?: string;
}

export interface MathTableData {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
  highlightCell?: { row: number; col: number };
}

export interface QuestionItem {
  id: string;
  subject: string;
  grade: number; // 6, 7, 8, 9
  chapter?: string;
  lessonTitle: string;
  content: string;
  options: QuizOption[];
  correctAnswer: QuizOptionKeyEnum;
  explanation?: string;
  diagram?: MathDiagram;
  tableData?: MathTableData;
  imageUrl?: string;
}

export interface IndividualGameConfig {
  playerCount: IndividualPlayerCount;
  inputMode: IndividualInputMode;
}

export interface TeamGameConfig {
  competitionType: TeamCompetitionType;
  teamCount: TeamCount;
  playersPerTeam: PlayersPerTeam;
  inputMode?: TeamInputMode;
}

export interface GestureQuizConfig {
  purpose: GamePurpose;
  subject: string;
  lessonTitle: string;
  questionPoolIds: string[];
  questionsPerRound: number;
  timeLimitPerQuestion: number; // in seconds: 10, 15, 20, 30
  competitionMode: CompetitionMode;
  individualConfig?: IndividualGameConfig;
  teamConfig?: TeamGameConfig;
}

export interface PlayerAnswerRecord {
  playerId: string;
  playerName: string;
  playerIndex: number; // 0, 1, 2, 3
  teamId?: string;
  selectedOption: QuizOptionKeyEnum | null;
  isCorrect: boolean;
  answeredAtTimestamp?: number;
  timeSpentSeconds?: number;
  stableFrames: number;
}

export interface RoundScoreItem {
  questionIndex: number;
  question: QuestionItem;
  playerAnswers: PlayerAnswerRecord[];
  teamScores?: Record<string, { earned: number; total: number; allCorrect: boolean }>;
  individualScores?: Record<string, { earned: number; total: number }>;
}

export interface PlayerStats {
  id: string;
  name: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  teamId?: string;
  teamName?: string;
  accuracyRate: number;
  totalTimeSeconds: number;
  averageTimeSeconds: number;
  gradeRating: GradeRatingEnum;
  ratingLabel: string;
}

export interface TeamStats {
  id: string;
  name: string;
  color: string;
  score: number;
  totalQuestions: number;
  accuracyRate: number;
  totalTimeSeconds: number;
  averageTimeSeconds: number;
  gradeRating: GradeRatingEnum;
  ratingLabel: string;
  memberIds: string[];
  memberNames: string[];
}

export interface HandZoneDetection {
  zoneIndex: number;
  zoneName: string;
  detectedOption: QuizOptionKeyEnum | null;
  confidence: number;
  stableFrameCount: number;
  isLocked: boolean;
  landmarks?: { x: number; y: number; z?: number }[];
  extendedFingersCount: number;
}
