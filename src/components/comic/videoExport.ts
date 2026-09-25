/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Xuất "Truyện Tranh Bài Học" thành video thật (.webm) ngay trên trình duyệt:
 * 1. Chụp ảnh từng khung hình đã render (SVG + layer chữ/KaTeX) bằng html-to-image.
 * 2. Sinh giọng đọc thật (Gemini TTS) cho lời dẫn + hội thoại từng khung (tái dùng
 *    audio đã tạo sẵn ở Bước 7 nếu có, để tiết kiệm và đồng bộ với những gì giáo viên
 *    đã nghe duyệt).
 * 3. Vẽ hiệu ứng Ken Burns (zoom/pan nhẹ) lên canvas theo đúng thời lượng mỗi khung,
 *    đồng thời phát audio đã lên lịch qua Web Audio API.
 * 4. Ghép video-track (canvas.captureStream) + audio-track (AudioContext destination)
 *    và ghi lại bằng MediaRecorder thành file .webm để tải về.
 *
 * Lưu ý: quá trình ghi chạy theo thời gian thực (bằng đúng độ dài video), vì
 * MediaRecorder ghi lại đúng những gì canvas hiển thị theo thời gian thực.
 */
import { toPng } from 'html-to-image';
import { ComicLessonProject, ComicScene, ComicFrame, CharacterProfile } from '../../types/comicLesson';

export interface ExportProgress {
  stage: 'capturing' | 'synthesizing' | 'recording' | 'done' | 'error';
  frameIndex: number;
  totalFrames: number;
  message: string;
}

const NARRATOR_VOICE = 'Charon';

const pickVoiceForCharacter = (char?: CharacterProfile): string => {
  if (!char) return 'Charon';
  if (char.role === 'teacher' || char.role === 'guide') return char.gender === 'female' ? 'Leda' : 'Orus';
  return char.gender === 'female' ? 'Kore' : 'Puck';
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

async function synthesizeSpeech(text: string, voiceName: string) {
  if (!text || !text.trim()) return null;
  try {
    const res = await fetch('/api/comic/synthesize-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName }),
    });
    const data = await res.json();
    if (res.ok && data.audioBase64) return data as { audioBase64: string; mimeType: string; durationSec: number };
  } catch {
    // ignore, caller treats as "no audio for this line"
  }
  return null;
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  words.forEach((w) => {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function drawCaptionOverlay(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, caption: string) {
  if (!caption) return;
  ctx.font = 'bold 26px "Plus Jakarta Sans", system-ui, sans-serif';
  const paddingX = 48;
  const maxWidth = canvas.width - paddingX * 2;
  const lines = wrapCanvasText(ctx, caption, maxWidth);
  const lineHeight = 34;
  const boxHeight = lines.length * lineHeight + 28;
  ctx.fillStyle = 'rgba(7,10,19,0.82)';
  ctx.fillRect(0, canvas.height - boxHeight - 24, canvas.width, boxHeight + 24);
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  lines.forEach((ln, li) => {
    ctx.fillText(ln, canvas.width / 2, canvas.height - boxHeight - 4 + (li + 1) * lineHeight);
  });
}

interface FrameAsset {
  scene: ComicScene;
  frame: ComicFrame;
  imageDataUrl: string;
  audioBuffers: AudioBuffer[];
  durationSec: number;
}

export function isVideoExportSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' && typeof (HTMLCanvasElement.prototype as any).captureStream === 'function';
}

export async function exportComicVideo(
  project: ComicLessonProject,
  allFrames: Array<{ scene: ComicScene; frame: ComicFrame }>,
  stageEl: HTMLElement,
  setFrameIndex: (idx: number) => void,
  onProgress: (p: ExportProgress) => void
): Promise<Blob> {
  if (!isVideoExportSupported()) {
    throw new Error(
      'Trình duyệt của bạn không hỗ trợ ghi video (MediaRecorder/captureStream). Vui lòng dùng Chrome hoặc Edge trên máy tính.'
    );
  }
  if (allFrames.length === 0) {
    throw new Error('Chưa có khung hình nào để xuất video.');
  }

  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx: AudioContext = new AudioContextCtor();
  const destination = audioCtx.createMediaStreamDestination();

  // ---- 1. Chụp ảnh từng khung + sinh/tái dùng audio ----
  const assets: FrameAsset[] = [];
  for (let i = 0; i < allFrames.length; i++) {
    const { scene, frame } = allFrames[i];
    setFrameIndex(i);
    onProgress({ stage: 'capturing', frameIndex: i, totalFrames: allFrames.length, message: `Đang chụp khung ${frame.frameId}...` });

    // Chờ React vẽ xong khung mới + font/KaTeX kịp render trước khi chụp ảnh
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 200));

    let imageDataUrl: string;
    try {
      imageDataUrl = await toPng(stageEl, { pixelRatio: 1, cacheBust: true, skipFonts: true } as any);
    } catch (err) {
      throw new Error(`Không thể chụp khung ${frame.frameId}: ${(err as Error).message || 'lỗi không xác định'}`);
    }

    onProgress({ stage: 'synthesizing', frameIndex: i, totalFrames: allFrames.length, message: `AI đang chuẩn bị giọng đọc cho ${frame.frameId}...` });

    const isFirstFrameOfScene = scene.frames[0]?.frameId === frame.frameId;
    const lines: Array<{ text: string; voiceName: string; reuseClip?: { audioBase64: string; mimeType: string } }> = [];

    if (isFirstFrameOfScene && scene.narration) {
      lines.push({ text: scene.narration, voiceName: NARRATOR_VOICE, reuseClip: scene.narrationAudio });
    }
    frame.speechBubbles.forEach((sb) => {
      const char = project.characters.find((c) => c.id === sb.characterId);
      const dialogueIdx = scene.dialogue.findIndex((d) => d.text === sb.text);
      const reuseClip = dialogueIdx >= 0 ? scene.dialogueAudio?.[dialogueIdx] || undefined : undefined;
      lines.push({ text: sb.text, voiceName: pickVoiceForCharacter(char), reuseClip });
    });

    const audioBuffers: AudioBuffer[] = [];
    for (const line of lines) {
      const clip = line.reuseClip || (await synthesizeSpeech(line.text, line.voiceName));
      if (clip) {
        try {
          const buf = await audioCtx.decodeAudioData(base64ToArrayBuffer(clip.audioBase64));
          audioBuffers.push(buf);
        } catch {
          // bỏ qua clip lỗi, không chặn toàn bộ video
        }
      }
    }

    const audioDurationSec = audioBuffers.reduce((sum, b) => sum + b.duration, 0);
    const plannedDurationSec = scene.estimatedDurationSec / Math.max(1, scene.frames.length);
    const durationSec = Math.max(plannedDurationSec, audioDurationSec + 0.6, 2.5);

    assets.push({ scene, frame, imageDataUrl, audioBuffers, durationSec });
  }

  // ---- 2. Chuẩn bị canvas + MediaRecorder ----
  onProgress({ stage: 'recording', frameIndex: 0, totalFrames: assets.length, message: 'Đang dựng video...' });

  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể khởi tạo canvas để dựng video.');

  const images = await Promise.all(
    assets.map(
      (a) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Không thể tải ảnh khung hình đã chụp.'));
          img.src = a.imageDataUrl;
        })
    )
  );

  const videoStream = (canvas as any).captureStream(30) as MediaStream;
  const combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);

  const mimeCandidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

  const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  const recordingDone = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
  });

  recorder.start(250);

  // ---- 3. Vẽ Ken Burns từng khung theo đúng thời lượng, đồng bộ audio ----
  let audioCursor = audioCtx.currentTime + 0.15;

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    setFrameIndex(i);
    onProgress({ stage: 'recording', frameIndex: i, totalFrames: assets.length, message: `Đang ghi khung ${asset.frame.frameId}...` });

    let lineStart = audioCursor;
    asset.audioBuffers.forEach((buf) => {
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(destination);
      src.connect(audioCtx.destination); // để giáo viên nghe trực tiếp trong lúc xuất
      src.start(lineStart);
      lineStart += buf.duration + 0.15;
    });

    const img = images[i];
    const caption = asset.frame.captionText || (i === 0 ? asset.scene.narration : '');
    const durationMs = asset.durationSec * 1000;

    if (asset.frame.aiVideoClip) {
      // ---- Dùng clip AI Video (Veo) thật cho khung được giáo viên đánh dấu ----
      await new Promise<void>((resolve, reject) => {
        const videoEl = document.createElement('video');
        // Video giờ lưu trên Firebase Storage (URL), không còn base64 — cần crossOrigin
        // để canvas không bị "tainted" khi vẽ video cross-origin lên canvas.captureStream().
        // YÊU CẦU: bucket Storage phải bật CORS cho origin của app (xem cors.json đi kèm).
        videoEl.crossOrigin = 'anonymous';
        videoEl.src = asset.frame.aiVideoClip!.videoUrl;
        videoEl.muted = true;
        videoEl.loop = true;
        (videoEl as any).playsInline = true;
        videoEl.onerror = () =>
          reject(
            new Error(
              `Không thể phát AI Video cho khung ${asset.frame.frameId}. Nếu lỗi CORS, kiểm tra cấu hình CORS của Firebase Storage bucket.`
            )
          );
        let started = false;
        videoEl.oncanplay = () => {
          if (started) return; // videoEl.loop=true có thể bắn lại 'canplay' mỗi vòng lặp
          started = true;
          videoEl.play().catch(reject);
          const startTime = performance.now();
          const drawTick = () => {
            const elapsed = performance.now() - startTime;
            ctx.fillStyle = '#070A13';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const vw = videoEl.videoWidth || img.width;
            const vh = videoEl.videoHeight || img.height;
            const ratio = Math.max(canvas.width / vw, canvas.height / vh);
            const dw = vw * ratio;
            const dh = vh * ratio;
            ctx.drawImage(videoEl, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
            drawCaptionOverlay(ctx, canvas, caption);

            if (elapsed < durationMs) {
              requestAnimationFrame(drawTick);
            } else {
              videoEl.pause();
              resolve();
            }
          };
          requestAnimationFrame(drawTick);
        };
      });
    } else {
      // ---- Ken Burns: zoom/pan nhẹ trên ảnh tĩnh đã chụp ----
      const zoomFrom = 1.0;
      const zoomTo = 1.08;
      const panX = i % 2 === 0 ? -14 : 14;
      const startTime = performance.now();

      await new Promise<void>((resolve) => {
        const drawTick = () => {
          const elapsed = performance.now() - startTime;
          const t = Math.min(1, elapsed / durationMs);
          const scale = zoomFrom + (zoomTo - zoomFrom) * t;
          const dx = panX * t;

          ctx.fillStyle = '#070A13';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const iw = img.width * scale;
          const ih = img.height * scale;
          const ratio = Math.max(canvas.width / iw, canvas.height / ih);
          const dw = iw * ratio;
          const dh = ih * ratio;
          const dxPos = (canvas.width - dw) / 2 + dx;
          const dyPos = (canvas.height - dh) / 2;
          ctx.drawImage(img, dxPos, dyPos, dw, dh);
          drawCaptionOverlay(ctx, canvas, caption);

          if (t < 1) {
            requestAnimationFrame(drawTick);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(drawTick);
      });
    }

    audioCursor = lineStart + 0.2;
  }

  recorder.stop();
  const blob = await recordingDone;
  await audioCtx.close();
  onProgress({ stage: 'done', frameIndex: assets.length, totalFrames: assets.length, message: 'Hoàn tất!' });
  return blob;
}