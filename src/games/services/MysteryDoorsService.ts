import {
  MysteryDoorItem,
  DoorSurpriseType,
  MysteryThemePreset,
  MysteryDoorsPlayerState,
} from '../types/GamePlatform';

export class MysteryDoorsService {
  /**
   * Bộ chủ đề bí ẩn Toán học THCS phong phú với từ khóa và gợi ý
   */
  public static readonly MYSTERY_THEMES: MysteryThemePreset[] = [
    {
      id: 'theme-pythagoras',
      themeTitle: 'Bí Ẩn Tam Giác Vuông & Nhà Toán Học Cổ Đại',
      secretKeyword: 'ĐỊNH LÝ PYTAGO',
      clue: 'Trong một tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông (a² + b² = c²).',
      bgGradient: 'from-amber-600/30 via-purple-600/20 to-blue-600/30',
      icon: '📐',
    },
    {
      id: 'theme-prime',
      themeTitle: 'Kho Báu Mật Mã Các Con Số Kỳ Diệu',
      secretKeyword: 'SỐ NGUYÊN TỐ',
      clue: 'Tập hợp các số tự nhiên lớn hơn 1 chỉ có đúng 2 ước số là 1 và chính nó (2, 3, 5, 7, 11...).',
      bgGradient: 'from-emerald-600/30 via-teal-600/20 to-cyan-600/30',
      icon: '🔢',
    },
    {
      id: 'theme-symmetry',
      themeTitle: 'Vẻ Đẹp Đối Xứng Trong Thế Giới Tự Nhiên',
      secretKeyword: 'TRỤC ĐỐI XỨNG',
      clue: 'Đường thẳng chia một hình học thành hai nửa hoàn toàn trùng khớp khi gấp theo đường đó.',
      bgGradient: 'from-rose-600/30 via-pink-600/20 to-purple-600/30',
      icon: '🦋',
    },
    {
      id: 'theme-equation',
      themeTitle: 'Chìa Khóa Cân Bằng Cán Cân Toán Học',
      secretKeyword: 'PHƯƠNG TRÌNH BẬC NHẤT',
      clue: 'Mệnh đề toán học dạng ax + b = 0 (với a ≠ 0) tìm ẩn số x thỏa mãn đẳng thức.',
      bgGradient: 'from-blue-600/30 via-indigo-600/20 to-violet-600/30',
      icon: '⚖️',
    },
    {
      id: 'theme-probability',
      themeTitle: 'Vòng Xoay Xác Suất & Cơ Hội May Mắn',
      secretKeyword: 'XÁC SUẤT THỰC NGHIỆM',
      clue: 'Tỉ số giữa số lần xảy ra sự kiện và tổng số lần thực hiện phép thử trong trò chơi hoặc đời sống.',
      bgGradient: 'from-yellow-600/30 via-amber-600/20 to-orange-600/30',
      icon: '🎲',
    },
    {
      id: 'theme-circle',
      themeTitle: 'Vòng Tròn Hoàn Hảo & Hằng Số Pi Bất Tận',
      secretKeyword: 'HÌNH TRÒN VÀ SỐ PI',
      clue: 'Tập hợp tất cả các điểm cách đều tâm một khoảng R, với chu vi C = 2πR và diện tích S = πR².',
      bgGradient: 'from-cyan-600/30 via-blue-600/20 to-indigo-600/30',
      icon: '⭕',
    },
  ];

  /**
   * Danh sách các loại sự kiện bất ngờ sau cánh cửa
   */
  public static readonly SURPRISE_TYPES: {
    type: DoorSurpriseType;
    title: string;
    description: string;
    icon: string;
    badgeColor: string;
    multiplier: number;
    instantBonus: number;
  }[] = [
    {
      type: 'standard_challenge',
      title: 'Thử Thách Trí Tuệ',
      description: 'Trả lời chính xác câu hỏi để mở khóa ô cửa và nhận điểm chuẩn.',
      icon: '🧠',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      multiplier: 1,
      instantBonus: 0,
    },
    {
      type: 'lucky_star',
      title: '🌟 Ngôi Sao May Mắn (x2 Điểm)',
      description: 'Nhân đôi điểm số (+100%) khi giải đúng câu hỏi phía sau cánh cửa này!',
      icon: '⭐',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      multiplier: 2,
      instantBonus: 0,
    },
    {
      type: 'mystery_gift',
      title: '🎁 Hộp Quà Thần Kỳ (+30 Điểm)',
      description: 'Cộng ngay 30 điểm thưởng trực tiếp khi mở cửa và cộng tiếp điểm câu hỏi!',
      icon: '🎁',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      multiplier: 1,
      instantBonus: 30,
    },
    {
      type: 'gold_key',
      title: '🔑 Chìa Khóa Vàng Bí Ẩn',
      description: 'Mở khóa ngay 2 mảnh ghép bức tranh chủ đề bí mật khi vượt qua thử thách!',
      icon: '🔑',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      multiplier: 1.5,
      instantBonus: 20,
    },
    {
      type: 'time_freeze',
      title: '⏳ Đóng Băng Thời Gian (+15s)',
      description: 'Được tặng thêm 15 giây suy nghĩ quý giá để tính toán chắc chắn.',
      icon: '⏳',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      multiplier: 1,
      instantBonus: 15,
    },
    {
      type: 'bomb_challenge',
      title: '💣 Thử Thách Bom Tấn (x3 Điểm)',
      description: 'Cực kỳ kịch tính! Trả lời đúng trong 10s đầu nhận x3 điểm thưởng siêu khủng!',
      icon: '💣',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      multiplier: 3,
      instantBonus: 0,
    },
  ];

  /**
   * Bảng màu chủ đề cho các cánh cửa
   */
  public static readonly DOOR_THEME_COLORS = [
    { name: 'emerald', border: 'border-emerald-500/50', bg: 'from-emerald-900/60 to-emerald-950/80', glow: 'shadow-emerald-500/20', text: 'text-emerald-400' },
    { name: 'blue', border: 'border-blue-500/50', bg: 'from-blue-900/60 to-blue-950/80', glow: 'shadow-blue-500/20', text: 'text-blue-400' },
    { name: 'amber', border: 'border-amber-500/50', bg: 'from-amber-900/60 to-amber-950/80', glow: 'shadow-amber-500/20', text: 'text-amber-400' },
    { name: 'purple', border: 'border-purple-500/50', bg: 'from-purple-900/60 to-purple-950/80', glow: 'shadow-purple-500/20', text: 'text-purple-400' },
    { name: 'rose', border: 'border-rose-500/50', bg: 'from-rose-900/60 to-rose-950/80', glow: 'shadow-rose-500/20', text: 'text-rose-400' },
    { name: 'cyan', border: 'border-cyan-500/50', bg: 'from-cyan-900/60 to-cyan-950/80', glow: 'shadow-cyan-500/20', text: 'text-cyan-400' },
    { name: 'indigo', border: 'border-indigo-500/50', bg: 'from-indigo-900/60 to-indigo-950/80', glow: 'shadow-indigo-500/20', text: 'text-indigo-400' },
    { name: 'orange', border: 'border-orange-500/50', bg: 'from-orange-900/60 to-orange-950/80', glow: 'shadow-orange-500/20', text: 'text-orange-400' },
  ];

  /**
   * Sinh danh sách các ô cửa bí mật
   */
  public static generateDoors(
    doorCount: number = 8,
    availableQuestionCount: number = 1
  ): MysteryDoorItem[] {
    const safeDoorCount = Math.max(1, doorCount || 8);
    const safeQCount = Math.max(1, availableQuestionCount || 1);
    const surprises = [...this.SURPRISE_TYPES];
    // Guaranteed at least one lucky star, one gift, one gold key if doorCount >= 4
    const surprisePool: DoorSurpriseType[] = [];

    // Base distribution
    surprisePool.push('lucky_star');
    surprisePool.push('mystery_gift');
    surprisePool.push('gold_key');
    if (safeDoorCount >= 6) {
      surprisePool.push('bomb_challenge');
      surprisePool.push('time_freeze');
    }
    while (surprisePool.length < safeDoorCount) {
      surprisePool.push('standard_challenge');
    }

    // Shuffle surprises
    for (let i = surprisePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [surprisePool[i], surprisePool[j]] = [surprisePool[j], surprisePool[i]];
    }

    return Array.from({ length: safeDoorCount }, (_, index) => {
      const surpriseType = surprisePool[index] || 'standard_challenge';
      const surpriseMeta = this.SURPRISE_TYPES.find((s) => s.type === surpriseType) || this.SURPRISE_TYPES[0];
      const colorMeta = this.DOOR_THEME_COLORS[index % this.DOOR_THEME_COLORS.length] || this.DOOR_THEME_COLORS[0];

      return {
        id: `door-${index + 1}`,
        number: index + 1,
        label: `Ô CỬA SỐ ${index + 1}`,
        doorThemeColor: colorMeta.name,
        icon: ['🚪', '🏛️', '💎', '🔮', '🛡️', '⚡', '🗝️', '🛸'][index % 8] || '🚪',
        surpriseType,
        surpriseTitle: surpriseMeta.title,
        surpriseDescription: surpriseMeta.description,
        isOpen: false,
        isCompleted: false,
        questionIndex: index % safeQCount,
        scoreBonus: surpriseMeta.instantBonus,
      };
    });
  }

  /**
   * Khởi tạo danh sách người chơi / đội chơi
   */
  public static initPlayers(
    competitionMode: 'individual' | 'team',
    playerNames: string[] = []
  ): MysteryDoorsPlayerState[] {
    const safeNames = Array.isArray(playerNames) && playerNames.length > 0 ? playerNames : [];
    const defaultColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

    if (competitionMode === 'team') {
      const defaultTeams = [
        { name: 'Đội Rồng Lửa (Red Dragons)', color: '#EF4444' },
        { name: 'Đội Đại Bàng Xanh (Blue Eagles)', color: '#3B82F6' },
        { name: 'Đội Hổ Vàng (Golden Tigers)', color: '#F59E0B' },
        { name: 'Đội Chiến Binh Xanh (Green Warriors)', color: '#10B981' },
      ];

      const count = Math.max(2, Math.min(4, safeNames.length || 2));
      return Array.from({ length: count }, (_, idx) => {
        const teamInfo = defaultTeams[idx % defaultTeams.length];
        const customName = safeNames[idx]?.trim() || teamInfo.name;
        return {
          id: `team-${idx + 1}`,
          name: customName,
          score: 0,
          doorsOpened: 0,
          correctCount: 0,
          wrongCount: 0,
          avatarColor: teamInfo.color,
          teamLabel: `ĐỘI ${idx + 1}`,
        };
      });
    }

    // Individual mode
    const names = safeNames.length > 0 ? safeNames : ['Học sinh 1', 'Học sinh 2'];
    return names.map((name, idx) => ({
      id: `player-${idx + 1}`,
      name: name?.trim() || `Học sinh ${idx + 1}`,
      score: 0,
      doorsOpened: 0,
      correctCount: 0,
      wrongCount: 0,
      avatarColor: defaultColors[idx % defaultColors.length],
    }));
  }

  /**
   * Tính toán điểm thưởng khi giải đúng hoặc mở quà
   */
  public static calculateDoorScore(
    surpriseType: DoorSurpriseType,
    isCorrect: boolean,
    basePoints: number = 10,
    responseTimeSec: number = 0,
    timeLimitSec: number = 20
  ): { totalPoints: number; breakdown: { base: number; bonus: number; speedBonus: number } } {
    if (!isCorrect) {
      return { totalPoints: 0, breakdown: { base: 0, bonus: 0, speedBonus: 0 } };
    }

    const surpriseMeta = this.SURPRISE_TYPES.find((s) => s.type === surpriseType);
    const multiplier = surpriseMeta?.multiplier || 1;
    const instantBonus = surpriseMeta?.instantBonus || 0;

    let base = basePoints;
    let bonus = instantBonus;

    if (surpriseType === 'lucky_star') {
      base = basePoints * 2;
    } else if (surpriseType === 'bomb_challenge') {
      if (responseTimeSec <= 10) {
        base = basePoints * 3;
      } else {
        base = basePoints * 1.5;
      }
    } else if (surpriseType === 'gold_key') {
      base = Math.round(basePoints * 1.5);
    }

    // Speed bonus if answered in first 30% of time
    let speedBonus = 0;
    if (responseTimeSec > 0 && responseTimeSec <= timeLimitSec * 0.35) {
      speedBonus = 5;
    }

    const totalPoints = base + bonus + speedBonus;
    return {
      totalPoints,
      breakdown: { base, bonus, speedBonus },
    };
  }
}
