import { QuizOptionKeyEnum } from '../../types/GameEnums';

export interface LandmarkPoint {
  x: number; // 0 to 1
  y: number; // 0 to 1
  z?: number;
}

export interface HandGestureResult {
  extendedFingersCount: number;
  detectedOption: QuizOptionKeyEnum | null;
  confidence: number;
  thumbExtended: boolean;
  indexExtended: boolean;
  middleExtended: boolean;
  ringExtended: boolean;
  pinkyExtended: boolean;
  wristPoint: LandmarkPoint;
  palmCenter: LandmarkPoint;
  centroid: LandmarkPoint;
}

export class GestureRecognitionEngine {
  /**
   * Evaluates hand landmarks (21 MediaPipe points) and classifies the gesture into 1, 2, 3, 4 fingers (A, B, C, D)
   * Highly optimized with multiple angle, distance, and relative geometry checks for maximum sensitivity.
   */
  public static classifyHandLandmarks(landmarks: LandmarkPoint[]): HandGestureResult | null {
    if (!landmarks || landmarks.length < 21) {
      return null;
    }

    const wrist = landmarks[0];

    // Reference points
    const mcp5 = landmarks[5]; // Index MCP
    const mcp9 = landmarks[9]; // Middle MCP
    const mcp17 = landmarks[17]; // Pinky MCP

    // Palm scale & center
    const palmScale = Math.hypot(mcp9.x - wrist.x, mcp9.y - wrist.y) || 0.2;
    const palmCenterX = (wrist.x + mcp5.x + mcp9.x + mcp17.x) / 4;
    const palmCenterY = (wrist.y + mcp5.y + mcp9.y + mcp17.y) / 4;

    // Helper: is a finger (index, middle, ring, pinky) extended
    const isFingerExtended = (tipIdx: number, dipIdx: number, pipIdx: number, mcpIdx: number): boolean => {
      const tip = landmarks[tipIdx];
      const dip = landmarks[dipIdx];
      const pip = landmarks[pipIdx];
      const mcp = landmarks[mcpIdx];

      // Distance from wrist & palm center to joint levels
      const distTipToWrist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const distDipToWrist = Math.hypot(dip.x - wrist.x, dip.y - wrist.y);
      const distPipToWrist = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
      const distMcpToWrist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);

      const distTipToPalm = Math.hypot(tip.x - palmCenterX, tip.y - palmCenterY);
      const distPipToPalm = Math.hypot(pip.x - palmCenterX, pip.y - palmCenterY);

      // Check 1: Tip distance significantly larger than PIP and MCP from wrist and palm center
      const isDistanceExtended =
        distTipToWrist > distPipToWrist * 1.08 &&
        distTipToWrist > distMcpToWrist * 1.25 &&
        distTipToPalm > distPipToPalm * 1.15;

      // Check 2: Tip is higher (smaller Y) than PIP or DIP joint in upward orientation
      const isVerticalExtended =
        tip.y < pip.y - 0.015 * (palmScale / 0.2) ||
        tip.y < dip.y - 0.01 * (palmScale / 0.2);

      // Check 3: Straight finger vector check (distance from MCP to Tip should be close to sum of phalanges)
      const directDist = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
      const segmentDist =
        Math.hypot(pip.x - mcp.x, pip.y - mcp.y) +
        Math.hypot(dip.x - pip.x, dip.y - pip.y) +
        Math.hypot(tip.x - dip.x, tip.y - dip.y);
      const isUnfolded = directDist > segmentDist * 0.72;

      return (isDistanceExtended || isVerticalExtended) && isUnfolded;
    };

    // Index (8: Tip, 7: DIP, 6: PIP, 5: MCP)
    const indexExtended = isFingerExtended(8, 7, 6, 5);
    // Middle (12: Tip, 11: DIP, 10: PIP, 9: MCP)
    const middleExtended = isFingerExtended(12, 11, 10, 9);
    // Ring (16: Tip, 15: DIP, 14: PIP, 13: MCP)
    const ringExtended = isFingerExtended(16, 15, 14, 13);
    // Pinky (20: Tip, 19: DIP, 18: PIP, 17: MCP)
    const pinkyExtended = isFingerExtended(20, 19, 18, 17);

    // Thumb check (Tip: 4, IP: 3, MCP: 2, CMC: 1)
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const thumbMcp = landmarks[2];

    const thumbDistToPinkyMcp = Math.hypot(thumbTip.x - mcp17.x, thumbTip.y - mcp17.y);
    const thumbIpDistToPinkyMcp = Math.hypot(thumbIp.x - mcp17.x, thumbIp.y - mcp17.y);
    const thumbDistToIndexMcp = Math.hypot(thumbTip.x - mcp5.x, thumbTip.y - mcp5.y);
    const thumbDistToWrist = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y);

    const thumbExtended =
      thumbDistToPinkyMcp > thumbIpDistToPinkyMcp * 1.15 &&
      thumbDistToIndexMcp > palmScale * 0.42 &&
      thumbDistToWrist > Math.hypot(thumbMcp.x - wrist.x, thumbMcp.y - wrist.y) * 1.15;

    // Count main 4 fingers
    const mainFingersCount = (indexExtended ? 1 : 0) +
      (middleExtended ? 1 : 0) +
      (ringExtended ? 1 : 0) +
      (pinkyExtended ? 1 : 0);

    let count = mainFingersCount;
    // Allow thumb as an extra extended finger if user naturally uses thumb (e.g., thumb+index for 2, or thumb+index+middle for 3)
    if (thumbExtended && mainFingersCount < 4 && !pinkyExtended) {
      count = mainFingersCount + 1;
    }

    let detectedOption: QuizOptionKeyEnum | null = null;
    let confidence = 0.88;

    // Robust mapping for classroom responsiveness:
    // 1 ngón giơ lên (thường là ngón trỏ hoặc ngón cái) -> A
    // 2 ngón (ngón trỏ + ngón giữa [Victory/Peace] hoặc ngón cái + trỏ) -> B
    // 3 ngón (trỏ + giữa + áp út hoặc cái + trỏ + giữa) -> C
    // 4 ngón (trỏ + giữa + áp út + út) -> D
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      detectedOption = QuizOptionKeyEnum.A;
      confidence = 0.98;
      count = 1;
    } else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      detectedOption = QuizOptionKeyEnum.B;
      confidence = 0.98;
      count = 2;
    } else if (indexExtended && middleExtended && ringExtended && !pinkyExtended) {
      detectedOption = QuizOptionKeyEnum.C;
      confidence = 0.98;
      count = 3;
    } else if (indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended) {
      detectedOption = QuizOptionKeyEnum.D;
      confidence = 0.98;
      count = 4;
    } else if (count === 1) {
      detectedOption = QuizOptionKeyEnum.A;
      confidence = 0.92;
    } else if (count === 2) {
      detectedOption = QuizOptionKeyEnum.B;
      confidence = 0.92;
    } else if (count === 3) {
      detectedOption = QuizOptionKeyEnum.C;
      confidence = 0.92;
    } else if (count === 4) {
      detectedOption = QuizOptionKeyEnum.D;
      confidence = 0.92;
    } else {
      // 0 (fist) or 5 (open palm waving)
      detectedOption = null;
      confidence = 0.5;
    }

    // Centroid calculation
    let sumX = 0;
    let sumY = 0;
    landmarks.forEach((p) => {
      sumX += p.x;
      sumY += p.y;
    });
    const centroid: LandmarkPoint = {
      x: sumX / landmarks.length,
      y: sumY / landmarks.length,
    };

    const palmCenter: LandmarkPoint = {
      x: palmCenterX,
      y: palmCenterY,
    };

    return {
      extendedFingersCount: count,
      detectedOption,
      confidence,
      thumbExtended,
      indexExtended,
      middleExtended,
      ringExtended,
      pinkyExtended,
      wristPoint: wrist,
      palmCenter,
      centroid,
    };
  }

  /**
   * Determine which player zone an X coordinate belongs to (0 to 1, mirrored for selfie camera)
   * Uses weighted anchor favoring the palm base and wrist so reaching fingers do not falsely trigger adjacent player zones.
   */
  public static mapHandToZone(
    gesture: HandGestureResult,
    zoneCount: number,
    isMirrored: boolean = true
  ): number {
    // Weighted anchor: 50% palm center, 30% wrist, 20% centroid
    const anchorX = gesture.palmCenter.x * 0.5 + gesture.wristPoint.x * 0.3 + gesture.centroid.x * 0.2;
    const effectiveX = isMirrored ? 1.0 - anchorX : anchorX;
    const clampedX = Math.max(0, Math.min(0.999, effectiveX));
    const zoneIndex = Math.floor(clampedX * zoneCount);
    return Math.max(0, Math.min(zoneCount - 1, zoneIndex));
  }

  /**
   * Legacy X coordinate mapping helper
   */
  public static mapXCoordinateToZone(
    x: number,
    zoneCount: number,
    isMirrored: boolean = true
  ): number {
    const effectiveX = isMirrored ? 1.0 - x : x;
    const clampedX = Math.max(0, Math.min(0.999, effectiveX));
    const zoneIndex = Math.floor(clampedX * zoneCount);
    return Math.max(0, Math.min(zoneCount - 1, zoneIndex));
  }
}
