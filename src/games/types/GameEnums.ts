/**
 * @file GameEnums.ts
 * Enums and string-literal unions for educational games & AI Gesture Quiz.
 */

export enum GameTypeCode {
  GESTURE_QUIZ = 'gesture-quiz',
  WHEEL_GAME = 'wheel-game',
  MATH_ARENA = 'math-arena',
  MILLIONAIRE = 'millionaire',
  MATH_RACING = 'math-racing',
  GOLDEN_BELL = 'golden-bell',
  MATH_CROSSWORD = 'math-crossword',
  OBSTACLE_COURSE = 'obstacle-course',
  MYSTERY_DOORS = 'mystery-doors',
}

export enum GamePurposeEnum {
  WARM_UP = 'warm-up',
  PRACTICE = 'practice',
}

export enum CompetitionModeEnum {
  INDIVIDUAL = 'individual',
  TEAM = 'team',
}

export enum IndividualInputModeEnum {
  CAMERA = 'camera',
  VOICE = 'voice',
  KEYBOARD_MOUSE = 'keyboard_mouse',
}

export enum TeamCompetitionTypeEnum {
  SIMULTANEOUS = 'simultaneous',
  SEQUENTIAL = 'sequential',
}

export enum QuizOptionKeyEnum {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

export enum GradeRatingEnum {
  EXCELLENT = 'EXCELLENT', // 90-100% 🏆 Xuất sắc
  GOOD = 'GOOD',           // 80-89%  ⭐ Tốt
  FAIR = 'FAIR',           // 65-79%  👍 Khá
  PASS = 'PASS',           // 50-64%  📘 Đạt
  NEEDS_EFFORT = 'NEEDS_EFFORT', // <50% 💪 Cần cố gắng
}
