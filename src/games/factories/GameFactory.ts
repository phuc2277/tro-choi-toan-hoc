import React from 'react';
import { LessonUnit } from '../types/LessonGame';
import { GameTypeCode } from '../types/GameEnums';
import { GestureQuizGame } from '../components/GestureQuizGame';
import { WheelGame } from '../components/WheelGame';
import { MathArenaGame } from '../components/MathArenaGame';
import { MillionaireGame } from '../components/MillionaireGame';
import { MathRacingGame } from '../components/MathRacingGame';
import { GoldenBellGame } from '../components/GoldenBellGame';
import { CrosswordGame } from '../components/CrosswordGame';
import { ObstacleCourseGame } from '../components/ObstacleCourseGame';
import { MysteryDoorsGame } from '../components/MysteryDoorsGame';

export class GameFactory {
  public static createGameComponent(
    gameCode: string,
    lessons: LessonUnit[],
    onExitToMenu?: () => void,
    onProgressUpdate?: (current: number, total: number, isFinished: boolean) => void
  ): React.ReactElement | null {
    switch (gameCode) {
      case 'GESTURE_QUIZ_AI':
      case 'gesture-quiz':
      case 'game-ai-gesture-quiz':
      case GameTypeCode.GESTURE_QUIZ:
        return React.createElement(GestureQuizGame, { lessons, onExitToMenu, onProgressUpdate });

      case 'WHEEL_GAME':
      case 'wheel-game':
      case 'game-wheel-math':
      case GameTypeCode.WHEEL_GAME:
        return React.createElement(WheelGame, { lessons, onExitToMenu });

      case 'MATH_ARENA':
      case 'math-arena':
      case 'game-math-arena':
      case GameTypeCode.MATH_ARENA:
        return React.createElement(MathArenaGame, { lessons, onExitToMenu });

      case 'MILLIONAIRE':
      case 'millionaire':
      case 'game-millionaire':
      case GameTypeCode.MILLIONAIRE:
        return React.createElement(MillionaireGame, { lessons, onExitToMenu });

      case 'MATH_RACING':
      case 'math-racing':
      case 'game-math-racing':
      case GameTypeCode.MATH_RACING:
        return React.createElement(MathRacingGame, { lessons, onExitToMenu });

      case 'GOLDEN_BELL':
      case 'golden-bell':
      case 'game-golden-bell':
      case GameTypeCode.GOLDEN_BELL:
        return React.createElement(GoldenBellGame, { lessons, onExitToMenu });

      case 'MATH_CROSSWORD':
      case 'math-crossword':
      case 'game-math-crossword':
      case GameTypeCode.MATH_CROSSWORD:
        return React.createElement(CrosswordGame, { lessons, onExitToMenu });

      case 'OBSTACLE_COURSE':
      case 'obstacle-course':
      case 'game-obstacle-course':
      case GameTypeCode.OBSTACLE_COURSE:
        return React.createElement(ObstacleCourseGame, { lessons, onExitToMenu });

      case 'MYSTERY_DOORS':
      case 'mystery-doors':
      case 'game-mystery-doors':
      case GameTypeCode.MYSTERY_DOORS:
        return React.createElement(MysteryDoorsGame, { lessons, onExitToMenu });

      default:
        return React.createElement(GestureQuizGame, { lessons, onExitToMenu });
    }
  }
}


