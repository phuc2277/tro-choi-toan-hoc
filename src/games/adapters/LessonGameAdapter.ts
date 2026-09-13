import { Lesson, QuestionSetItem, GameSession } from '../../types/teacherLesson';
import { LessonUnit } from '../types/LessonGame';
import { QuestionItem } from '../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import { getLessonQuestionBank, resolveExamQuestions } from '../../data/teacherLessonData';

/**
 * Converts a Teacher Lesson + Question Set (Exam) into the LessonUnit expected by the Game Engine.
 * Does not mutate or rebuild games; simply serves as the clean integration layer.
 */
export function convertTeacherLessonToLessonUnit(
  lesson: Lesson,
  questionSet?: QuestionSetItem,
  customQuestionIds?: string[],
  questionLimit?: number,
  session?: GameSession
): LessonUnit {
  const activeSet = questionSet || lesson.questionSets[0];
  const bank = getLessonQuestionBank(lesson);
  let resolvedQuestions = activeSet ? resolveExamQuestions(activeSet, bank) : [];

  if (customQuestionIds && customQuestionIds.length > 0) {
    const idSet = new Set(customQuestionIds);
    resolvedQuestions = resolvedQuestions.filter((q) => idSet.has(q.id));
  }

  if (questionLimit && questionLimit > 0 && questionLimit < resolvedQuestions.length) {
    resolvedQuestions = resolvedQuestions.slice(0, questionLimit);
  }

  const questions: QuestionItem[] = resolvedQuestions.map((q) => {
    // Ensure 4 options or fallback
    const options =
      q.options && q.options.length >= 2
        ? q.options
        : [
            { key: QuizOptionKeyEnum.A, text: 'A' },
            { key: QuizOptionKeyEnum.B, text: 'B' },
            { key: QuizOptionKeyEnum.C, text: 'C' },
            { key: QuizOptionKeyEnum.D, text: 'D' },
          ];

    return {
      id: q.id,
      subject: q.subject || lesson.subject,
      grade: q.grade || lesson.grade,
      chapter: lesson.chapter,
      lessonTitle: lesson.title,
      content: q.content,
      options,
      correctAnswer: q.correctAnswer || QuizOptionKeyEnum.A,
      explanation: q.explanation,
      diagram: q.diagram,
      tableData: q.tableData,
    };
  });

  return {
    id: lesson.id,
    subject: lesson.subject,
    grade: lesson.grade,
    chapter: lesson.chapter,
    lessonTitle: lesson.title,
    questionBank: questions,
    gameSession: session,
    initialConfig: session?.settings,
  };
}
