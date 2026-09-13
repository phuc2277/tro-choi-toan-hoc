import { QuizOptionKeyEnum } from '../../types/GameEnums';
import { QuizOption } from '../../types/GestureQuiz';

export class QuizAnswerUtils {
  public static getOptionColor(optionKey: QuizOptionKeyEnum): {
    border: string;
    bg: string;
    text: string;
    accent: string;
    badge: string;
  } {
    switch (optionKey) {
      case QuizOptionKeyEnum.A:
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          accent: 'bg-blue-600 text-white',
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case QuizOptionKeyEnum.B:
        return {
          border: 'border-emerald-500',
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          accent: 'bg-emerald-600 text-white',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case QuizOptionKeyEnum.C:
        return {
          border: 'border-amber-500',
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          accent: 'bg-amber-600 text-white',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case QuizOptionKeyEnum.D:
        return {
          border: 'border-purple-500',
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          accent: 'bg-purple-600 text-white',
          badge: 'bg-purple-100 text-purple-800 border-purple-300',
        };
      default:
        return {
          border: 'border-slate-300',
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          accent: 'bg-slate-600 text-white',
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
        };
    }
  }

  public static getGestureFingersLabel(optionKey: QuizOptionKeyEnum): string {
    switch (optionKey) {
      case QuizOptionKeyEnum.A:
        return '1 ngón tay';
      case QuizOptionKeyEnum.B:
        return '2 ngón tay';
      case QuizOptionKeyEnum.C:
        return '3 ngón tay';
      case QuizOptionKeyEnum.D:
        return '4 ngón tay';
    }
  }

  public static getOptionByLetter(options: QuizOption[], letter: string): QuizOption | undefined {
    return options.find((opt) => opt.key.toUpperCase() === letter.toUpperCase());
  }
}
