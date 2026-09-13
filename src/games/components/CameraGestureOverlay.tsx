import React, { useEffect } from 'react';
import { QuizOptionKeyEnum } from '../types/GameEnums';
import { HandZoneDetection } from '../types/GestureQuiz';
import { Camera, AlertCircle, Sparkles, Check, RefreshCw, Video, VideoOff, Loader2 } from 'lucide-react';

interface CameraGestureOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  isLoadingModel: boolean;
  cameraError: string | null;
  zoneCount: number;
  zoneDetections: HandZoneDetection[];
  onManualTrigger: (zoneIndex: number, option: QuizOptionKeyEnum) => void;
  onRetryCamera?: () => void;
  onTurnOffCamera?: () => void;
  playerLabels?: string[];
  teamLabels?: string[];
  availableCameras?: { deviceId: string; label: string }[];
  activeDeviceId?: string;
  onSelectCamera?: (deviceId: string) => void;
  mediaStream?: MediaStream | null;
  compact?: boolean;
}

export const CameraGestureOverlay: React.FC<CameraGestureOverlayProps> = ({
  videoRef,
  canvasRef,
  isCameraActive,
  isLoadingModel,
  cameraError,
  zoneCount,
  zoneDetections,
  onManualTrigger,
  onRetryCamera,
  onTurnOffCamera,
  playerLabels = [],
  teamLabels = [],
  availableCameras = [],
  activeDeviceId,
  onSelectCamera,
  mediaStream,
  compact = false,
}) => {
  // Guarantee that whenever this component mounts or stream updates, video element receives stream and plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    if (mediaStream) {
      if (video.srcObject !== mediaStream) {
        video.srcObject = mediaStream;
      }
      video.play().catch((err) => {
        console.warn('Video auto-play on overlay mount note:', err);
      });
    }
  }, [mediaStream, videoRef]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#0A0E17] border border-[#30363D] shadow-xl">
      {/* Video element (mirrored for selfie) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          v.muted = true;
          v.play().catch((err) => console.warn('video onLoadedMetadata play note:', err));
        }}
        onCanPlay={(e) => {
          const v = e.currentTarget;
          v.muted = true;
          v.play().catch((err) => console.warn('video onCanPlay play note:', err));
        }}
        className={`w-full object-cover -scale-x-100 bg-[#0A0E17] transition-all ${
          compact ? 'h-[160px] sm:h-[180px]' : 'h-[240px] sm:h-[300px] md:h-[340px]'
        }`}
      />

      {/* Canvas overlay for MediaPipe skeletons & zone boundaries */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Initializing / Connecting Camera Overlay */}
      {!isCameraActive && !mediaStream && !cameraError && !isLoadingModel && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0A0E17]/80 p-4 text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
          <p className="text-sm font-bold text-white">Đang kết nối luồng hình ảnh Camera...</p>
          <p className="text-xs text-gray-400 mt-1">Hệ thống đang mở ống kính webcam để nhận diện cử chỉ</p>
          {onRetryCamera && (
            <button
              type="button"
              onClick={onRetryCamera}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-xs font-semibold text-white transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Khởi động lại Camera</span>
            </button>
          )}
        </div>
      )}

      {/* Loading Model Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A0E17]/90 p-4 text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold text-white">Đang khởi tạo AI Nhận diện Cử chỉ MediaPipe...</p>
          <p className="text-xs text-gray-400 mt-1">Hệ thống đang chuẩn bị các khu vực camera cho học sinh</p>
        </div>
      )}

      {/* Camera Error / Permission Overlay */}
      {cameraError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A0E17]/95 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mb-2" />
          <h4 className="text-base font-bold text-white">Không thể kết nối Camera</h4>
          <p className="text-xs text-gray-300 max-w-md mt-1 leading-relaxed">{cameraError}</p>

          <div className="flex items-center gap-3 mt-4">
            {onRetryCamera && (
              <button
                type="button"
                onClick={onRetryCamera}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử Lại Camera</span>
              </button>
            )}
            {onTurnOffCamera && (
              <button
                type="button"
                onClick={onTurnOffCamera}
                className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/25 transition cursor-pointer"
              >
                <VideoOff className="w-3.5 h-3.5" />
                <span>Tắt Camera (Dùng phím)</span>
              </button>
            )}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#161B22] border border-[#30363D] text-xs text-amber-300 max-w-md">
            💡 <strong>Mẹo:</strong> Nếu camera bận hoặc không khả dụng, học sinh vẫn có thể dùng các phím bấm A, B, C, D bên dưới để trả lời trực tiếp mà không bị gián đoạn!
          </div>
        </div>
      )}

      {/* Top Banner Status Bar */}
      <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-[#0A0E17]/85 px-2.5 py-1 text-[11px] font-mono font-bold text-blue-400 backdrop-blur-md border border-[#30363D]">
          <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{isCameraActive ? `AI CAMERA HOẠT ĐỘNG • ${zoneCount} VÙNG` : 'ĐANG KẾT NỐI CAMERA...'}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Camera Selector Dropdown (Laptop vs External USB Camera) */}
          {availableCameras.length > 0 && onSelectCamera && (
            <div className="flex items-center gap-1.5 rounded-lg bg-[#0A0E17]/90 px-2 py-1 text-[11px] backdrop-blur-md border border-blue-500/40">
              <Video className="w-3 h-3 text-blue-400 shrink-0" />
              <select
                value={activeDeviceId || ''}
                onChange={(e) => onSelectCamera(e.target.value)}
                className="bg-transparent text-white font-medium text-[11px] focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[220px] truncate"
              >
                {availableCameras.map((cam, idx) => (
                  <option key={cam.deviceId || idx} value={cam.deviceId} className="bg-[#161B22] text-white">
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Refresh Camera Button */}
          {onRetryCamera && (
            <button
              type="button"
              onClick={onRetryCamera}
              title="Khởi động lại kết nối Camera"
              className="p-1 rounded-lg bg-[#0A0E17]/85 hover:bg-blue-600/30 text-gray-300 hover:text-white border border-[#30363D] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dedicated Turn Off Camera Button */}
          {onTurnOffCamera && (
            <button
              type="button"
              onClick={onTurnOffCamera}
              title="Tắt Camera và chuyển sang phương thức Phím bấm / Bảng chọn thủ công"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white text-[11px] font-bold shadow-md shadow-rose-600/20 border border-rose-400/40 transition cursor-pointer"
            >
              <VideoOff className="w-3 h-3 shrink-0" />
              <span>Tắt Camera</span>
            </button>
          )}

          <div className="rounded-lg bg-[#0A0E17]/85 px-2.5 py-1 text-[11px] font-medium text-gray-300 backdrop-blur-md border border-[#30363D] hidden md:block">
            Giơ 1, 2, 3, 4 ngón tay
          </div>
        </div>
      </div>

      {/* Bottom Interactive Zone Controls & Status */}
      <div className="bg-[#161B22] border-t border-[#30363D] p-3">
        <div
          className={`grid gap-2 ${
            zoneCount === 1
              ? 'grid-cols-1'
              : zoneCount === 2
              ? 'grid-cols-2'
              : zoneCount === 3
              ? 'grid-cols-3'
              : 'grid-cols-4'
          }`}
        >
          {Array.from({ length: zoneCount }).map((_, zIdx) => {
            const detection = zoneDetections[zIdx];
            const pLabel = playerLabels[zIdx] || `Người ${zIdx + 1}`;
            const tLabel = teamLabels[zIdx];
            const isLocked = detection?.isLocked;
            const currentOpt = detection?.detectedOption;

            return (
              <div
                key={zIdx}
                className={`rounded-xl p-2.5 transition border ${
                  isLocked
                    ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300'
                    : currentOpt
                    ? 'border-blue-500/60 bg-blue-950/30 text-blue-200'
                    : 'border-[#30363D] bg-[#0A0E17] text-gray-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="font-bold truncate pr-1 text-white">
                    {pLabel}
                    {tLabel && <span className="text-[10px] text-gray-400 block font-normal">{tLabel}</span>}
                  </div>
                  {isLocked ? (
                    <span className="shrink-0 flex items-center gap-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold px-1.5 py-0.5 border border-emerald-500/40">
                      <Check className="w-3 h-3" /> {currentOpt}
                    </span>
                  ) : currentOpt ? (
                    <span className="shrink-0 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold px-1.5 py-0.5 border border-blue-500/30">
                      Giữ {currentOpt}...
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] text-gray-500 font-mono">Chờ cử chỉ</span>
                  )}
                </div>

                {/* Simulator Buttons (Allows testing or manual click for any student) */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[QuizOptionKeyEnum.A, QuizOptionKeyEnum.B, QuizOptionKeyEnum.C, QuizOptionKeyEnum.D].map(
                    (opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onManualTrigger(zIdx, opt)}
                        disabled={isLocked}
                        className={`rounded-lg py-1 text-[11px] font-mono font-bold transition ${
                          currentOpt === opt && isLocked
                            ? 'bg-emerald-500 text-white'
                            : currentOpt === opt
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#21262D] text-gray-300 hover:bg-[#30363D] hover:text-white disabled:opacity-30'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
