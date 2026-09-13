import { GestureQuizConfig, QuestionItem } from './GestureQuiz';
import { GameTypeCode } from './GameEnums';
import { GameSession } from '../../types/teacherLesson';

export interface LessonGameMetadata {
  id: string;
  code: string;
  gameType?: GameTypeCode;
  name: string;
  description: string;
  category: 'gesture-ai' | 'voice-ai' | 'interactive';
  targetAudience: string;
  iconName: string;
  badge?: string;
  isAvailable: boolean;
}

export interface LessonUnit {
  id: string;
  subject: string;
  grade: number;
  chapter: string;
  lessonTitle: string;
  questionBank: QuestionItem[];
  gameSession?: GameSession;
  initialConfig?: Record<string, any>;
}
