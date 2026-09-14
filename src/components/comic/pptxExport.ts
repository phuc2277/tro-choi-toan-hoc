/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Xuất "Truyện Tranh Bài Học" thành bản trình chiếu PowerPoint (.pptx):
 * mỗi khung hình -> 1 slide (ảnh chụp full khung, kèm speaker notes chứa
 * lời dẫn + hội thoại + kiến thức xuất hiện, để giáo viên dùng khi giảng trên lớp),
 * cộng thêm slide mở đầu và slide tổng kết kiến thức.
 */
import pptxgen from 'pptxgenjs';
import { toPng } from 'html-to-image';
import { ComicLessonProject, ComicScene, ComicFrame } from '../../types/comicLesson';

export interface PptxExportProgress {
  frameIndex: number;
  totalFrames: number;
  message: string;
}

export async function exportComicPptx(
  project: ComicLessonProject,
  allFrames: Array<{ scene: ComicScene; frame: ComicFrame }>,
  stageEl: HTMLElement,
  setFrameIndex: (idx: number) => void,
  onProgress: (p: PptxExportProgress) => void
): Promise<Blob> {
  if (allFrames.length === 0) {
    throw new Error('Chưa có khung hình nào để xuất trình chiếu.');
  }

  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'COMIC_16x9', width: 13.333, height: 7.5 });
  pptx.layout = 'COMIC_16x9';

  // ---- Slide mở đầu ----
  const title = pptx.addSlide();
  title.background = { color: '070A13' };
  title.addText(project.title, {
    x: 0.6, y: 2.6, w: 12.1, h: 1.3, fontSize: 34, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial',
  });
  title.addText(
    `${project.knowledgeProfile.subject} • ${project.knowledgeProfile.grade} • ${project.knowledgeProfile.chapter}`,
    { x: 0.6, y: 3.9, w: 12.1, h: 0.6, fontSize: 16, color: '38BDF8', align: 'center', fontFace: 'Arial' }
  );
  title.addText('AI Truyện Tranh Bài Học — Chuẩn GDPT 2018', {
    x: 0.6, y: 6.7, w: 12.1, h: 0.4, fontSize: 12, color: '94A3B8', align: 'center', fontFace: 'Arial',
  });

  // ---- 1 slide / khung hình ----
  for (let i = 0; i < allFrames.length; i++) {
    const { scene, frame } = allFrames[i];
    setFrameIndex(i);
    onProgress({ frameIndex: i, totalFrames: allFrames.length, message: `Đang chụp khung ${frame.frameId}...` });

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 200));

    let imageDataUrl: string;
    try {
      imageDataUrl = await toPng(stageEl, { pixelRatio: 1.5, cacheBust: true, skipFonts: true } as any);
    } catch (err) {
      throw new Error(`Không thể chụp khung ${frame.frameId}: ${(err as Error).message || 'lỗi không xác định'}`);
    }

    const slide = pptx.addSlide();
    slide.background = { color: '070A13' };
    slide.addImage({
      data: imageDataUrl,
      x: 0.45, y: 0.35, w: 12.43, h: 6.99,
      sizing: { type: 'contain', w: 12.43, h: 6.99 },
    });
    slide.addText(`${scene.sceneId} • ${scene.sceneName}  —  ${frame.frameId}`, {
      x: 0.45, y: 7.15, w: 12.43, h: 0.3, fontSize: 10, color: '64748B', fontFace: 'Arial',
    });

    const notesLines: string[] = [];
    const isFirstFrameOfScene = scene.frames[0]?.frameId === frame.frameId;
    if (isFirstFrameOfScene && scene.narration) notesLines.push(`Lời dẫn: ${scene.narration}`);
    frame.speechBubbles.forEach((sb) => notesLines.push(`${sb.characterName}: "${sb.text}"`));
    if (scene.knowledgeAppeared) notesLines.push(`Kiến thức xuất hiện: ${scene.knowledgeAppeared}`);
    if (notesLines.length > 0) slide.addNotes(notesLines.join('\n'));
  }

  // ---- Slide tổng kết kiến thức ----
  onProgress({ frameIndex: allFrames.length, totalFrames: allFrames.length, message: 'Đang tạo slide tổng kết...' });
  const summary = pptx.addSlide();
  summary.background = { color: '0F172A' };
  summary.addText('Tổng Kết Kiến Thức Bài Học', {
    x: 0.6, y: 0.5, w: 12.1, h: 0.8, fontSize: 28, bold: true, color: '34D399', fontFace: 'Arial',
  });
  const kp = project.knowledgeProfile;
  const bulletText = (kp.coreKnowledge && kp.coreKnowledge.length > 0 ? kp.coreKnowledge : kp.objectives || []).map(
    (k) => ({ text: k, options: { bullet: true, breakLine: true } })
  );
  if (bulletText.length > 0) {
    summary.addText(bulletText as any, { x: 0.6, y: 1.6, w: 12.1, h: 5.4, fontSize: 16, color: 'E2E8F0', fontFace: 'Arial', valign: 'top' });
  }

  onProgress({ frameIndex: allFrames.length, totalFrames: allFrames.length, message: 'Đang xuất file PowerPoint...' });
  const blob = (await pptx.write({ outputType: 'blob' })) as Blob;
  return blob;
}