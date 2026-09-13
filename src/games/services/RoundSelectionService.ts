import { QuestionItem } from '../types/GestureQuiz';

export class RoundSelectionService {
  /**
   * Validates if teacher question pool satisfies minimum round requirement (Spec Item 4)
   */
  public static validatePoolCapacity(
    poolLength: number,
    questionsPerRound: number
  ): { isValid: boolean; errorMessage?: string } {
    if (poolLength < questionsPerRound) {
      return {
        isValid: false,
        errorMessage: `Số câu trong Question Pool (${poolLength} câu) phải lớn hơn hoặc bằng số câu mỗi lượt (${questionsPerRound} câu). Vui lòng chọn thêm câu hỏi hoặc giảm số câu mỗi lượt!`,
      };
    }
    return { isValid: true };
  }

  /**
   * Generates a question round from the pool.
   * Priority: Select questions that have not appeared recently (Spec Item 4 & 21)
   */
  public static selectQuestionsForRound(
    questionPool: QuestionItem[],
    questionsPerRound: number,
    recentQuestionIdHistory: string[] = []
  ): { selectedQuestions: QuestionItem[]; updatedHistory: string[] } {
    if (questionPool.length === 0) {
      return { selectedQuestions: [], updatedHistory: recentQuestionIdHistory };
    }

    const effectiveRoundCount = Math.min(questionsPerRound, questionPool.length);

    // Group pool into: not recently used vs recently used
    const notRecentPool = questionPool.filter(
      (q) => !recentQuestionIdHistory.includes(q.id)
    );
    const recentPool = questionPool.filter((q) =>
      recentQuestionIdHistory.includes(q.id)
    );

    // Shuffle helper (Fisher-Yates)
    const shuffle = <T>(array: T[]): T[] => {
      const copy = [...array];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const shuffledNotRecent = shuffle(notRecentPool);
    // Sort recent questions by how long ago they were used (older first)
    const sortedRecent = [...recentPool].sort((a, b) => {
      const idxA = recentQuestionIdHistory.indexOf(a.id);
      const idxB = recentQuestionIdHistory.indexOf(b.id);
      return idxA - idxB;
    });

    const combinedCandidates = [...shuffledNotRecent, ...sortedRecent];
    const selected = combinedCandidates.slice(0, effectiveRoundCount);

    // Randomize final presentation order for the round
    const finalRoundQuestions = shuffle(selected);

    // Update history, keeping up to 100 recent IDs
    const newSelectedIds = finalRoundQuestions.map((q) => q.id);
    const updatedHistory = [
      ...recentQuestionIdHistory.filter((id) => !newSelectedIds.includes(id)),
      ...newSelectedIds,
    ].slice(-100);

    return {
      selectedQuestions: finalRoundQuestions,
      updatedHistory,
    };
  }
}
