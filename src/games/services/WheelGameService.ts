import { WheelSector, WheelPlayerState } from '../types/GamePlatform';

export const DEFAULT_WHEEL_SECTORS: WheelSector[] = [
  { id: 'sec-1', label: '10 Điểm', value: 10, type: 'points', color: '#2563EB', textColor: '#FFFFFF' },
  { id: 'sec-2', label: '30 Điểm', value: 30, type: 'points', color: '#10B981', textColor: '#FFFFFF' },
  { id: 'sec-3', label: 'MẤT LƯỢT', value: 0, type: 'lose_turn', color: '#EF4444', textColor: '#FFFFFF' },
  { id: 'sec-4', label: '50 Điểm', value: 50, type: 'points', color: '#F59E0B', textColor: '#000000' },
  { id: 'sec-5', label: '20 Điểm', value: 20, type: 'points', color: '#8B5CF6', textColor: '#FFFFFF' },
  { id: 'sec-6', label: 'NHÂN ĐÔI', value: 0, type: 'double', color: '#EC4899', textColor: '#FFFFFF' },
  { id: 'sec-7', label: '100 Điểm', value: 100, type: 'points', color: '#06B6D4', textColor: '#FFFFFF' },
  { id: 'sec-8', label: 'THÊM LƯỢT', value: 15, type: 'free_turn', color: '#14B8A6', textColor: '#FFFFFF' },
];

export class WheelGameService {
  /**
   * Calculates the exact sector under the top pointer (270 deg / 12 o'clock) for any rotation
   */
  public static getSectorAtRotation(
    rotation: number,
    sectors: WheelSector[] = DEFAULT_WHEEL_SECTORS
  ): { sector: WheelSector; sectorIndex: number } {
    const sectorCount = sectors.length;
    const sectorAngle = 360 / sectorCount;

    // Pointer is at TOP (12 o'clock = 270 deg in SVG circle coordinates where 0 deg is 3 o'clock)
    // When wheel is rotated clockwise by R degrees, the SVG angle under pointer is:
    const angleUnderPointer = (((270 - (rotation % 360)) % 360) + 360) % 360;
    const sectorIndex = Math.floor(angleUnderPointer / sectorAngle) % sectorCount;

    return {
      sector: sectors[sectorIndex],
      sectorIndex,
    };
  }

  /**
   * Calculates random destination spin angle with multiple full rotations
   * ensuring the chosen sector lands directly under the top pointer.
   */
  public static calculateSpinTarget(
    currentRotation: number,
    sectors: WheelSector[] = DEFAULT_WHEEL_SECTORS
  ): { targetAngle: number; selectedSector: WheelSector; sectorIndex: number } {
    const sectorCount = sectors.length;
    const sectorAngle = 360 / sectorCount;

    // Pick random sector
    const chosenIndex = Math.floor(Math.random() * sectorCount);
    const selectedSector = sectors[chosenIndex];

    // Center of chosen sector in unrotated SVG coordinates (0 deg is 3 o'clock)
    const sectorCenterAngle = chosenIndex * sectorAngle + sectorAngle / 2;

    // Small jitter within safe margin (+/- 25% of slice) so it doesn't land on borders
    const jitter = (Math.random() - 0.5) * (sectorAngle * 0.5);

    // Desired normalized rotation such that sectorCenter + jitter aligns with TOP pointer (270 deg)
    const targetNormRotation = (((270 - (sectorCenterAngle + jitter)) % 360) + 360) % 360;

    // Current normalized rotation
    const currentNorm = ((currentRotation % 360) + 360) % 360;

    // Forward angular distance to reach target
    let forwardDelta = targetNormRotation - currentNorm;
    if (forwardDelta <= 0) {
      forwardDelta += 360;
    }

    // Spin 5 to 7 full rotations + forward delta
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetAngle = currentRotation + extraSpins + forwardDelta;

    // Double check with reverse resolution
    const resolved = this.getSectorAtRotation(targetAngle, sectors);

    return {
      targetAngle,
      selectedSector: resolved.sector,
      sectorIndex: resolved.sectorIndex,
    };
  }

  /**
   * Applies points or modifiers to the active player based on sector and answer correctness
   */
  public static resolveAnswerScore(
    player: WheelPlayerState,
    sector: WheelSector,
    isCorrect: boolean
  ): { updatedScore: number; scoreDelta: number; message: string } {
    let scoreDelta = 0;
    let message = '';

    if (sector.type === 'lose_turn') {
      message = 'Ô Mất lượt!';
      return { updatedScore: player.score, scoreDelta: 0, message };
    }

    if (isCorrect) {
      if (sector.type === 'double') {
        scoreDelta = player.score > 0 ? player.score : 50;
        message = `Chính xác! Nhân đôi số điểm (+${scoreDelta}đ)`;
      } else if (sector.type === 'free_turn') {
        scoreDelta = sector.value || 15;
        message = `Chính xác! Nhận ${scoreDelta}đ và giữ quyền chơi!`;
      } else {
        scoreDelta = sector.value;
        message = `Chính xác! Nhận +${scoreDelta} điểm!`;
      }
    } else {
      message = 'Trả lời chưa đúng, không ghi được điểm vòng này.';
    }

    const updatedScore = Math.max(0, player.score + scoreDelta);
    return { updatedScore, scoreDelta, message };
  }

  /**
   * Sorts players by descending score, then correctCount, then ascending wrongCount
   */
  public static rankPlayers(players: WheelPlayerState[]): WheelPlayerState[] {
    return [...players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.wrongCount - b.wrongCount;
    });
  }
}
