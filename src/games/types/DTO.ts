import { GestureQuizConfig, QuestionItem, PlayerStats, TeamStats } from './GestureQuiz';

export interface GameSessionSummaryDTO {
  sessionId: string;
  config: GestureQuizConfig;
  startedAt: string;
  completedAt: string;
  totalQuestions: number;
  individualRankings?: PlayerStats[];
  teamRankings?: TeamStats[];
  historyQuestionIds: string[];
}

export interface QuestionFilterDTO {
  subject?: string;
  grade?: number;
  lessonId?: string;
  searchKeyword?: string;
}
