import PptxGenJS from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import { LessonPresentationPackage, EditorSlide, TeachingActivity, ContentBlock } from '../types/contentBlock';
import { Lesson } from '../types/teacherLesson';
import { StructuredPresentation } from '../types/presentationStructure';
import { convertLegacyPresentationToPackage, convertStructuredPresentationToPackage } from './lectureStructureAdapter';

export interface ExportOptions {
  includeTeacherNotes?: boolean;
  includeSolutions?: boolean;
  includeSchoolHeader?: boolean;
  schoolName?: string;
  theme?: 'modern' | 'minimal' | 'classic';
}

/**
 * Normalizes any presentation type into a standardized LessonPresentationPackage
 */
export const normalizeToPresentationPackage = (
  lesson: Lesson,
  presentationSource?: LessonPresentationPackage | StructuredPresentation | any
): LessonPresentationPackage => {
  if (!presentationSource) {
    if (lesson.presentationPackage) {
      return lesson.presentationPackage;
    }
    if (lesson.presentations && lesson.presentations.length > 0) {
      return convertLegacyPresentationToPackage(lesson, lesson.presentations[0]);
    }
  }

  // If already a presentation package with activities
  if (presentationSource && Array.isArray(presentationSource.activities)) {
    return presentationSource as LessonPresentationPackage;
  }

  // If a StructuredPresentation (AI Phase 3 logic)
  if (presentationSource && Array.isArray(presentationSource.slides)) {
    return convertStructuredPresentationToPackage(lesson, presentationSource as StructuredPresentation);
  }

  // If has lecture with sections
  if (presentationSource && presentationSource.lecture) {
    return convertLegacyPresentationToPackage(lesson, presentationSource);
  }

  if (lesson.presentationPackage) {
    return lesson.presentationPackage;
  }

  return convertLegacyPresentationToPackage(lesson, lesson.presentations?.[0] || ({} as any));
};

/**
 * 1. EXPORT TO MICROSOFT POWERPOINT (.pptx)
 * Generates 16:9 widescreen presentation compatible with Microsoft PowerPoint, Google Slides, Keynote
 */
export const exportToPptx = async (
  pkg: LessonPresentationPackage,
  options: ExportOptions = { includeTeacherNotes: true, includeSolutions: true }
): Promise<void> => {
  const pptx = new PptxGenJS();

  // Configure 16:9 widescreen layout
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = pkg.teacherName || 'Giáo viên';
  pptx.company = options.schoolName || 'Chương trình GDPT 2018';
  pptx.title = pkg.title;
  pptx.subject = `${pkg.subject} Lớp ${pkg.grade}`;

  // Theme colors
  const primaryColor = '1E3A8A'; // Indigo-900
  const accentColor = '2563EB'; // Blue-600
  const slateDark = '0F172A';
  const slateLight = 'F8FAFC';
  const textMuted = '64748B';

  // --- SLIDE 1: COVER SLIDE ---
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: '0F172A' }; // Deep dark navy

  // Header badge
  coverSlide.addText('CHƯƠNG TRÌNH GIÁO DỤC PHỔ THÔNG 2018', {
    x: 0.8,
    y: 0.8,
    w: 8.0,
    h: 0.4,
    fontSize: 11,
    fontFace: 'Arial',
    color: '38BDF8',
    bold: true,
    charSpacing: 2,
  });

  // Main Title
  coverSlide.addText(pkg.title, {
    x: 0.8,
    y: 1.5,
    w: 11.5,
    h: 2.0,
    fontSize: 32,
    fontFace: 'Arial',
    color: 'FFFFFF',
    bold: true,
    breakLine: true,
  });

  // Subtitle / Subject & Grade
  coverSlide.addText(
    `Môn: ${pkg.subject} • Lớp: ${pkg.grade}${pkg.bookSeries ? ` • Bộ sách: ${pkg.bookSeries}` : ''}${pkg.chapter ? ` • ${pkg.chapter}` : ''}`,
    {
      x: 0.8,
      y: 3.6,
      w: 11.5,
      h: 0.6,
      fontSize: 16,
      fontFace: 'Arial',
      color: '94A3B8',
    }
  );

  // Decorative divider line
  coverSlide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 4.4,
    w: 11.7,
    h: 0.04,
    fill: { color: '38BDF8' },
  });

  // Metadata Footer
  coverSlide.addText(
    `Giáo viên thực hiện: ${pkg.teacherName || 'Giáo viên bộ môn'}     |     Thời lượng: ${pkg.duration || '45 phút'}     |     Năm học: ${pkg.schoolYear || '2025 - 2026'}`,
    {
      x: 0.8,
      y: 5.0,
      w: 11.5,
      h: 0.5,
      fontSize: 12,
      fontFace: 'Arial',
      color: 'CBD5E1',
    }
  );

  // --- SLIDE 2: OBJECTIVES & ROADMAP ---
  if (pkg.objectives && pkg.objectives.length > 0) {
    const objSlide = pptx.addSlide();
    objSlide.background = { color: 'F8FAFC' };

    // Slide Header
    objSlide.addText('MỤC TIÊU BÀI HỌC CẦN ĐẠT', {
      x: 0.8,
      y: 0.6,
      w: 10,
      h: 0.6,
      fontSize: 22,
      fontFace: 'Arial',
      color: primaryColor,
      bold: true,
    });
    objSlide.addText('Theo chuẩn yêu cầu cần đạt của Chương trình GDPT 2018', {
      x: 0.8,
      y: 1.2,
      w: 10,
      h: 0.4,
      fontSize: 12,
      fontFace: 'Arial',
      color: textMuted,
    });

    // Objective Cards / Bullets
    const objItems = pkg.objectives.map((obj, i) => ({
      text: `${i + 1}. ${obj}\n`,
      options: { fontSize: 14, color: '1E293B', bullet: false, breakLine: true },
    }));

    objSlide.addText(objItems, {
      x: 0.8,
      y: 1.8,
      w: 11.5,
      h: 4.5,
      fontFace: 'Arial',
      lineSpacingMultiple: 1.4,
    });
  }

  // --- ITERATE THROUGH ACTIVITIES & SLIDES ---
  let globalSlideNumber = 1;

  pkg.activities.forEach((activity, actIdx) => {
    // Activity Section Divider Slide
    const actSlide = pptx.addSlide();
    actSlide.background = { color: '1E293B' };

    actSlide.addText(`HOẠT ĐỘNG ${actIdx + 1}`, {
      x: 0.8,
      y: 1.8,
      w: 10,
      h: 0.5,
      fontSize: 14,
      fontFace: 'Arial',
      color: '38BDF8',
      bold: true,
      charSpacing: 2,
    });

    actSlide.addText(activity.title, {
      x: 0.8,
      y: 2.4,
      w: 11.5,
      h: 1.5,
      fontSize: 28,
      fontFace: 'Arial',
      color: 'FFFFFF',
      bold: true,
    });

    if (activity.description) {
      actSlide.addText(activity.description, {
        x: 0.8,
        y: 4.0,
        w: 11.5,
        h: 1.0,
        fontSize: 14,
        fontFace: 'Arial',
        color: '94A3B8',
        italic: true,
      });
    }

    if (activity.timeMinutes) {
      actSlide.addText(`Thời lượng dự kiến: ~${activity.timeMinutes} phút`, {
        x: 0.8,
        y: 5.2,
        w: 6,
        h: 0.4,
        fontSize: 12,
        fontFace: 'Arial',
        color: 'F59E0B',
        bold: true,
      });
    }

    // Process Slides within Activity
    activity.slides.forEach((slide) => {
      globalSlideNumber++;
      const sld = pptx.addSlide();
      sld.background = { color: 'FFFFFF' };

      // Top Breadcrumb Banner
      sld.addText(`${activity.title.toUpperCase()} • BÀI GIẢNG ĐIỆN TỬ`, {
        x: 0.8,
        y: 0.4,
        w: 9.0,
        h: 0.3,
        fontSize: 9,
        fontFace: 'Arial',
        color: '64748B',
        bold: true,
        charSpacing: 1,
      });

      // Slide Title
      sld.addText(slide.title, {
        x: 0.8,
        y: 0.75,
        w: 11.5,
        h: 0.7,
        fontSize: 20,
        fontFace: 'Arial',
        color: primaryColor,
        bold: true,
      });

      // Slide decorative separator
      sld.addShape(pptx.ShapeType.rect, {
        x: 0.8,
        y: 1.5,
        w: 11.5,
        h: 0.02,
        fill: { color: 'E2E8F0' },
      });

      // Render Content Blocks on Slide
      let currentY = 1.7;

      slide.blocks.forEach((block) => {
        if (!block.visible) return;

        if (block.type === 'heading' && block.content.text !== slide.title) {
          sld.addText(block.content.text, {
            x: 0.8,
            y: currentY,
            w: 11.5,
            h: 0.5,
            fontSize: 16,
            fontFace: 'Arial',
            color: block.content.color || accentColor,
            bold: true,
          });
          currentY += 0.6;
        } else if (block.type === 'text') {
          sld.addText(block.content.text, {
            x: 0.8,
            y: currentY,
            w: 11.5,
            h: 1.5,
            fontSize: 14,
            fontFace: 'Arial',
            color: '1E293B',
            breakLine: true,
            lineSpacingMultiple: 1.3,
          });
          currentY += 1.6;
        } else if (block.type === 'math') {
          // Math Block Container
          sld.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: currentY,
            w: 11.5,
            h: 0.9,
            fill: { color: 'F0F9FF' },
            line: { color: 'BAE6FD', width: 1 },
          });

          sld.addText(`Công thức toán học:  ${block.content.latex}`, {
            x: 1.0,
            y: currentY + 0.15,
            w: 11.1,
            h: 0.6,
            fontSize: 15,
            fontFace: 'Courier New',
            color: '0369A1',
            bold: true,
          });
          currentY += 1.05;
        } else if (block.type === 'list') {
          const listText = block.content.items.map((item) => ({
            text: `${item}\n`,
            options: { bullet: block.content.listType === 'bullet', fontSize: 13, color: '1E293B' },
          }));
          sld.addText(listText, {
            x: 0.8,
            y: currentY,
            w: 11.5,
            h: 1.8,
            fontFace: 'Arial',
            lineSpacingMultiple: 1.3,
          });
          currentY += 1.9;
        } else if (block.type === 'question') {
          // Question card
          sld.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: currentY,
            w: 11.5,
            h: 3.2,
            fill: { color: 'FFFBEB' },
            line: { color: 'FDE68A', width: 1 },
          });

          sld.addText(`CÂU HỎI TRẮC NGHIỆM / BÀI TẬP:`, {
            x: 1.0,
            y: currentY + 0.15,
            w: 11.0,
            h: 0.3,
            fontSize: 11,
            fontFace: 'Arial',
            color: 'B45309',
            bold: true,
          });

          sld.addText(block.content.content, {
            x: 1.0,
            y: currentY + 0.45,
            w: 11.0,
            h: 0.8,
            fontSize: 13,
            fontFace: 'Arial',
            color: '1E293B',
            bold: true,
          });

          // Options
          const optsY = currentY + 1.25;
          block.content.options.forEach((opt, oIdx) => {
            const isCorrect = opt.label === block.content.correctAnswer;
            sld.addText(
              `${opt.label}. ${opt.text}${options.includeSolutions && isCorrect ? '  (✓ Đáp án đúng)' : ''}`,
              {
                x: 1.0 + (oIdx % 2) * 5.5,
                y: optsY + Math.floor(oIdx / 2) * 0.45,
                w: 5.2,
                h: 0.4,
                fontSize: 12,
                fontFace: 'Arial',
                color: isCorrect && options.includeSolutions ? '047857' : '334155',
                bold: isCorrect && options.includeSolutions,
              }
            );
          });

          if (options.includeSolutions && block.content.solution) {
            sld.addText(`Hướng dẫn giải: ${block.content.solution}`, {
              x: 1.0,
              y: currentY + 2.3,
              w: 11.0,
              h: 0.7,
              fontSize: 11,
              fontFace: 'Arial',
              color: '475569',
              italic: true,
            });
          }

          currentY += 3.35;
        } else if (block.type === 'table') {
          const tableRows = [
            block.content.headers.map((h) => ({
              text: h,
              options: { fill: 'E2E8F0', bold: true, color: '0F172A', fontSize: 11 },
            })),
            ...block.content.rows.map((row) =>
              row.map((cell) => ({
                text: cell,
                options: { fontSize: 10, color: '1E293B' },
              }))
            ),
          ];

          sld.addTable(tableRows, {
            x: 0.8,
            y: currentY,
            w: 11.5,
            autoPage: false,
          });
          currentY += 1.8;
        }
      });

      // Bottom Footer Bar
      sld.addText(
        `${pkg.title}  |  ${pkg.subject} Lớp ${pkg.grade}  |  Trang ${globalSlideNumber}`,
        {
          x: 0.8,
          y: 6.8,
          w: 11.5,
          h: 0.3,
          fontSize: 9,
          fontFace: 'Arial',
          color: '94A3B8',
        }
      );

      // Add Speaker Notes to PowerPoint slide
      if (options.includeTeacherNotes && slide.notes) {
        sld.addNotes(slide.notes);
      }
    });
  });

  // Generate file name & trigger download
  const safeTitle = (pkg.title || 'BaiGiang')
    .replace(/[^a-zA-Z0-9à-ỹÀ-Ỹ\s-_]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const fileName = `${safeTitle}_GDPT2018.pptx`;

  await pptx.writeFile({ fileName });
};

/**
 * 2. EXPORT TO LANDSCAPE SLIDE PRESENTATION PDF (16:9)
 * High-definition landscape PDF for direct classroom presentation or printing
 */
export const exportToSlideDeckPdf = (
  pkg: LessonPresentationPackage,
  options: ExportOptions = { includeTeacherNotes: true, includeSolutions: true }
): void => {
  // 16:9 ratio in mm: 297mm width x 167mm height (or 280 x 157.5)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 167],
  });

  const pageWidth = 297;
  const pageHeight = 167;

  // --- SLIDE 1: COVER ---
  // Dark Navy Background
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(56, 189, 248); // Cyan
  doc.setFontSize(11);
  doc.text('CHƯƠNG TRÌNH GIÁO DỤC PHỔ THÔNG 2018', 20, 25);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  const splitTitle = doc.splitTextToSize(pkg.title, 250);
  doc.text(splitTitle, 20, 45);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(13);
  doc.text(
    `Môn: ${pkg.subject}   •   Lớp: ${pkg.grade}${pkg.bookSeries ? `   •   Bộ sách: ${pkg.bookSeries}` : ''}`,
    20,
    75
  );

  // Cyan divider line
  doc.setDrawColor(56, 189, 248);
  doc.setLineWidth(1);
  doc.line(20, 85, 277, 85);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(11);
  doc.text(
    `Giáo viên: ${pkg.teacherName || 'Giáo viên bộ môn'}    |    Thời lượng: ${pkg.duration || '45 phút'}    |    Năm học: ${pkg.schoolYear || '2025 - 2026'}`,
    20,
    100
  );

  if (options.schoolName) {
    doc.text(`Đơn vị: ${options.schoolName}`, 20, 110);
  }

  // --- ITERATE THROUGH ACTIVITIES AND SLIDES ---
  let slideNum = 1;

  pkg.activities.forEach((activity, actIdx) => {
    // Activity Divider Page
    doc.addPage([297, 167], 'landscape');
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(56, 189, 248);
    doc.setFontSize(13);
    doc.text(`TIẾN TRÌNH DẠY HỌC • HOẠT ĐỘNG ${actIdx + 1}`, 20, 35);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    const actTitleLines = doc.splitTextToSize(activity.title, 250);
    doc.text(actTitleLines, 20, 55);

    if (activity.description) {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(13);
      const descLines = doc.splitTextToSize(activity.description, 240);
      doc.text(descLines, 20, 80);
    }

    if (activity.timeMinutes) {
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(12);
      doc.text(`Thời lượng hoạt động: ~${activity.timeMinutes} phút`, 20, 110);
    }

    // Individual Slides
    activity.slides.forEach((slide) => {
      slideNum++;
      doc.addPage([297, 167], 'landscape');

      // Light clean background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Top Breadcrumb
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(9);
      doc.text(`${activity.title.toUpperCase()}  •  BÀI GIẢNG ĐIỆN TỬ`, 20, 15);

      // Slide Title
      doc.setTextColor(30, 58, 138); // Indigo-900
      doc.setFontSize(18);
      const sldTitle = doc.splitTextToSize(slide.title, 250);
      doc.text(sldTitle, 20, 26);

      // Separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, 32, 277, 32);

      let currentY = 42;

      slide.blocks.forEach((block) => {
        if (!block.visible) return;

        if (block.type === 'heading' && block.content.text !== slide.title) {
          doc.setTextColor(37, 99, 235);
          doc.setFontSize(14);
          doc.text(block.content.text, 20, currentY);
          currentY += 8;
        } else if (block.type === 'text') {
          doc.setTextColor(30, 41, 59);
          doc.setFontSize(11);
          const txtLines = doc.splitTextToSize(block.content.text, 250);
          doc.text(txtLines, 20, currentY);
          currentY += txtLines.length * 6 + 4;
        } else if (block.type === 'math') {
          doc.setFillColor(240, 249, 255);
          doc.roundedRect(20, currentY - 4, 257, 14, 2, 2, 'F');
          doc.setDrawColor(186, 230, 253);
          doc.roundedRect(20, currentY - 4, 257, 14, 2, 2, 'S');

          doc.setTextColor(3, 105, 161);
          doc.setFontSize(12);
          doc.text(`[Công thức]  ${block.content.latex}`, 25, currentY + 5);
          currentY += 18;
        } else if (block.type === 'list') {
          doc.setTextColor(30, 41, 59);
          doc.setFontSize(11);
          block.content.items.forEach((item) => {
            doc.text(`•  ${item}`, 24, currentY);
            currentY += 6;
          });
          currentY += 4;
        } else if (block.type === 'question') {
          doc.setFillColor(255, 251, 235);
          doc.roundedRect(20, currentY - 4, 257, 38, 2, 2, 'F');
          doc.setDrawColor(253, 230, 138);
          doc.roundedRect(20, currentY - 4, 257, 38, 2, 2, 'S');

          doc.setTextColor(180, 83, 9);
          doc.setFontSize(9);
          doc.text('CÂU HỎI TRẮC NGHIỆM / VẬN DỤNG:', 25, currentY + 2);

          doc.setTextColor(15, 23, 42);
          doc.setFontSize(11);
          const qLines = doc.splitTextToSize(block.content.content, 245);
          doc.text(qLines, 25, currentY + 8);

          let optX = 25;
          let optY = currentY + 16;
          block.content.options.forEach((opt, idx) => {
            const isCorrect = opt.label === block.content.correctAnswer;
            if (options.includeSolutions && isCorrect) {
              doc.setTextColor(4, 120, 87);
              doc.text(`${opt.label}. ${opt.text}  (✓)`, optX, optY);
            } else {
              doc.setTextColor(51, 65, 85);
              doc.text(`${opt.label}. ${opt.text}`, optX, optY);
            }
            if (idx % 2 === 1) {
              optX = 25;
              optY += 6;
            } else {
              optX = 150;
            }
          });

          currentY += 44;
        }
      });

      // Speaker Notes Section at Bottom if enabled
      if (options.includeTeacherNotes && slide.notes) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, 130, 257, 22, 2, 2, 'F');
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text('GHI CHÚ SƯ PHẠM CỦA GIÁO VIÊN:', 24, 135);
        doc.setTextColor(51, 65, 85);
        const noteLines = doc.splitTextToSize(slide.notes, 248);
        doc.text(noteLines.slice(0, 3), 24, 141);
      }

      // Footer
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text(
        `${pkg.title}   |   ${pkg.subject} Lớp ${pkg.grade}   |   Trang ${slideNum}`,
        20,
        160
      );
    });
  });

  // Download PDF
  const safeTitle = (pkg.title || 'BaiGiang')
    .replace(/[^a-zA-Z0-9à-ỹÀ-Ỹ\s-_]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  doc.save(`${safeTitle}_SlideDeck_16x9.pdf`);
};

/**
 * 3. EXPORT TO TEACHER LESSON PLAN / HANDOUT (A4 Portrait PDF)
 * Strictly formatted in accordance with Official Dispatch 5512 (Công văn 5512 GDPT 2018)
 */
export const exportToLessonPlanPdf = (
  pkg: LessonPresentationPackage,
  options: ExportOptions = { includeTeacherNotes: true, includeSolutions: true }
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const pageWidth = 210;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 20;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > 280) {
      doc.addPage();
      currentY = 20;
    }
  };

  // Header Table
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(options.schoolName || 'TRƯỜNG THCS & THPT', margin, currentY);
  doc.text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', pageWidth - margin - 75, currentY);
  currentY += 5;
  doc.text('TỔ CHUYÊN MÔN: TOÁN - TIN', margin, currentY);
  doc.text('Độc lập - Tự do - Hạnh phúc', pageWidth - margin - 55, currentY);

  currentY += 12;
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('KẾ HOẠCH BÀI DẠY (GIÁO ÁN ĐIỆN TỬ)', margin, currentY);

  currentY += 7;
  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235);
  doc.text(`BÀI HỌC: ${pkg.title.toUpperCase()}`, margin, currentY);

  currentY += 6;
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Môn học: ${pkg.subject}   •   Lớp: ${pkg.grade}${pkg.bookSeries ? `   •   Bộ sách: ${pkg.bookSeries}` : ''}   •   Thời lượng: ${pkg.duration || '45 phút'}`,
    margin,
    currentY
  );
  currentY += 5;
  doc.text(`Giáo viên giảng dạy: ${pkg.teacherName || 'Giáo viên bộ môn'}   •   Năm học: ${pkg.schoolYear || '2025 - 2026'}`, margin, currentY);

  currentY += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // I. MỤC TIÊU BÀI HỌC
  checkPageBreak(30);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('I. MỤC TIÊU CẦN ĐẠT (Theo chuẩn GDPT 2018):', margin, currentY);
  currentY += 6;

  if (pkg.objectives && pkg.objectives.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    pkg.objectives.forEach((obj, idx) => {
      checkPageBreak(10);
      const objLines = doc.splitTextToSize(`${idx + 1}. ${obj}`, contentWidth);
      doc.text(objLines, margin + 4, currentY);
      currentY += objLines.length * 5 + 2;
    });
  }

  currentY += 4;

  // II. TIẾN TRÌNH DẠY HỌC CHI TIẾT
  checkPageBreak(20);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('II. TIẾN TRÌNH DẠY HỌC THEO 4 HOẠT ĐỘNG (CV 5512):', margin, currentY);
  currentY += 8;

  pkg.activities.forEach((activity, aIdx) => {
    checkPageBreak(35);

    // Activity Title Banner
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY - 4, contentWidth, 8, 'F');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(
      `Hoạt động ${aIdx + 1}: ${activity.title} (${activity.timeMinutes ? `${activity.timeMinutes} phút` : 'Dự kiến'})`,
      margin + 2,
      currentY + 1.5
    );
    currentY += 9;

    if (activity.description) {
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      const descLines = doc.splitTextToSize(`Mục đích: ${activity.description}`, contentWidth);
      doc.text(descLines, margin + 4, currentY);
      currentY += descLines.length * 4.5 + 4;
    }

    // Slides breakdown
    activity.slides.forEach((slide, sIdx) => {
      checkPageBreak(25);
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`- Nội dung ${aIdx + 1}.${sIdx + 1}: ${slide.title}`, margin + 4, currentY);
      currentY += 5;

      slide.blocks.forEach((block) => {
        if (!block.visible) return;

        if (block.type === 'text') {
          checkPageBreak(12);
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          const txtLines = doc.splitTextToSize(block.content.text, contentWidth - 8);
          doc.text(txtLines, margin + 8, currentY);
          currentY += txtLines.length * 4.5 + 2;
        } else if (block.type === 'math') {
          checkPageBreak(10);
          doc.setFontSize(9.5);
          doc.setTextColor(3, 105, 161);
          doc.text(`[Công thức toán]: ${block.content.latex}`, margin + 8, currentY);
          currentY += 6;
        } else if (block.type === 'question') {
          checkPageBreak(25);
          doc.setFontSize(9.5);
          doc.setTextColor(180, 83, 9);
          doc.text(`[Phiếu câu hỏi]: ${block.content.content}`, margin + 8, currentY);
          currentY += 5;

          block.content.options.forEach((opt) => {
            checkPageBreak(6);
            const isCorrect = opt.label === block.content.correctAnswer;
            doc.setFontSize(8.5);
            doc.setTextColor(isCorrect && options.includeSolutions ? 4 : 71, isCorrect && options.includeSolutions ? 120 : 85, isCorrect && options.includeSolutions ? 87 : 105);
            doc.text(`${opt.label}. ${opt.text}${isCorrect && options.includeSolutions ? ' (Đáp án đúng)' : ''}`, margin + 12, currentY);
            currentY += 4.5;
          });

          if (options.includeSolutions && block.content.solution) {
            checkPageBreak(8);
            doc.setFontSize(8.5);
            doc.setTextColor(100, 116, 139);
            const solLines = doc.splitTextToSize(`Hướng dẫn giải: ${block.content.solution}`, contentWidth - 16);
            doc.text(solLines, margin + 12, currentY);
            currentY += solLines.length * 4 + 2;
          }
        }
      });

      // Teacher Notes
      if (options.includeTeacherNotes && slide.notes) {
        checkPageBreak(15);
        doc.setFillColor(248, 250, 252);
        doc.rect(margin + 8, currentY - 2, contentWidth - 8, 8, 'F');
        doc.setFontSize(8.5);
        doc.setTextColor(79, 70, 229);
        const noteLines = doc.splitTextToSize(`* Hướng dẫn sư phạm: ${slide.notes}`, contentWidth - 12);
        doc.text(noteLines, margin + 10, currentY + 3);
        currentY += noteLines.length * 4 + 4;
      }

      currentY += 3;
    });

    currentY += 4;
  });

  // Download PDF
  const safeTitle = (pkg.title || 'GiaoAn')
    .replace(/[^a-zA-Z0-9à-ỹÀ-Ỹ\s-_]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  doc.save(`${safeTitle}_GiaoAn_CV5512.pdf`);
};

/**
 * 4. EXPORT TO STANDALONE OFFLINE HTML PRESENTATION
 * Generates an isolated single-file interactive presentation with offline keyboard navigation, timer & full-screen
 */
export const exportToStandaloneHtml = (
  pkg: LessonPresentationPackage,
  options: ExportOptions = { includeTeacherNotes: true, includeSolutions: true }
): void => {
  const packageJsonData = JSON.stringify(pkg);

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pkg.title} - Bài Giảng Điện Tử GDPT 2018</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: #0f172a; color: #f8fafc; height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
    
    /* Top Header Bar */
    header { background: #1e293b; border-bottom: 1px solid #334155; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 20; }
    .badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; }
    .title { font-size: 16px; font-weight: 700; color: #ffffff; }
    .meta { font-size: 12px; color: #94a3b8; }
    
    /* Center Presentation Canvas */
    main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; position: relative; }
    .slide-stage { width: 100%; max-width: 1200px; aspect-ratio: 16 / 9; background: #ffffff; color: #0f172a; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); padding: 48px; display: flex; flex-direction: column; justify-content: space-between; overflow-y: auto; position: relative; }
    
    /* Slide Typography */
    .slide-header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
    .slide-tag { font-size: 12px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; }
    .slide-title { font-size: 28px; font-weight: 900; color: #1e3a8a; margin-top: 4px; }
    
    .slide-body { flex: 1; display: flex; flex-direction: column; gap: 20px; font-size: 18px; line-height: 1.6; color: #1e293b; }
    .math-card { background: #f0f9ff; border: 1px solid #bae6fd; color: #0369a1; padding: 16px 20px; border-radius: 12px; font-family: "Courier New", monospace; font-size: 18px; font-weight: bold; }
    .question-card { background: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 14px; }
    .question-title { font-weight: 800; font-size: 18px; color: #92400e; margin-bottom: 12px; }
    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    .option-item { background: #ffffff; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; font-size: 15px; }
    .option-correct { background: #ecfdf5; border-color: #6ee7b7; color: #047857; font-weight: bold; }
    
    /* Footer Controls */
    footer { background: #1e293b; border-top: 1px solid #334155; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; }
    .btn { background: #334155; color: #ffffff; border: none; padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.15s; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { background: #475569; }
    .btn-primary { background: #2563eb; }
    .btn-primary:hover { background: #1d4ed8; }
    
    /* Notes Drawer */
    #notes-panel { display: none; position: absolute; bottom: 80px; left: 24px; right: 24px; max-width: 800px; margin: 0 auto; background: #020617; border: 1px solid #3b82f6; border-radius: 16px; padding: 20px; color: #cbd5e1; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); z-index: 30; }
  </style>
</head>
<body>

  <header>
    <div style="display: flex; align-items: center; gap: 12px;">
      <span class="badge">GDPT 2018</span>
      <div>
        <div class="title">${pkg.title}</div>
        <div class="meta">${pkg.subject} Lớp ${pkg.grade} • ${pkg.teacherName || 'Giáo viên'}</div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <span id="timer-display" style="font-size: 13px; font-weight: bold; color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 4px 10px; border-radius: 8px;">45:00</span>
      <button class="btn" onclick="toggleFullScreen()">Toàn màn hình [F]</button>
      <button class="btn" onclick="toggleNotes()">Ghi chú GV [N]</button>
    </div>
  </header>

  <main>
    <div class="slide-stage" id="slide-stage">
      <!-- Injected by JavaScript -->
    </div>

    <div id="notes-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 800; color: #38bdf8; font-size: 12px; text-transform: uppercase;">Ghi chú sư phạm dành cho giáo viên</span>
        <button class="btn" style="padding: 2px 8px; font-size: 11px;" onclick="toggleNotes()">✕ Đóng</button>
      </div>
      <div id="notes-content" style="font-size: 14px; line-height: 1.6;"></div>
    </div>
  </main>

  <footer>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="btn" onclick="prevSlide()">← Trước [Phím Trái]</button>
      <button class="btn btn-primary" onclick="nextSlide()">Sau [Phím Phải] →</button>
    </div>
    <div id="slide-counter" style="font-size: 13px; font-weight: bold; color: #94a3b8;">Slide 1 / 1</div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <select id="slide-selector" class="btn" onchange="jumpToSlide(this.value)"></select>
    </div>
  </footer>

  <script>
    const packageData = ${packageJsonData};
    const flattenedSlides = [];

    packageData.activities.forEach((act, aIdx) => {
      act.slides.forEach((sld, sIdx) => {
        flattenedSlides.push({
          activityTitle: act.title,
          slide: sld,
          activityIndex: aIdx + 1,
          slideIndex: sIdx + 1
        });
      });
    });

    let currentIdx = 0;

    function renderSlide(idx) {
      if (idx < 0) idx = 0;
      if (idx >= flattenedSlides.length) idx = flattenedSlides.length - 1;
      currentIdx = idx;

      const item = flattenedSlides[idx];
      const sld = item.slide;
      const stage = document.getElementById('slide-stage');

      let blocksHtml = '';
      (sld.blocks || []).forEach(b => {
        if (!b.visible) return;
        if (b.type === 'heading' && b.content.text !== sld.title) {
          blocksHtml += '<div style="font-size: 20px; font-weight: bold; color: #2563eb;">' + b.content.text + '</div>';
        } else if (b.type === 'text') {
          blocksHtml += '<div style="white-space: pre-wrap;">' + b.content.text + '</div>';
        } else if (b.type === 'math') {
          blocksHtml += '<div class="math-card">📐 ' + b.content.latex + '</div>';
        } else if (b.type === 'list') {
          blocksHtml += '<ul style="padding-left: 24px;">' + (b.content.items || []).map(it => '<li>' + it + '</li>').join('') + '</ul>';
        } else if (b.type === 'question') {
          blocksHtml += '<div class="question-card"><div class="question-title">❓ ' + b.content.content + '</div><div class="options-grid">';
          (b.content.options || []).forEach(opt => {
            const isCorrect = opt.label === b.content.correctAnswer;
            blocksHtml += '<div class="option-item ' + (isCorrect ? 'option-correct' : '') + '">' + opt.label + '. ' + opt.text + (isCorrect ? ' (✓)' : '') + '</div>';
          });
          blocksHtml += '</div>';
          if (b.content.solution) {
            blocksHtml += '<div style="margin-top: 10px; font-size: 13px; color: #64748b; font-style: italic;">Hướng dẫn: ' + b.content.solution + '</div>';
          }
          blocksHtml += '</div>';
        }
      });

      stage.innerHTML = '<div class="slide-header">' +
        '<div class="slide-tag">' + item.activityTitle + '</div>' +
        '<div class="slide-title">' + sld.title + '</div>' +
        '</div>' +
        '<div class="slide-body">' + blocksHtml + '</div>' +
        '<div style="font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 16px;">' +
        '<span>' + packageData.title + '</span><span>Trang ' + (idx + 1) + ' / ' + flattenedSlides.length + '</span></div>';

      document.getElementById('slide-counter').textContent = 'Slide ' + (idx + 1) + ' / ' + flattenedSlides.length;
      document.getElementById('slide-selector').value = idx;

      const notes = sld.notes || 'Không có ghi chú thêm cho slide này.';
      document.getElementById('notes-content').textContent = notes;
    }

    function prevSlide() { if (currentIdx > 0) renderSlide(currentIdx - 1); }
    function nextSlide() { if (currentIdx < flattenedSlides.length - 1) renderSlide(currentIdx + 1); }
    function jumpToSlide(idx) { renderSlide(parseInt(idx, 10)); }

    function toggleNotes() {
      const p = document.getElementById('notes-panel');
      p.style.display = p.style.display === 'block' ? 'none' : 'block';
    }

    function toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    // Populate selector dropdown
    const sel = document.getElementById('slide-selector');
    flattenedSlides.forEach((it, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = (i + 1) + '. ' + it.slide.title;
      sel.appendChild(opt);
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullScreen();
      } else if (e.key === 'n' || e.key === 'N') {
        toggleNotes();
      }
    });

    // Timer (45 minutes)
    let totalSeconds = 45 * 60;
    setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        document.getElementById('timer-display').textContent = m + ':' + s;
      }
    }, 1000);

    // Initial render
    renderSlide(0);
  </script>
</body>
</html>`;

  // Create downloadable file
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const safeTitle = (pkg.title || 'BaiGiang')
    .replace(/[^a-zA-Z0-9à-ỹÀ-Ỹ\s-_]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  a.download = `${safeTitle}_OfflinePlayer.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
};

/**
 * 5. TRIGGER BROWSER HIGH-FIDELITY PRINT
 * Opens a clean, dedicated print layout and triggers native window.print()
 */
export const openPrintWindow = (
  pkg: LessonPresentationPackage,
  mode: 'slides' | 'lesson-plan' = 'slides',
  options: ExportOptions = { includeTeacherNotes: true, includeSolutions: true }
): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép popup trình duyệt để mở chế độ in ấn.');
    return;
  }

  let bodyHtml = '';

  if (mode === 'slides') {
    // Print each slide as a landscape page
    pkg.activities.forEach((act, aIdx) => {
      act.slides.forEach((sld, sIdx) => {
        let blocksHtml = '';
        sld.blocks.forEach((b) => {
          if (!b.visible) return;
          if (b.type === 'heading' && b.content.text !== sld.title) {
            blocksHtml += `<h3 style="color: #2563eb; margin: 12px 0 6px 0;">${b.content.text}</h3>`;
          } else if (b.type === 'text') {
            blocksHtml += `<p style="margin: 8px 0; font-size: 14pt; line-height: 1.6;">${b.content.text}</p>`;
          } else if (b.type === 'math') {
            blocksHtml += `<div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; margin: 10px 0; border-radius: 8px; font-family: monospace; font-size: 15pt; color: #0369a1;">📐 ${b.content.latex}</div>`;
          } else if (b.type === 'list') {
            blocksHtml += `<ul style="padding-left: 24px; font-size: 14pt; margin: 8px 0;">${b.content.items.map((it) => `<li>${it}</li>`).join('')}</ul>`;
          } else if (b.type === 'question') {
            blocksHtml += `<div style="background: #fffbeb; border: 1px solid #fde68a; padding: 14px; border-radius: 8px; margin: 12px 0;">
              <strong style="color: #b45309; font-size: 14pt;">❓ ${b.content.content}</strong>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                ${b.content.options.map((opt) => `<div style="font-size: 13pt;">${opt.label}. ${opt.text}${options.includeSolutions && opt.label === b.content.correctAnswer ? ' <b>(✓ Đúng)</b>' : ''}</div>`).join('')}
              </div>
            </div>`;
          }
        });

        bodyHtml += `
          <div class="print-slide-page">
            <div class="slide-header">
              <span class="badge">Hoạt động ${aIdx + 1}: ${act.title}</span>
              <h2 style="font-size: 20pt; color: #1e3a8a; margin-top: 6px;">${sld.title}</h2>
            </div>
            <div class="slide-content">${blocksHtml}</div>
            ${options.includeTeacherNotes && sld.notes ? `<div class="teacher-notes"><b>Ghi chú giáo viên:</b> ${sld.notes}</div>` : ''}
            <div class="slide-footer">${pkg.title} • ${pkg.subject} Lớp ${pkg.grade}</div>
          </div>
        `;
      });
    });
  } else {
    // Print lesson plan (CV 5512)
    bodyHtml = `
      <div class="lesson-plan-page">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 16px;">
          <div>
            <b>${options.schoolName || 'TRƯỜNG THCS & THPT'}</b><br>
            TỔ CHUYÊN MÔN: TOÁN - TIN
          </div>
          <div style="text-align: right;">
            <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br>
            Độc lập - Tự do - Hạnh phúc
          </div>
        </div>

        <h1 style="text-align: center; font-size: 18pt; margin-bottom: 4px;">KẾ HOẠCH BÀI DẠY (GIÁO ÁN ĐIỆN TỬ)</h1>
        <h2 style="text-align: center; font-size: 14pt; color: #2563eb; margin-bottom: 12px;">BÀI HỌC: ${pkg.title}</h2>
        <p style="text-align: center; font-size: 11pt; color: #475569; margin-bottom: 20px;">
          Môn: ${pkg.subject} • Lớp: ${pkg.grade} • Thời lượng: ${pkg.duration || '45 phút'} • GV: ${pkg.teacherName || 'Giáo viên'}
        </p>

        <h3 style="border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 16px;">I. MỤC TIÊU BÀI HỌC (GDPT 2018)</h3>
        <ol style="padding-left: 20px; margin: 8px 0;">
          ${pkg.objectives.map((o) => `<li style="margin-bottom: 4px;">${o}</li>`).join('')}
        </ol>

        <h3 style="border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px;">II. TIẾN TRÌNH DẠY HỌC (CÔNG VĂN 5512)</h3>
        ${pkg.activities
          .map(
            (act, i) => `
          <div style="margin-top: 14px;">
            <h4 style="background: #f1f5f9; padding: 6px 10px; border-left: 4px solid #2563eb;">
              Hoạt động ${i + 1}: ${act.title} (${act.timeMinutes || 10} phút)
            </h4>
            <p style="margin: 6px 0 6px 12px; font-style: italic; color: #475569;">${act.description || ''}</p>
            <ul style="padding-left: 32px;">
              ${act.slides.map((s) => `<li><b>${s.title}</b>${s.notes ? ` - <i>${s.notes}</i>` : ''}</li>`).join('')}
            </ul>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>In Bài Giảng - ${pkg.title}</title>
      <style>
        @page { size: ${mode === 'slides' ? 'landscape' : 'portrait'}; margin: 12mm; }
        body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; margin: 0; }
        .print-slide-page { page-break-after: always; height: 95vh; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid #cbd5e1; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
        .slide-header { border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 16px; }
        .badge { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-size: 10pt; font-weight: bold; }
        .slide-content { flex: 1; }
        .teacher-notes { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; font-size: 11pt; border-radius: 6px; margin-top: 12px; }
        .slide-footer { font-size: 9pt; color: #94a3b8; text-align: right; border-top: 1px solid #f1f5f9; padding-top: 8px; }
        .lesson-plan-page { max-width: 800px; margin: 0 auto; line-height: 1.5; font-size: 11pt; }
        @media print {
          .print-slide-page { border: none; height: 100vh; margin: 0; padding: 0; }
        }
      </style>
    </head>
    <body>
      ${bodyHtml}
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
};
