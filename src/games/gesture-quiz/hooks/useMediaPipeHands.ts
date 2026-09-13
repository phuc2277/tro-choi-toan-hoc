import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { GestureRecognitionEngine, LandmarkPoint } from '../utils/gestureRecognition';
import { HandZoneDetection } from '../../types/GestureQuiz';
import { QuizOptionKeyEnum } from '../../types/GameEnums';

interface UseMediaPipeHandsProps {
  zoneCount: number; // 1, 2, 3, 4
  requiredStableFrames?: number;
  onZoneAnswerLocked?: (zoneIndex: number, option: QuizOptionKeyEnum) => void;
  isActive: boolean;
  selectedDeviceId?: string;
}

// Global persistent stream to prevent hardware camera turn on/off flickering during transitions
let cachedMediaStream: MediaStream | null = null;
let cachedStreamDeviceId: string = '';
let activeConsumersCount = 0;
let stopStreamTimeout: NodeJS.Timeout | null = null;

function releaseGlobalStream(forceImmediate = false) {
  if (stopStreamTimeout) {
    clearTimeout(stopStreamTimeout);
    stopStreamTimeout = null;
  }

  const stopTracks = () => {
    if (activeConsumersCount <= 0 && cachedMediaStream) {
      cachedMediaStream.getTracks().forEach((t) => t.stop());
      cachedMediaStream = null;
      cachedStreamDeviceId = '';
    }
  };

  if (forceImmediate) {
    stopTracks();
  } else {
    // 4-second grace period before closing hardware track in case of rapid round/question transition
    stopStreamTimeout = setTimeout(stopTracks, 4000);
  }
}

export function useMediaPipeHands({
  zoneCount,
  requiredStableFrames = 6,
  onZoneAnswerLocked,
  isActive,
  selectedDeviceId,
}: UseMediaPipeHandsProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Keep references to prevent animation renderLoop recreation on prop changes
  const onZoneAnswerLockedRef = useRef(onZoneAnswerLocked);
  useEffect(() => {
    onZoneAnswerLockedRef.current = onZoneAnswerLocked;
  }, [onZoneAnswerLocked]);

  const zoneCountRef = useRef(zoneCount);
  useEffect(() => {
    zoneCountRef.current = zoneCount;
  }, [zoneCount]);

  const requiredStableFramesRef = useRef(requiredStableFrames);
  useEffect(() => {
    requiredStableFramesRef.current = requiredStableFrames;
  }, [requiredStableFrames]);

  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(cachedMediaStream);
  const [availableCameras, setAvailableCameras] = useState<{ deviceId: string; label: string }[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>(selectedDeviceId || '');

  // Keep activeDeviceId in sync if passed
  useEffect(() => {
    if (selectedDeviceId && selectedDeviceId !== activeDeviceId) {
      setActiveDeviceId(selectedDeviceId);
    }
  }, [selectedDeviceId, activeDeviceId]);

  // Enumerate video devices
  const updateAvailableCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1} (${index === 0 ? 'Mặc định/Laptop' : 'Webcam ngoài'})`,
        }));
      setAvailableCameras((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(videoInputs)) return prev;
        return videoInputs;
      });
    } catch (e) {
      console.warn('Could not enumerate cameras:', e);
    }
  }, []);

  // Per-zone detection and frame-stability tracking state
  const zoneTrackingState = useRef<
    {
      currentOption: QuizOptionKeyEnum | null;
      stableFrames: number;
      isLocked: boolean;
      lockedOption: QuizOptionKeyEnum | null;
    }[]
  >([]);

  // Public state exposed to UI
  const [zoneDetections, setZoneDetections] = useState<HandZoneDetection[]>([]);

  // Reset zone states when question changes or zoneCount changes
  const resetZoneStates = useCallback(() => {
    const count = zoneCountRef.current;
    zoneTrackingState.current = Array.from({ length: count }, () => ({
      currentOption: null,
      stableFrames: 0,
      isLocked: false,
      lockedOption: null,
    }));

    setZoneDetections(
      Array.from({ length: count }, (_, i) => ({
        zoneIndex: i,
        zoneName: `Vị trí ${i + 1}`,
        detectedOption: null,
        confidence: 0,
        stableFrameCount: 0,
        isLocked: false,
        extendedFingersCount: 0,
      }))
    );
  }, []);

  useEffect(() => {
    resetZoneStates();
  }, [zoneCount, resetZoneStates]);

  const [retryTrigger, setRetryTrigger] = useState(0);

  const retryCamera = useCallback(() => {
    setCameraError(null);
    if (cachedMediaStream) {
      cachedMediaStream.getTracks().forEach((t) => t.stop());
      cachedMediaStream = null;
      cachedStreamDeviceId = '';
    }
    setRetryTrigger((prev) => prev + 1);
  }, []);

  // Safe helper to attach stream to video element
  const safeAttachStream = useCallback((videoEl: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!stream) return;
    if (stream.getVideoTracks().some((t) => t.readyState === 'live')) {
      setIsCameraActive(true);
    }
    if (!videoEl) return;

    videoEl.muted = true;
    videoEl.playsInline = true;

    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }

    const tryPlay = () => {
      const p = videoEl.play();
      if (p !== undefined) {
        p.then(() => {
          setIsCameraActive(true);
        }).catch((err) => {
          console.warn('Video play attempt warning:', err);
          if (stream.getVideoTracks().some((t) => t.readyState === 'live')) {
            setIsCameraActive(true);
          }
        });
      }
    };

    tryPlay();
    videoEl.onloadedmetadata = () => tryPlay();
    videoEl.oncanplay = () => tryPlay();
    videoEl.onplay = () => setIsCameraActive(true);
  }, []);

  // Initialize MediaPipe HandLandmarker singleton
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      if (handLandmarkerRef.current) return;
      try {
        setIsLoadingModel(true);
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 8,
          minHandDetectionConfidence: 0.35,
          minHandPresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });

        if (!isMounted) return;
        handLandmarkerRef.current = landmarker;
        setIsLoadingModel(false);
      } catch (err) {
        console.warn('Failed to load MediaPipe from CDN, fallback vision active:', err);
        if (isMounted) {
          setIsLoadingModel(false);
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persistent Start/Stop Camera Management
  useEffect(() => {
    if (!isActive) {
      activeConsumersCount = Math.max(0, activeConsumersCount - 1);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setMediaStream(null);
      releaseGlobalStream(true);
      return;
    }

    activeConsumersCount += 1;
    if (stopStreamTimeout) {
      clearTimeout(stopStreamTimeout);
      stopStreamTimeout = null;
    }

    let isMounted = true;

    async function startCamera() {
      try {
        setCameraError(null);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ truy cập Camera (getUserMedia).');
        }

        // Check if we already have an active live stream with the same deviceId
        let stream: MediaStream | null = cachedMediaStream;
        const isExistingStreamLive =
          stream &&
          stream.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled) &&
          (!activeDeviceId || cachedStreamDeviceId === activeDeviceId);

        if (!isExistingStreamLive) {
          // If changing device or stream died, clean up old stream
          if (cachedMediaStream) {
            cachedMediaStream.getTracks().forEach((t) => t.stop());
            cachedMediaStream = null;
          }

          try {
            // Attempt 1: HD 720p with target device / user facing
            const videoConstraints: MediaTrackConstraints = {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            };
            if (activeDeviceId) {
              videoConstraints.deviceId = { ideal: activeDeviceId };
            } else {
              videoConstraints.facingMode = 'user';
            }

            stream = await navigator.mediaDevices.getUserMedia({
              video: videoConstraints,
              audio: false,
            });
          } catch (firstErr) {
            console.warn('HD camera constraints failed, trying basic fallback...', firstErr);
            try {
              // Attempt 2: Basic constraint with deviceId
              stream = await navigator.mediaDevices.getUserMedia({
                video: activeDeviceId ? { deviceId: { ideal: activeDeviceId } } : true,
                audio: false,
              });
            } catch (secondErr) {
              console.warn('Second attempt failed, trying raw video: true fallback...', secondErr);
              // Attempt 3: Pure video fallback
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
            }
          }

          cachedMediaStream = stream;
          cachedStreamDeviceId = activeDeviceId;
        }

        if (!isMounted) return;

        setMediaStream(stream);
        if (stream && stream.getVideoTracks().some((t) => t.readyState === 'live')) {
          setIsCameraActive(true);
        }

        // Populate available cameras
        updateAvailableCameras();

        // Attach stream to video element
        safeAttachStream(videoRef.current, stream);
      } catch (err: any) {
        console.error('Camera access error:', err);
        if (!isMounted) return;

        let userMsg = 'Không thể kết nối Camera. Vui lòng kiểm tra webcam của thiết bị.';
        const errName = err?.name || '';
        const errMsg = String(err?.message || '');

        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          userMsg = 'Quyền truy cập Camera bị từ chối. Vui lòng nhấn biểu tượng ổ khóa/camera trên thanh địa chỉ trình duyệt và chọn "Cho phép" (Allow).';
        } else if (
          errName === 'NotReadableError' ||
          errName === 'TrackStartError' ||
          errName === 'AbortError' ||
          errMsg.includes('Could not start video source') ||
          errMsg.includes('starting video failed')
        ) {
          userMsg = 'Camera đang bị ứng dụng khác chiếm dụng hoặc phần cứng webcam đang bận. Hãy đóng ứng dụng khác và nhấn nút "Thử Lại Camera".';
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          userMsg = 'Không tìm thấy thiết bị Camera nào được kết nối.';
        }

        setCameraError(userMsg);
        setIsCameraActive(false);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      activeConsumersCount = Math.max(0, activeConsumersCount - 1);
      releaseGlobalStream(false);
    };
  }, [isActive, retryTrigger, activeDeviceId, updateAvailableCameras, safeAttachStream]);

  // Continuous stream attachment watcher to guarantee video element is never black when remounted
  useEffect(() => {
    if (!isActive || !mediaStream) return;

    const checkAndAttach = () => {
      const video = videoRef.current;
      if (video && (video.srcObject !== mediaStream || video.paused)) {
        safeAttachStream(video, mediaStream);
      }
    };

    checkAndAttach();
    const interval = setInterval(checkAndAttach, 400);

    return () => clearInterval(interval);
  }, [isActive, mediaStream, safeAttachStream]);

  // Real-time Detection and Zone Rendering Loop
  useEffect(() => {
    if (!isActive || !isCameraActive) return;

    let lastVideoTime = -1;
    let lastStateUpdateTime = 0;

    const renderLoop = () => {
      if (!isActiveRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const curZoneCount = zoneCountRef.current;
      const curRequiredStableFrames = requiredStableFramesRef.current;

      if (
        !video ||
        !canvas ||
        video.readyState < 2 ||
        !video.videoWidth ||
        !video.videoHeight
      ) {
        animationFrameIdRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      // Match canvas dimensions to video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameIdRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Clear previous canvas frame
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Vertical Divider Lines for Zones
      const zoneWidth = width / curZoneCount;
      for (let i = 0; i < curZoneCount; i++) {
        const xStart = i * zoneWidth;

        if (i > 0) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.moveTo(xStart, 0);
          ctx.lineTo(xStart, height);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Zone header visual badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.beginPath();
        ctx.roundRect(xStart + 12, 12, Math.min(180, zoneWidth - 24), 32, 8);
        ctx.fill();

        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(`Người ${i + 1} (Khu vực ${i + 1})`, xStart + 22, 33);
      }

      // Temporary per-zone detections for this frame
      const currentFrameDetections: {
        zoneIndex: number;
        detectedOption: QuizOptionKeyEnum | null;
        confidence: number;
        landmarks?: LandmarkPoint[];
        extendedFingersCount: number;
        handScore: number;
      }[] = Array.from({ length: curZoneCount }, (_, idx) => ({
        zoneIndex: idx,
        detectedOption: null,
        confidence: 0,
        extendedFingersCount: 0,
        handScore: 0,
      }));

      // 2. Perform Hand Detection if MediaPipe is loaded
      if (handLandmarkerRef.current && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        try {
          const detections = handLandmarkerRef.current.detectForVideo(video, performance.now());

          if (detections && detections.landmarks && detections.landmarks.length > 0) {
            // Analyze all hands
            interface CandidateHand {
              rawPoints: LandmarkPoint[];
              gesture: NonNullable<ReturnType<typeof GestureRecognitionEngine.classifyHandLandmarks>>;
              effectiveX: number;
              zoneIdx: number;
              handScore: number;
            }

            const candidates: CandidateHand[] = [];

            detections.landmarks.forEach((handLandmarks) => {
              const rawPoints: LandmarkPoint[] = handLandmarks.map((p) => ({
                x: p.x,
                y: p.y,
                z: p.z,
              }));

              const gesture = GestureRecognitionEngine.classifyHandLandmarks(rawPoints);
              if (!gesture) return;

              // Effective X (mirrored 0 to 1 for selfie camera)
              const anchorX =
                gesture.palmCenter.x * 0.5 +
                gesture.wristPoint.x * 0.3 +
                gesture.centroid.x * 0.2;
              const effectiveX = 1.0 - anchorX;

              const zoneIdx = GestureRecognitionEngine.mapHandToZone(
                gesture,
                curZoneCount,
                true
              );

              // Priority score:
              // 1. Valid quiz gesture (A, B, C, D) gets +100 points
              // 2. Raised hand height: smaller Y = higher altitude, up to +50 points
              // 3. Confidence score: up to +25 points
              const optionBonus = gesture.detectedOption ? 100 : 0;
              const heightBonus = Math.max(0, (0.85 - gesture.centroid.y) * 60);
              const confBonus = gesture.confidence * 25;
              const handScore = optionBonus + heightBonus + confBonus;

              candidates.push({
                rawPoints,
                gesture,
                effectiveX,
                zoneIdx,
                handScore,
              });
            });

            // If 2 players mode and 2 hands detected:
            // Ensure spatial sorting fallback so Player 1 (left) is never claimed by Player 2 (right)
            if (curZoneCount === 2 && candidates.length >= 2) {
              // Sort left-to-right
              const sorted = [...candidates].sort((a, b) => a.effectiveX - b.effectiveX);
              if (sorted[0].effectiveX < sorted[1].effectiveX) {
                sorted[0].zoneIdx = 0;
                sorted[1].zoneIdx = 1;
              }
            }

            // Assign best candidate hand for each zone
            candidates.forEach((cand) => {
              const z = Math.max(0, Math.min(curZoneCount - 1, cand.zoneIdx));
              const existing = currentFrameDetections[z];

              if (!existing.detectedOption || cand.handScore > existing.handScore) {
                currentFrameDetections[z] = {
                  zoneIndex: z,
                  detectedOption: cand.gesture.detectedOption,
                  confidence: cand.gesture.confidence,
                  landmarks: cand.rawPoints,
                  extendedFingersCount: cand.gesture.extendedFingersCount,
                  handScore: cand.handScore,
                };
              }

              // Draw Hand Skeleton
              const connections = [
                [0, 1], [1, 2], [2, 3], [3, 4],
                [0, 5], [5, 6], [6, 7], [7, 8],
                [5, 9], [9, 10], [10, 11], [11, 12],
                [9, 13], [13, 14], [14, 15], [15, 16],
                [13, 17], [17, 18], [18, 19], [19, 20],
                [0, 17],
              ];

              ctx.strokeStyle = cand.gesture.detectedOption ? '#10b981' : '#38bdf8';
              ctx.lineWidth = 3;

              connections.forEach(([p1, p2]) => {
                const pt1 = cand.rawPoints[p1];
                const pt2 = cand.rawPoints[p2];
                const x1 = (1.0 - pt1.x) * width;
                const y1 = pt1.y * height;
                const x2 = (1.0 - pt2.x) * width;
                const y2 = pt2.y * height;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
              });

              // Draw Joints
              cand.rawPoints.forEach((pt, jointIdx) => {
                const px = (1.0 - pt.x) * width;
                const py = pt.y * height;
                ctx.beginPath();
                ctx.arc(px, py, [4, 8, 12, 16, 20].includes(jointIdx) ? 6 : 3, 0, 2 * Math.PI);
                ctx.fillStyle = [4, 8, 12, 16, 20].includes(jointIdx) ? '#fbbf24' : '#ffffff';
                ctx.fill();
              });

              // Draw Gesture Tag
              const tagX = (1.0 - cand.gesture.centroid.x) * width;
              const tagY = Math.max(50, cand.gesture.centroid.y * height - 30);

              const tagText = cand.gesture.detectedOption
                ? `Đáp án: ${cand.gesture.detectedOption} (${cand.gesture.extendedFingersCount} ngón)`
                : cand.gesture.extendedFingersCount === 5
                ? `Bàn tay mở (5 ngón)`
                : `Nắm tay (0 ngón)`;

              ctx.fillStyle = cand.gesture.detectedOption
                ? 'rgba(16, 185, 129, 0.9)'
                : 'rgba(30, 41, 59, 0.85)';
              ctx.beginPath();
              ctx.roundRect(tagX - 70, tagY - 14, 140, 26, 6);
              ctx.fill();

              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 12px system-ui';
              ctx.textAlign = 'center';
              ctx.fillText(tagText, tagX, tagY + 4);
              ctx.textAlign = 'left';
            });
          }
        } catch (detErr) {
          console.warn('Frame detection warning:', detErr);
        }
      }

      // 3. Update Stability Tracking per Zone
      let hasStatusChange = false;
      const updatedPublicDetections: HandZoneDetection[] = [];

      for (let z = 0; z < curZoneCount; z++) {
        const detection = currentFrameDetections[z];
        const state = zoneTrackingState.current[z] || {
          currentOption: null,
          stableFrames: 0,
          isLocked: false,
          lockedOption: null,
        };

        if (state.isLocked) {
          updatedPublicDetections.push({
            zoneIndex: z,
            zoneName: `Người ${z + 1}`,
            detectedOption: state.lockedOption,
            confidence: 1.0,
            stableFrameCount: curRequiredStableFrames,
            isLocked: true,
            extendedFingersCount: detection.extendedFingersCount,
          });
        } else {
          if (detection.detectedOption !== null) {
            if (detection.detectedOption === state.currentOption) {
              state.stableFrames += 1;
              if (state.stableFrames >= curRequiredStableFrames && !state.isLocked) {
                state.isLocked = true;
                state.lockedOption = detection.detectedOption;
                hasStatusChange = true;
                if (onZoneAnswerLockedRef.current) {
                  onZoneAnswerLockedRef.current(z, detection.detectedOption);
                }
              }
            } else {
              state.currentOption = detection.detectedOption;
              state.stableFrames = 1;
              hasStatusChange = true;
            }
          } else {
            if (state.stableFrames > 0) {
              state.stableFrames = Math.max(0, state.stableFrames - 1);
              if (state.stableFrames === 0) {
                state.currentOption = null;
                hasStatusChange = true;
              }
            }
          }

          zoneTrackingState.current[z] = state;

          updatedPublicDetections.push({
            zoneIndex: z,
            zoneName: `Người ${z + 1}`,
            detectedOption: state.isLocked ? state.lockedOption : state.currentOption,
            confidence: detection.confidence,
            stableFrameCount: state.stableFrames,
            isLocked: state.isLocked,
            extendedFingersCount: detection.extendedFingersCount,
          });
        }

        // Draw Zone Status overlay on Canvas directly (smooth 60fps canvas without React re-renders)
        const zStartX = z * zoneWidth;
        const zCenter = zStartX + zoneWidth / 2;
        const barY = height - 40;

        if (state.isLocked) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
          ctx.beginPath();
          ctx.roundRect(zCenter - 75, barY, 150, 30, 8);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(`🔒 ĐÃ KHÓA: ${state.lockedOption}`, zCenter, barY + 20);
          ctx.textAlign = 'left';
        } else if (state.currentOption && state.stableFrames > 0) {
          const progress = Math.min(1, state.stableFrames / curRequiredStableFrames);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(zCenter - 80, barY, 160, 30, 8);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.roundRect(zCenter - 76, barY + 22, 152 * progress, 4, 2);
          ctx.fill();

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 12px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(
            `Giữ ${state.currentOption}: ${Math.round(progress * 100)}%`,
            zCenter,
            barY + 16
          );
          ctx.textAlign = 'left';
        }
      }

      // Throttle React state updates to avoid 60fps re-render cycles
      const now = performance.now();
      if (hasStatusChange || now - lastStateUpdateTime > 180) {
        lastStateUpdateTime = now;
        setZoneDetections(updatedPublicDetections);
      }

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isActive, isCameraActive]);

  // Method to manually lock / trigger answer for a zone
  const manualTriggerZoneAnswer = useCallback(
    (zoneIndex: number, option: QuizOptionKeyEnum) => {
      const curZoneCount = zoneCountRef.current;
      const curRequiredStableFrames = requiredStableFramesRef.current;
      if (zoneIndex < 0 || zoneIndex >= curZoneCount) return;
      const state = zoneTrackingState.current[zoneIndex];
      if (state) {
        state.isLocked = true;
        state.lockedOption = option;
        state.currentOption = option;
        state.stableFrames = curRequiredStableFrames;
        if (onZoneAnswerLockedRef.current) {
          onZoneAnswerLockedRef.current(zoneIndex, option);
        }
        setZoneDetections((prev) =>
          prev.map((d, i) =>
            i === zoneIndex
              ? {
                  ...d,
                  isLocked: true,
                  detectedOption: option,
                  stableFrameCount: curRequiredStableFrames,
                }
              : d
          )
        );
      }
    },
    []
  );

  const stopCamera = useCallback(() => {
    setIsCameraActive(false);
    setMediaStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (cachedMediaStream) {
      cachedMediaStream.getTracks().forEach((t) => t.stop());
      cachedMediaStream = null;
      cachedStreamDeviceId = '';
    }
    releaseGlobalStream(true);
  }, []);

  return {
    videoRef,
    canvasRef,
    isLoadingModel,
    cameraError,
    isCameraActive,
    mediaStream,
    zoneDetections,
    resetZoneStates,
    manualTriggerZoneAnswer,
    retryCamera,
    stopCamera,
    availableCameras,
    activeDeviceId,
    setActiveDeviceId,
  };
}
