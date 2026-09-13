import { CrosswordTile } from '../types/GamePlatform';

export interface MathKeywordPreset {
  keyword: string;
  clue: string;
  grade: number;
  subject: string;
}

export class CrosswordService {
  public static readonly MATH_KEYWORDS: MathKeywordPreset[] = [
    {
      keyword: 'HÀM SỐ',
      clue: 'Quy tắc tương ứng mỗi giá trị của đại lượng x với duy nhất một giá trị của đại lượng y.',
      grade: 9,
      subject: 'Đại số',
    },
    {
      keyword: 'PHƯƠNG TRÌNH',
      clue: 'Mệnh đề chứa biến có dạng f(x) = g(x) với mục tiêu tìm tập nghiệm x.',
      grade: 8,
      subject: 'Đại số',
    },
    {
      keyword: 'ĐỊNH LÝ PYTHAGO',
      clue: 'Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông.',
      grade: 7,
      subject: 'Hình học',
    },
    {
      keyword: 'TAM GIÁC ĐỒNG DẠNG',
      clue: 'Hai hình tam giác có các góc tương ứng bằng nhau và các cạnh tương ứng tỉ lệ.',
      grade: 8,
      subject: 'Hình học',
    },
    {
      keyword: 'HỆ THỨC LƯỢNG',
      clue: 'Các hệ thức liên hệ giữa cạnh và đường cao trong tam giác vuông (sin, cos, tan, cot).',
      grade: 9,
      subject: 'Hình học',
    },
    {
      keyword: 'BẤT ĐẲNG THỨC',
      clue: 'Mối quan hệ toán học biểu thị một vế luôn lớn hơn, bé hơn hoặc bằng vế còn lại.',
      grade: 9,
      subject: 'Đại số',
    },
    {
      keyword: 'SỐ NGUYÊN TỐ',
      clue: 'Số tự nhiên lớn hơn 1 chỉ có đúng hai ước là 1 và chính nó.',
      grade: 6,
      subject: 'Số học',
    },
    {
      keyword: 'ĐA THỨC',
      clue: 'Một tổng của những đơn thức trong toán học đại số.',
      grade: 7,
      subject: 'Đại số',
    },
    {
      keyword: 'HÌNH BÌNH HÀNH',
      clue: 'Tứ giác có các cạnh đối song song từng đôi một và các góc đối bằng nhau.',
      grade: 8,
      subject: 'Hình học',
    },
  ];

  /**
   * Builds the crossword tile matrix for a given keyword string
   */
  public static initCrosswordTiles(keyword: string): CrosswordTile[] {
    const cleanWord = keyword.trim().toUpperCase();
    return cleanWord.split('').map((char, index) => ({
      index,
      letter: char,
      isRevealed: char === ' ', // Spaces are automatically revealed
    }));
  }

  /**
   * Reveals a portion of tiles when a question is answered correctly.
   * If there are N unrevealed tiles and total questions M, reveal ~ ceil(unrevealed / remainingQuestions).
   */
  public static revealTilesOnCorrectAnswer(
    currentTiles: CrosswordTile[],
    questionIndex: number,
    totalQuestions: number
  ): { updatedTiles: CrosswordTile[]; revealedLettersCount: number } {
    const unrevealedIndices = currentTiles
      .map((t, i) => (!t.isRevealed && t.letter !== ' ' ? i : -1))
      .filter((i) => i !== -1);

    if (unrevealedIndices.length === 0) {
      return { updatedTiles: currentTiles, revealedLettersCount: 0 };
    }

    const remainingQuestions = Math.max(1, totalQuestions - questionIndex);
    const countToReveal = Math.max(
      1,
      Math.min(unrevealedIndices.length, Math.ceil(unrevealedIndices.length / remainingQuestions))
    );

    // Pick random indices to reveal
    const shuffled = [...unrevealedIndices].sort(() => Math.random() - 0.5);
    const indicesToReveal = new Set(shuffled.slice(0, countToReveal));

    const updatedTiles = currentTiles.map((tile) => {
      if (indicesToReveal.has(tile.index)) {
        return {
          ...tile,
          isRevealed: true,
          unlockedByQuestionIndex: questionIndex + 1,
        };
      }
      return tile;
    });

    return {
      updatedTiles,
      revealedLettersCount: countToReveal,
    };
  }

  /**
   * Helper to normalize Vietnamese strings (optional for forgiving user inputs)
   */
  public static normalizeVietnamese(str: string): string {
    return str
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ');
  }

  /**
   * Check if user's guessed keyword matches target keyword
   */
  public static checkKeywordGuess(guess: string, targetKeyword: string): boolean {
    const normGuess = this.normalizeVietnamese(guess);
    const normTarget = this.normalizeVietnamese(targetKeyword);
    return normGuess === normTarget;
  }

  /**
   * Calculate bonus score if player guesses keyword early
   */
  public static calculateEarlyBonus(
    unrevealedTilesCount: number,
    totalTilesCount: number,
    baseBonus: number = 50
  ): number {
    const ratio = totalTilesCount > 0 ? unrevealedTilesCount / totalTilesCount : 0.5;
    return Math.round(baseBonus + ratio * 50);
  }
}
