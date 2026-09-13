import { LessonGameMetadata } from '../types/LessonGame';
import { GameTypeCode } from '../types/GameEnums';

export class GameRegistry {
  private static registeredGames: Map<string, LessonGameMetadata> = new Map();

  public static registerGame(game: LessonGameMetadata): void {
    this.registeredGames.set(game.code, game);
  }

  public static getGameByCode(code: string): LessonGameMetadata | undefined {
    return this.registeredGames.get(code);
  }

  public static getAllGames(): LessonGameMetadata[] {
    return Array.from(this.registeredGames.values());
  }
}

// 1. Pre-register official AI Gesture Quiz game
GameRegistry.registerGame({
  id: 'game-ai-gesture-quiz',
  code: 'GESTURE_QUIZ_AI',
  gameType: GameTypeCode.GESTURE_QUIZ,
  name: 'Trắc Nghiệm Cử Chỉ AI',
  description: 'Trò chơi trắc nghiệm tương tác cử chỉ bàn tay AI và giọng nói cho Khởi động & Luyện tập THCS.',
  category: 'gesture-ai',
  targetAudience: 'Học sinh Cấp 2 (Lớp 6, 7, 8, 9)',
  iconName: 'Sparkles',
  badge: 'MediaPipe AI',
  isAvailable: true,
});

// 2. Chiếc nón kỳ diệu (Wheel Game)
GameRegistry.registerGame({
  id: 'game-wheel-math',
  code: 'WHEEL_GAME',
  gameType: GameTypeCode.WHEEL_GAME,
  name: 'Chiếc Nón Kỳ Diệu',
  description: 'Vòng quay may mắn điểm số và thử thách câu hỏi Toán học kịch tính theo lượt chơi cá nhân / đồng đội.',
  category: 'interactive',
  targetAudience: 'Học sinh Cấp 2 (Lớp 6, 7, 8, 9)',
  iconName: 'Disc',
  badge: 'Vòng Quay',
  isAvailable: true,
});

// 3. Đấu trường Toán học (Math Arena)
GameRegistry.registerGame({
  id: 'game-math-arena',
  code: 'MATH_ARENA',
  gameType: GameTypeCode.MATH_ARENA,
  name: 'Đấu Trường Toán Học',
  description: 'Sân đấu trắc nghiệm thời gian thực, thi đấu tốc độ, tính điểm chuỗi liên tiếp (Streak) và cập nhật thứ hạng tức thì.',
  category: 'interactive',
  targetAudience: 'Học sinh Cấp 2 (Lớp 6, 7, 8, 9)',
  iconName: 'Swords',
  badge: 'Đấu Đấu',
  isAvailable: true,
});

// 4. Ai là triệu phú (Millionaire)
GameRegistry.registerGame({
  id: 'game-millionaire',
  code: 'MILLIONAIRE',
  gameType: GameTypeCode.MILLIONAIRE,
  name: 'Ai Là Triệu Phú',
  description: 'Thang thưởng 15 câu hỏi kịch tính với 3 quyền trợ giúp: 50:50, Hỏi ý kiến khán giả, Gọi điện cho chuyên gia Toán học.',
  category: 'interactive',
  targetAudience: 'Học sinh Cấp 2 (Lớp 6, 7, 8, 9)',
  iconName: 'Trophy',
  badge: 'Thang Điểm',
  isAvailable: true,
});

// 5. Đua xe Toán học (Math Racing)
GameRegistry.registerGame({
  id: 'game-math-racing',
  code: 'MATH_RACING',
  gameType: GameTypeCode.MATH_RACING,
  name: 'Đua Xe Toán Học',
  description: 'Cuộc đua tốc độ kịch tính! Trả lời đúng và nhanh để kích hoạt động cơ Nitro tăng tốc về đích đầu tiên.',
  category: 'interactive',
  targetAudience: 'Học sinh Cấp 2 (Lớp 6, 7, 8, 9)',
  iconName: 'Flame',
  badge: 'Đua Xe Tốc Độ',
  isAvailable: true,
});

// 6. Rung chuông vàng (Golden Bell)
GameRegistry.registerGame({
  id: 'game-golden-bell',
  code: 'GOLDEN_BELL',
  gameType: GameTypeCode.GOLDEN_BELL,
  name: 'Rung Chuông Vàng',
  description: 'Sàn đấu loại trực tiếp kịch tính theo format truyền hình với phao cứu trợ của giáo viên và lễ đăng quang chuông vàng.',
  category: 'interactive',
  targetAudience: 'Học sinh Cấp 2 (Lớp 6, 7, 8, 9)',
  iconName: 'Bell',
  badge: 'Sàn Đấu Loại',
  isAvailable: true,
});

// 7. Ô chữ bí mật (Math Crossword)
GameRegistry.registerGame({
  id: 'game-math-crossword',
  code: 'MATH_CROSSWORD',
  gameType: GameTypeCode.MATH_CROSSWORD,
  name: 'Ô Chữ Bí Mật',
  description: 'Giải mã từng câu hỏi để mở các mảnh ghép chữ cái, tư duy logic để đoán từ khóa Toán học bí ẩn nhận điểm thưởng.',
  category: 'interactive',
  targetAudience: 'Học sinh Cấp 2 (Lớp 6, 7, 8, 9)',
  iconName: 'KeyRound',
  badge: 'Giải Mã Ô Chữ',
  isAvailable: true,
});

// 8. Vượt chướng ngại vật (Obstacle Course)
GameRegistry.registerGame({
  id: 'game-obstacle-course',
  code: 'OBSTACLE_COURSE',
  gameType: GameTypeCode.OBSTACLE_COURSE,
  name: 'Vượt Chướng Ngại Vật',
  description: 'Chuyến thám hiểm leo núi vượt qua cự thạch, cầu treo, nham thạch, bão tố và rồng thần để cắm cờ trên đỉnh núi cao.',
  category: 'interactive',
  targetAudience: 'Học sinh Cấp 2 (Lớp 6, 7, 8, 9)',
  iconName: 'Mountain',
  badge: 'Thám Hiểm',
  isAvailable: true,
});

// 9. Ô cửa bí mật (Mystery Doors)
GameRegistry.registerGame({
  id: 'game-mystery-doors',
  code: 'MYSTERY_DOORS',
  gameType: GameTypeCode.MYSTERY_DOORS,
  name: 'Ô Cửa Bí Mật',
  description: 'Mở các cánh cửa huyền bí, đón nhận bất ngờ (Ngôi Sao May Mắn, Hộp Quà, Chìa Khóa Vàng) và giải mã Bức Tranh Mật Mã Toán Học.',
  category: 'interactive',
  targetAudience: 'Học sinh Cấp 2 (Lớp 6, 7, 8, 9)',
  iconName: 'DoorOpen',
  badge: 'Cánh Cửa Bí Ẩn',
  isAvailable: true,
});



