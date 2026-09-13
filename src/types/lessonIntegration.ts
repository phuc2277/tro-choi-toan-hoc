import { QuestionItem } from '../games/types/GestureQuiz';
import { LessonUnit } from '../games/types/LessonGame';

export interface LectureSection {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  keyPoints: string[];
  formula?: string;
  examples?: {
    problem: string;
    solution: string;
    note?: string;
  }[];
  callout?: {
    type: 'tip' | 'warning' | 'info';
    text: string;
  };
}

export interface LessonQuestionSet {
  id: string;
  title: string;
  description: string;
  type: 'warm-up' | 'practice' | 'advanced' | 'all';
  questionCount: number;
  questions: QuestionItem[];
}

export interface LessonItem extends LessonUnit {
  code: string;
  shortTitle: string;
  title: string;
  description: string;
  lecture: {
    objectives: string[];
    sections: LectureSection[];
    summary: string[];
  };
  questionSets: LessonQuestionSet[];
}

export interface GameLaunchSession {
  sessionId: string;
  lessonId: string;
  lessonTitle: string;
  questionSetId: string;
  questionSetTitle: string;
  gameCode: string;
  gameName: string;
  questionCount: number;
  timestamp: number;
  completed?: boolean;
}
