import { ObstacleItem, ObstacleType, ExplorerState } from '../types/GamePlatform';

export class ObstacleCourseService {
  public static readonly OBSTACLE_THEMES: {
    type: ObstacleType;
    name: string;
    icon: string;
    description: string;
  }[] = [
    {
      type: 'boulder',
      name: 'Khối Đá Cự Thạch',
      icon: '🪨',
      description: 'Một tảng đá khổng lồ chắn ngang hẻm núi hiểm trở. Hãy tính toán chuẩn xác để dọn đường!',
    },
    {
      type: 'suspension_bridge',
      name: 'Cầu Treo Vực Thẳm',
      icon: '🌉',
      description: 'Cầu dây văng lơ lửng giữa mây ngàn. Trả lời đúng để gia cố nhịp cầu vững chắc!',
    },
    {
      type: 'lava_pit',
      name: 'Dòng Sông Nham Thạch',
      icon: '🌋',
      description: 'Nham thạch nóng chảy cuồn cuộn. Kích hoạt kết giới băng để tạo lối vượt qua an toàn!',
    },
    {
      type: 'vortex',
      name: 'Cơn Lốc Xoáy Huyền Bí',
      icon: '🌪️',
      description: 'Luồng gió xoáy cực mạnh cản bước tiến. Tìm quy luật góc xoay để lướt qua bão!',
    },
    {
      type: 'dragon_guardian',
      name: 'Thần Long Canh Giữ',
      icon: '🐉',
      description: 'Rồng thần bảo vệ cổ bảo. Dùng kiến thức Toán học để chinh phục và nhận lời chúc phúc!',
    },
    {
      type: 'cipher_gate',
      name: 'Cổng Thành Mật Mã',
      icon: '🔐',
      description: 'Cánh cổng cổ khắc mật tự toán học. Giải mã đúng chìa khóa để tiến vào đền thần!',
    },
    {
      type: 'summit_temple',
      name: 'Đỉnh Núi Thượng Đỉnh',
      icon: '🏆',
      description: 'Cột mốc vinh quang tối thượng. Cắm cờ chiến thắng để hoàn thành chuyến thám hiểm!',
    },
  ];

  /**
   * Generates a sequence of obstacles matching the number of questions
   */
  public static generateObstacles(questionCount: number): ObstacleItem[] {
    return Array.from({ length: questionCount }, (_, index) => {
      // Last question is always Summit Temple if more than 3 questions
      if (index === questionCount - 1 && questionCount >= 3) {
        const summit = this.OBSTACLE_THEMES.find((t) => t.type === 'summit_temple')!;
        return {
          id: `obstacle-${index + 1}`,
          type: summit.type,
          name: summit.name,
          icon: summit.icon,
          description: summit.description,
          questionIndex: index,
          isCleared: false,
          clearedByCorrect: false,
          penaltyTimeSec: 0,
        };
      }

      const theme = this.OBSTACLE_THEMES[index % (this.OBSTACLE_THEMES.length - 1)];
      return {
        id: `obstacle-${index + 1}`,
        type: theme.type,
        name: theme.name,
        icon: theme.icon,
        description: theme.description,
        questionIndex: index,
        isCleared: false,
        clearedByCorrect: false,
        penaltyTimeSec: 0,
      };
    });
  }

  /**
   * Initializes explorer expedition state
   */
  public static initExplorer(totalObstacles: number): ExplorerState {
    return {
      currentObstacleIndex: 0,
      totalObstacles,
      score: 0,
      health: 100,
      itemsUnlocked: ['🗺️ Bản đồ địa hình', '🧭 La bàn cổ'],
      totalTimeSeconds: 0,
      clearedCount: 0,
      status: 'trekking',
    };
  }

  /**
   * Clears obstacle or applies penalty
   */
  public static processObstacleAttempt(
    explorer: ExplorerState,
    isCorrect: boolean,
    responseTimeSec: number
  ): { updatedExplorer: ExplorerState; scoreGain: number; itemFound?: string } {
    let scoreGain = 0;
    let itemFound: string | undefined;

    const newClearedCount = isCorrect ? explorer.clearedCount + 1 : explorer.clearedCount;
    const newScore = isCorrect ? explorer.score + 10 : explorer.score;
    const newHealth = isCorrect ? explorer.health : Math.max(10, explorer.health - 15);
    const newTotalTime = explorer.totalTimeSeconds + responseTimeSec;

    // Discovery perks at specific milestones
    if (isCorrect) {
      scoreGain = 10;
      if (newClearedCount === 3 && !explorer.itemsUnlocked.includes('🛡️ Khiên Thần')) {
        itemFound = '🛡️ Khiên Hộ Mệnh Cổ Đại';
      } else if (newClearedCount === 6 && !explorer.itemsUnlocked.includes('⚡ Giày Siêu Tốc')) {
        itemFound = '⚡ Giày Thần Siêu Tốc';
      }
    }

    const updatedItems = itemFound ? [...explorer.itemsUnlocked, itemFound] : explorer.itemsUnlocked;

    const nextIndex = explorer.currentObstacleIndex + 1;
    const isConquered = nextIndex >= explorer.totalObstacles;

    return {
      updatedExplorer: {
        ...explorer,
        currentObstacleIndex: nextIndex,
        score: newScore,
        health: newHealth,
        itemsUnlocked: updatedItems,
        totalTimeSeconds: Number(newTotalTime.toFixed(1)),
        clearedCount: newClearedCount,
        status: isConquered ? 'conquered' : isCorrect ? 'cleared' : 'failed',
      },
      scoreGain,
      itemFound,
    };
  }
}
