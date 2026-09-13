import { QuizOptionKeyEnum } from '../types/GameEnums';
import { AudienceVoteResult, ExpertAdvice } from '../types/GamePlatform';

export const DEFAULT_PRIZE_LADDER: number[] = [
  100, 200, 300, 500, 1000, // Milestone 1 (Câu 5 = 1.000)
  2000, 4000, 8000, 16000, 32000, // Milestone 2 (Câu 10 = 32.000)
  64000, 125000, 250000, 500000, 1000000, // Milestone 3 (Câu 15 = 1.000.000)
];

export const SAFETY_CHECKPOINTS = [4, 9]; // index 4 is Question 5, index 9 is Question 10

export class MillionaireService {
  /**
   * 50:50 Lifeline: Hides 2 wrong options, keeping correct option and 1 random wrong option.
   */
  public static calculateFiftyFifty(correctOption: QuizOptionKeyEnum): QuizOptionKeyEnum[] {
    const allOptions = [QuizOptionKeyEnum.A, QuizOptionKeyEnum.B, QuizOptionKeyEnum.C, QuizOptionKeyEnum.D];
    const wrongOptions = allOptions.filter((opt) => opt !== correctOption);
    
    // Pick 1 wrong option to keep
    const keepWrongIdx = Math.floor(Math.random() * wrongOptions.length);
    const hiddenWrongOptions = wrongOptions.filter((_, idx) => idx !== keepWrongIdx);
    
    return hiddenWrongOptions; // returns 2 options that must be hidden
  }

  /**
   * Ask the Audience: Generates statistical distribution among A, B, C, D
   * Correct answer receives high probability (55% - 85%), rest is split.
   */
  public static generateAudiencePoll(
    correctOption: QuizOptionKeyEnum,
    questionIndex: number = 0
  ): AudienceVoteResult[] {
    const allOptions = [QuizOptionKeyEnum.A, QuizOptionKeyEnum.B, QuizOptionKeyEnum.C, QuizOptionKeyEnum.D];
    
    // Harder questions have slightly less audience confidence
    const baseConfidence = Math.max(50, 82 - questionIndex * 3);
    const correctPercent = Math.floor(baseConfidence + Math.random() * 10);
    
    const remainingPercent = 100 - correctPercent;
    const wrongOptions = allOptions.filter((opt) => opt !== correctOption);
    
    // Distribute remaining among 3 wrong options
    const r1 = Math.floor(Math.random() * (remainingPercent - 4)) + 1;
    const r2 = Math.floor(Math.random() * (remainingPercent - r1 - 2)) + 1;
    const r3 = remainingPercent - r1 - r2;
    
    const wrongDistribution = [r1, r2, r3];

    return allOptions.map((opt) => {
      if (opt === correctOption) {
        return { option: opt, percent: correctPercent };
      }
      const wrongVal = wrongDistribution.pop() || 5;
      return { option: opt, percent: wrongVal };
    });
  }

  /**
   * Phone-a-Friend / Call Expert Advice simulation
   */
  public static generateExpertCall(
    correctOption: QuizOptionKeyEnum,
    playerName: string
  ): ExpertAdvice {
    const experts = [
      { name: 'Thầy Hoàng (Tổ trưởng Toán THCS)', confidence: 95 },
      { name: 'Cô Mai (Giáo viên dạy giỏi cấp Tỉnh)', confidence: 90 },
      { name: 'GS. Pythagoras (Nhà Toán học cố vấn)', confidence: 98 },
    ];
    const expert = experts[Math.floor(Math.random() * experts.length)];

    const phrases = [
      `Chào ${playerName}, theo kinh nghiệm và các công thức Toán học, thầy/cô tin chắc đáp án đúng là **${correctOption}**!`,
      `Chào em! Sau khi nhẩm nhanh bài toán, mình nghiêng 90% về phương án **${correctOption}**, em hãy tự tin chọn nhé!`,
      `Phương án chuẩn xác cho câu hỏi này là **${correctOption}**, em chốt ngay đáp án này nhé!`,
    ];
    const message = phrases[Math.floor(Math.random() * phrases.length)];

    return {
      expertName: expert.name,
      recommendedOption: correctOption,
      confidence: expert.confidence,
      message,
    };
  }

  /**
   * Calculates guaranteed safety reward on failure
   */
  public static calculateGuaranteedReward(
    currentQuestionIndex: number,
    prizeLadder: number[] = DEFAULT_PRIZE_LADDER
  ): number {
    if (currentQuestionIndex >= 10) {
      return prizeLadder[9]; // Question 10 prize
    }
    if (currentQuestionIndex >= 5) {
      return prizeLadder[4]; // Question 5 prize
    }
    return 0;
  }
}
