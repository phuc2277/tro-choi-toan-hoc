import { DocumentSource } from '../types/documentSource';
import {
  DocumentAnalysisResult,
  StructuredLessonContext,
  StructuredLessonSourceRef,
} from '../types/documentAnalysis';
import { documentStorageService } from './documentStorageService';

const ANALYSIS_DB_NAME = 'TeacherEducationAnalysisDB_v1';
const ANALYSIS_STORE_NAME = 'document_analyses';
const DB_VERSION = 1;

let memoryAnalysisCache: Record<string, DocumentAnalysisResult> = {};

// Initial rich sample analysis for the preloaded SGK Toán 8
const SAMPLE_ANALYSIS_MAP: Record<string, Partial<DocumentAnalysisResult>> = {
  'doc-math8-sgk-kntt-t1': {
    id: 'analysis-doc-math8-sgk-kntt-t1',
    documentId: 'doc-math8-sgk-kntt-t1',
    sourceId: 'SGK_TOAN8_KNTT_T1',
    documentVersion: 1,
    analysisVersion: 1,
    status: 'analyzed',
    analyzedAt: Date.now() - 3600000 * 24 * 5,
    metadata: {
      title: 'SGK Toán 8 Tập 1 (Kết nối tri thức với cuộc sống).pdf',
      originalName: 'SGK_Toan_8_Tap_1_KNTT.pdf',
      subject: 'Toán học',
      grade: 8,
      documentType: 'pdf',
      pageCount: 136,
      wordCount: 38500,
      scope: 'shared',
    },
    summary: 'Sách giáo khoa Toán 8 Tập 1 gồm Chương I: Biểu thức đại số, Chương II: Các hình khối trong thực tiễn, Chương III: Định lí Pythagore và Các loại tứ giác. Phân chia rõ ràng mục tiêu và hệ thống ví dụ, bài tập chuẩn GDPT 2018.',
    confidence: 0.98,
    topics: ['Đơn thức nhiều biến', 'Đa thức nhiều biến', 'Hằng đẳng thức đáng nhớ', 'Phân tích đa thức', 'Hình chóp tam giác đều', 'Hình chóp tứ giác đều', 'Định lí Pythagore', 'Tứ giác', 'Hình thang cân', 'Hình bình hành', 'Hình chữ nhật', 'Hình thoi', 'Hình vuông'],
    warnings: [],
    chapters: [
      {
        id: 'chap-1',
        number: 'I',
        title: 'Chương I: Biểu thức đại số',
        pageFrom: 5,
        pageTo: 45,
        lessonCount: 5,
        description: 'Đơn thức, đa thức nhiều biến và 7 hằng đẳng thức đáng nhớ.',
      },
      {
        id: 'chap-2',
        number: 'II',
        title: 'Chương II: Các hình khối trong thực tiễn',
        pageFrom: 46,
        pageTo: 72,
        lessonCount: 3,
        description: 'Hình chóp tam giác đều, hình chóp tứ giác đều, diện tích xung quanh và thể tích.',
      },
      {
        id: 'chap-3',
        number: 'III',
        title: 'Chương III: Định lí Pythagore. Các loại tứ giác thường gặp',
        pageFrom: 73,
        pageTo: 130,
        lessonCount: 6,
        description: 'Định lí Pythagore, tứ giác lồi, hình thang cân, hình bình hành, hình thoi, hình chữ nhật, hình vuông.',
      },
    ],
    lessons: [
      {
        id: 'les-1',
        number: '1',
        title: 'Bài 1: Đơn thức và đa thức nhiều biến',
        matchedLessonId: 'toan8-b1',
        chapterTitle: 'Chương I: Biểu thức đại số',
        chapterNumber: 'I',
        pageFrom: 6,
        pageTo: 13,
        confidence: 0.99,
        needsReview: false,
        summary: 'Nhận biết đơn thức nhiều biến, đơn thức thu gọn, bậc của đơn thức, hai đơn thức đồng dạng và quy tắc cộng trừ đơn thức.',
        topics: ['Đơn thức', 'Bậc của đơn thức', 'Đơn thức đồng dạng', 'Cộng trừ đơn thức'],
        keyFormulas: [
          'A = a \\cdot x^m y^n',
          'ax^n y^m + bx^n y^m = (a + b)x^n y^m',
          '\\text{Bậc} = m + n + \\dots',
        ],
        keyTheorems: [
          'Đơn thức nhiều biến là biểu thức đại số chỉ gồm một số, hoặc một biến, hoặc một tích giữa các số và các biến.',
          'Hai đơn thức đồng dạng có hệ số khác 0 và có cùng phần biến.',
        ],
        sections: [
          {
            id: 'sec-1-1',
            order: 1,
            title: '1. Khái niệm đơn thức nhiều biến',
            type: 'definition',
            page: 6,
            contentSnippet: 'Đơn thức nhiều biến là biểu thức đại số chỉ gồm một số, hoặc một biến, hoặc một tích giữa các số và các biến. Ví dụ: 2x, -3xy^2, \\frac{1}{2}x^2y.',
            formulas: ['2xy^2', '-\\frac{3}{4}x^3y'],
            keyTerms: ['Đơn thức', 'Biến', 'Hệ số'],
          },
          {
            id: 'sec-1-2',
            order: 2,
            title: '2. Đơn thức thu gọn và bậc của đơn thức',
            type: 'definition',
            page: 8,
            contentSnippet: 'Đơn thức thu gọn là đơn thức chỉ gồm tích của một số với các biến, mà mỗi biến đã được nâng lên lũy thừa với số mũ nguyên dương. Bậc của đơn thức có hệ số khác 0 là tổng số mũ của tất cả các biến.',
            formulas: ['3x^2y^3 \\Rightarrow \\text{Bậc là } 2 + 3 = 5'],
            keyTerms: ['Thu gọn', 'Bậc của đơn thức'],
          },
          {
            id: 'sec-1-3',
            order: 3,
            title: '3. Đơn thức đồng dạng và phép cộng trừ',
            type: 'property',
            page: 10,
            contentSnippet: 'Hai đơn thức đồng dạng là hai đơn thức có hệ số khác 0 và có cùng phần biến. Để cộng (hoặc trừ) các đơn thức đồng dạng, ta cộng (hoặc trừ) các hệ số với nhau và giữ nguyên phần biến.',
            formulas: ['2x^2y + 5x^2y = 7x^2y', '8xy^3 - 3xy^3 = 5xy^3'],
            keyTerms: ['Đơn thức đồng dạng', 'Cộng trừ'],
          },
        ],
      },
      {
        id: 'les-2',
        number: '2',
        title: 'Bài 2: Các phép tính với đa thức nhiều biến',
        matchedLessonId: 'toan8-b2',
        chapterTitle: 'Chương I: Biểu thức đại số',
        chapterNumber: 'I',
        pageFrom: 14,
        pageTo: 21,
        confidence: 0.98,
        needsReview: false,
        summary: 'Cộng trừ đa thức, nhân đơn thức với đa thức, nhân đa thức với đa thức, chia đơn thức cho đơn thức.',
        topics: ['Cộng trừ đa thức', 'Nhân đa thức', 'Chia đa thức'],
        keyFormulas: [
          'A(B + C) = AB + AC',
          '(A + B)(C + D) = AC + AD + BC + BD',
        ],
        sections: [
          {
            id: 'sec-2-1',
            order: 1,
            title: '1. Phép nhân đơn thức với đa thức',
            type: 'formula',
            page: 16,
            contentSnippet: 'Muốn nhân một đơn thức với một đa thức, ta nhân đơn thức với từng hạng tử của đa thức rồi cộng các tích với nhau.',
            formulas: ['A(B + C) = AB + AC'],
          },
        ],
      },
      {
        id: 'les-3',
        number: '3',
        title: 'Bài 3: Hằng đẳng thức đáng nhớ',
        matchedLessonId: 'toan8-b3',
        chapterTitle: 'Chương I: Biểu thức đại số',
        chapterNumber: 'I',
        pageFrom: 22,
        pageTo: 32,
        confidence: 0.99,
        needsReview: false,
        summary: 'Bảy hằng đẳng thức đáng nhớ: bình phương của một tổng, bình phương của một hiệu, hiệu hai bình phương, lập phương của một tổng/hiệu, tổng/hiệu hai lập phương.',
        topics: ['Hằng đẳng thức', 'Bình phương', 'Lập phương'],
        keyFormulas: [
          '(A + B)^2 = A^2 + 2AB + B^2',
          '(A - B)^2 = A^2 - 2AB + B^2',
          'A^2 - B^2 = (A - B)(A + B)',
          '(A + B)^3 = A^3 + 3A^2B + 3AB^2 + B^3',
          'A^3 + B^3 = (A + B)(A^2 - AB + B^2)',
        ],
        sections: [
          {
            id: 'sec-3-1',
            order: 1,
            title: '1. Bình phương của một tổng và một hiệu',
            type: 'formula',
            page: 23,
            contentSnippet: 'Với hai biểu thức A và B tùy ý: (A + B)^2 = A^2 + 2AB + B^2 và (A - B)^2 = A^2 - 2AB + B^2.',
            formulas: ['(A + B)^2 = A^2 + 2AB + B^2', '(A - B)^2 = A^2 - 2AB + B^2'],
          },
        ],
      },
    ],
    formulas: [
      {
        id: 'f-1',
        latex: 'ax^n y^m + bx^n y^m = (a + b)x^n y^m',
        text: 'Cộng trừ hai đơn thức đồng dạng',
        context: 'Bài 1: Đơn thức và đa thức nhiều biến - Trang 10',
        page: 10,
        lessonTitle: 'Bài 1: Đơn thức và đa thức nhiều biến',
      },
      {
        id: 'f-2',
        latex: 'A(B + C) = AB + AC',
        text: 'Nhân đơn thức với đa thức',
        context: 'Bài 2: Các phép tính với đa thức - Trang 16',
        page: 16,
        lessonTitle: 'Bài 2: Các phép tính với đa thức nhiều biến',
      },
      {
        id: 'f-3',
        latex: '(A + B)^2 = A^2 + 2AB + B^2',
        text: 'Bình phương của một tổng',
        context: 'Bài 3: Hằng đẳng thức đáng nhớ - Trang 23',
        page: 23,
        lessonTitle: 'Bài 3: Hằng đẳng thức đáng nhớ',
      },
      {
        id: 'f-4',
        latex: 'A^2 - B^2 = (A - B)(A + B)',
        text: 'Hiệu hai bình phương',
        context: 'Bài 3: Hằng đẳng thức đáng nhớ - Trang 25',
        page: 25,
        lessonTitle: 'Bài 3: Hằng đẳng thức đáng nhớ',
      },
      {
        id: 'f-5',
        latex: 'a^2 + b^2 = c^2 \\quad (\\triangle ABC \\text{ vuông tại } C)',
        text: 'Định lí Pythagore',
        context: 'Bài 8: Định lí Pythagore - Trang 74',
        page: 74,
        lessonTitle: 'Bài 8: Định lí Pythagore',
      },
    ],
    tables: [
      {
        id: 'tbl-1',
        title: 'Bảng tổng hợp 7 Hằng đẳng thức đáng nhớ',
        headers: ['STT', 'Tên hằng đẳng thức', 'Công thức dạng khai triển'],
        rows: [
          ['1', 'Bình phương một tổng', '(A + B)^2 = A^2 + 2AB + B^2'],
          ['2', 'Bình phương một hiệu', '(A - B)^2 = A^2 - 2AB + B^2'],
          ['3', 'Hiệu hai bình phương', 'A^2 - B^2 = (A - B)(A + B)'],
          ['4', 'Lập phương một tổng', '(A + B)^3 = A^3 + 3A^2B + 3AB^2 + B^3'],
          ['5', 'Lập phương một hiệu', '(A - B)^3 = A^3 - 3A^2B + 3AB^2 - B^3'],
          ['6', 'Tổng hai lập phương', 'A^3 + B^3 = (A + B)(A^2 - AB + B^2)'],
          ['7', 'Hiệu hai lập phương', 'A^3 - B^3 = (A - B)(A^2 + AB + B^2)'],
        ],
        page: 32,
        lessonTitle: 'Bài 3: Hằng đẳng thức đáng nhớ',
      },
    ],
    images: [
      {
        id: 'img-1',
        page: 7,
        caption: 'Hình 1.1: Mô hình diện tích hình chữ nhật biểu diễn đơn thức xy',
        context: 'Minh họa hình học cho biểu thức đại số và đơn thức',
        type: 'geometry',
        needsReview: false,
      },
      {
        id: 'img-2',
        page: 75,
        caption: 'Hình 3.4: Mô hình xếp hình chứng minh Định lí Pythagore $a^2 + b^2 = c^2$',
        context: 'Hoạt động trải nghiệm chứng minh định lý hình học',
        type: 'geometry',
        needsReview: false,
      },
    ],
  },
  'doc-math8-giao-an': {
    id: 'analysis-doc-math8-giao-an',
    documentId: 'doc-math8-giao-an',
    sourceId: 'GIAO_AN_TOAN8_5512',
    documentVersion: 1,
    analysisVersion: 1,
    status: 'analyzed',
    analyzedAt: Date.now() - 3600000 * 24 * 4,
    metadata: {
      title: 'Giáo án Toán 8 cả năm chuẩn Công văn 5512.docx',
      originalName: 'Giao_An_Toan_8_NamHoc2024_2025.docx',
      subject: 'Toán học',
      grade: 8,
      documentType: 'docx',
      pageCount: 220,
      wordCount: 52000,
      scope: 'shared',
    },
    summary: 'Kế hoạch bài dạy (Giáo án) Toán 8 cả năm bám sát 4 hoạt động của Công văn 5512/BGDĐT: Khởi động, Khám phá, Luyện tập, Vận dụng cho từng tiết học.',
    confidence: 0.97,
    topics: ['Kế hoạch bài dạy 5512', 'Mục tiêu phẩm chất & năng lực', 'Tiến trình dạy học 4 bước'],
    warnings: [],
    chapters: [
      {
        id: 'ga-chap-1',
        title: 'Kế hoạch dạy học Chương I: Biểu thức đại số',
        pageFrom: 1,
        pageTo: 60,
        lessonCount: 5,
      },
    ],
    lessons: [
      {
        id: 'ga-les-1',
        title: 'Tiết 1-2: Bài 1 - Đơn thức nhiều biến',
        matchedLessonId: 'toan8-b1',
        chapterTitle: 'Chương I: Biểu thức đại số',
        pageFrom: 2,
        pageTo: 10,
        confidence: 0.98,
        needsReview: false,
        summary: 'Tiến trình sư phạm dạy học 2 tiết: Hoạt động mở đầu (Bài toán tính diện tích), Hình thành kiến thức đơn thức, Luyện tập nhận diện và trò chơi củng cố.',
        sections: [
          {
            id: 'ga-sec-1',
            order: 1,
            title: 'Hoạt động 1: Khởi động (Mở đầu)',
            type: 'activity',
            page: 2,
            contentSnippet: 'Giáo viên nêu tình huống thực tế tính tiền mua sách vở biểu diễn dưới dạng biểu thức 15000x + 8000y.',
          },
          {
            id: 'ga-sec-2',
            order: 2,
            title: 'Hoạt động 2: Hình thành kiến thức đơn thức thu gọn',
            type: 'definition',
            page: 4,
            contentSnippet: 'Học sinh thảo luận nhóm phát hiện quy luật về tổng số mũ các biến trong đơn thức.',
          },
        ],
      },
    ],
    formulas: [
      {
        id: 'ga-f-1',
        latex: 'S = \\frac{1}{2} a h',
        text: 'Công thức diện tích tam giác trong bài mở đầu',
        context: 'Giáo án Tiết 1 - Trang 3',
        page: 3,
        lessonTitle: 'Tiết 1-2: Bài 1 - Đơn thức nhiều biến',
      },
    ],
    tables: [],
    images: [],
  },

  // 1. KNTT Toán 6 Tập 1
  'doc-math6-sgk-kntt-t1': {
    id: 'analysis-doc-math6-sgk-kntt-t1',
    documentId: 'doc-math6-sgk-kntt-t1',
    sourceId: 'SGK_TOAN6_KNTT_T1',
    documentVersion: 1,
    analysisVersion: 1,
    status: 'analyzed',
    analyzedAt: Date.now() - 3600000 * 24 * 6,
    metadata: {
      title: 'SGK Toán 6 Tập 1 (Kết nối tri thức với cuộc sống).pdf',
      originalName: 'SGK_Toan_6_Tap_1_KNTT.pdf',
      subject: 'Toán học',
      grade: 6,
      documentType: 'pdf',
      pageCount: 124,
      wordCount: 33500,
      scope: 'shared',
    },
    summary: 'Sách giáo khoa Toán 6 Tập 1 Kết nối tri thức bao gồm: Tập hợp các số tự nhiên, Tính chia hết (ƯCLN, BCNN, Số nguyên tố), Số nguyên Z và Các hình phẳng trong thực tiễn (Tam giác đều, Hình vuông, Lục giác đều).',
    confidence: 0.98,
    topics: ['Tập hợp số tự nhiên', 'Lũy thừa', 'Số nguyên tố', 'ƯCLN', 'BCNN', 'Số nguyên', 'Hình học trực quan'],
    warnings: [],
    chapters: [
      { id: 'c6-1', title: 'Chương I: Tập hợp các số tự nhiên', pageFrom: 5, pageTo: 38, lessonCount: 7 },
      { id: 'c6-2', title: 'Chương II: Tính chia hết trong tập hợp các số tự nhiên', pageFrom: 39, pageTo: 58, lessonCount: 5 },
      { id: 'c6-3', title: 'Chương III: Số nguyên', pageFrom: 59, pageTo: 84, lessonCount: 5 },
      { id: 'c6-4', title: 'Chương IV: Một số hình phẳng trong thực tiễn', pageFrom: 85, pageTo: 108, lessonCount: 4 },
      { id: 'c6-5', title: 'Chương V: Tính đối xứng của hình phẳng trong tự nhiên', pageFrom: 109, pageTo: 124, lessonCount: 2 },
    ],
    formulas: [
      { id: 'f6-1', latex: 'a^m \\cdot a^n = a^{m+n}', text: 'Nhân hai lũy thừa cùng cơ số', context: 'Lũy thừa với số mũ tự nhiên - Trang 20', page: 20, lessonTitle: 'Lũy thừa với số mũ tự nhiên' },
      { id: 'f6-2', latex: 'a^m : a^n = a^{m-n} \\quad (a \\neq 0, m \\ge n)', text: 'Chia hai lũy thừa cùng cơ số', context: 'Lũy thừa với số mũ tự nhiên - Trang 21', page: 21, lessonTitle: 'Lũy thừa với số mũ tự nhiên' },
      { id: 'f6-3', latex: 'S = a \\cdot b', text: 'Diện tích hình chữ nhật', context: 'Chu vi và diện tích các hình phẳng - Trang 95', page: 95, lessonTitle: 'Chu vi và diện tích các hình phẳng' },
    ],
    tables: [],
    images: [],
  },

  // 2. KNTT Toán 6 Tập 2
  'doc-math6-sgk-kntt-t2': {
    id: 'analysis-doc-math6-sgk-kntt-t2',
    documentId: 'doc-math6-sgk-kntt-t2',
    sourceId: 'SGK_TOAN6_KNTT_T2',
    documentVersion: 1,
    analysisVersion: 1,
    status: 'analyzed',
    analyzedAt: Date.now() - 3600000 * 24 * 5,
    metadata: {
      title: 'SGK Toán 6 Tập 2 (Kết nối tri thức với cuộc sống).pdf',
      originalName: 'SGK_Toan_6_Tap_2_KNTT.pdf',
      subject: 'Toán học',
      grade: 6,
      documentType: 'pdf',
      pageCount: 128,
      wordCount: 34800,
      scope: 'shared',
    },
    summary: 'Sách giáo khoa Toán 6 Tập 2 Kết nối tri thức bao gồm: Phân số, Số thập phân, Hình học cơ bản (Điểm, Đoạn thẳng, Tia, Góc) và Dữ liệu - Xác suất thực nghiệm.',
    confidence: 0.98,
    topics: ['Phân số', 'Số thập phân', 'Tỉ số phần trăm', 'Điểm và đường thẳng', 'Góc', 'Xác suất thực nghiệm'],
    warnings: [],
    chapters: [
      { id: 'c6-6', title: 'Chương VI: Phân số', pageFrom: 5, pageTo: 36, lessonCount: 6 },
      { id: 'c6-7', title: 'Chương VII: Số thập phân', pageFrom: 37, pageTo: 64, lessonCount: 5 },
      { id: 'c6-8', title: 'Chương VIII: Những hình học cơ bản', pageFrom: 65, pageTo: 98, lessonCount: 5 },
      { id: 'c6-9', title: 'Chương IX: Dữ liệu và xác suất thực nghiệm', pageFrom: 99, pageTo: 128, lessonCount: 5 },
    ],
    formulas: [
      { id: 'f6-4', latex: '\\frac{a}{b} = \\frac{c}{d} \\Leftrightarrow a \\cdot d = b \\cdot c', text: 'Định nghĩa hai phân số bằng nhau', context: 'Phân số bằng nhau - Trang 10', page: 10, lessonTitle: 'Phân số bằng nhau' },
      { id: 'f6-5', latex: 'P = \\frac{k}{n}', text: 'Xác suất thực nghiệm', context: 'Xác suất thực nghiệm của biến cố - Trang 115', page: 115, lessonTitle: 'Xác suất thực nghiệm của biến cố' },
    ],
    tables: [],
    images: [],
  },

  // 3. KNTT Toán 7 Tập 1
  'doc-math7-sgk-kntt-t1': {
    id: 'analysis-doc-math7-sgk-kntt-t1',
    documentId: 'doc-math7-sgk-kntt-t1',
    sourceId: 'SGK_TOAN7_KNTT_T1',
    documentVersion: 1,
    analysisVersion: 1,
    status: 'analyzed',
    analyzedAt: Date.now() - 3600000 * 24 * 5,
    metadata: {
      title: 'SGK Toán 7 Tập 1 (Kết nối tri thức với cuộc sống).pdf',
      originalName: 'SGK_Toan_7_Tap_1_KNTT.pdf',
      subject: 'Toán học',
      grade: 7,
      documentType: 'pdf',
      pageCount: 132,
      wordCount: 36200,
      scope: 'shared',
    },
    summary: 'Sách giáo khoa Toán 7 Tập 1 Kết nối tri thức: Số hữu tỉ Q, Số thực R và Căn bậc hai, Góc và Hai đường thẳng song song, Tam giác bằng nhau (c-c-c, c-g-c, g-c-g) và Biểu đồ thống kê.',
    confidence: 0.98,
    topics: ['Số hữu tỉ', 'Số thực', 'Căn bậc hai', 'Hai đường thẳng song song', 'Tam giác bằng nhau', 'Tam giác cân', 'Biểu đồ hình quạt'],
    warnings: [],
    chapters: [
      { id: 'c7-1', title: 'Chương I: Số hữu tỉ', pageFrom: 5, pageTo: 30, lessonCount: 5 },
      { id: 'c7-2', title: 'Chương II: Số thực', pageFrom: 31, pageTo: 52, lessonCount: 4 },
      { id: 'c7-3', title: 'Chương III: Góc và hai đường thẳng song song', pageFrom: 53, pageTo: 76, lessonCount: 4 },
      { id: 'c7-4', title: 'Chương IV: Tam giác bằng nhau', pageFrom: 77, pageTo: 110, lessonCount: 6 },
      { id: 'c7-5', title: 'Chương V: Thu thập và biểu diễn dữ liệu', pageFrom: 111, pageTo: 132, lessonCount: 3 },
    ],
    formulas: [
      { id: 'f7-1', latex: '(x^m)^n = x^{m \\cdot n}', text: 'Lũy thừa của lũy thừa', context: 'Lũy thừa của một số hữu tỉ - Trang 18', page: 18, lessonTitle: 'Lũy thừa của một số hữu tỉ' },
      { id: 'f7-2', latex: '\\widehat{A} + \\widehat{B} + \\widehat{C} = 180^\\circ', text: 'Tổng các góc trong tam giác', context: 'Tổng ba góc của một tam giác - Trang 80', page: 80, lessonTitle: 'Tổng ba góc của một tam giác' },
    ],
    tables: [],
    images: [],
  },

  // 4. KNTT Toán 7 Tập 2
  'doc-math7-sgk-kntt-t2': {
    id: 'analysis-doc-math7-sgk-kntt-t2',
    documentId: 'doc-math7-sgk-kntt-t2',
    sourceId: 'SGK_TOAN7_KNTT_T2',
    documentVersion: 1,
    analysisVersion: 1,
    status: 'analyzed',
    analyzedAt: Date.now() - 3600000 * 24 * 4,
    metadata: {
      title: 'SGK Toán 7 Tập 2 (Kết nối tri thức với cuộc sống).pdf',
      originalName: 'SGK_Toan_7_Tap_2_KNTT.pdf',
      subject: 'Toán học',
      grade: 7,
      documentType: 'pdf',
      pageCount: 128,
      wordCount: 35100,
      scope: 'shared',
    },
    summary: 'Sách giáo khoa Toán 7 Tập 2 Kết nối tri thức: Tỉ lệ thức & Dãy tỉ số bằng nhau, Biểu thức đại số & Đa thức một biến, Xác suất biến cố, Các đường đồng quy trong tam giác và Hình lăng trụ đứng.',
    confidence: 0.98,
    topics: ['Tỉ lệ thức', 'Dãy tỉ số bằng nhau', 'Đa thức một biến', 'Nghiệm đa thức', 'Đường đồng quy trong tam giác', 'Hình lăng trụ đứng'],
    warnings: [],
    chapters: [
      { id: 'c7-6', title: 'Chương VI: Tỉ lệ thức và đại lượng tỉ lệ', pageFrom: 5, pageTo: 30, lessonCount: 4 },
      { id: 'c7-7', title: 'Chương VII: Biểu thức đại số và đa thức một biến', pageFrom: 31, pageTo: 60, lessonCount: 5 },
      { id: 'c7-8', title: 'Chương VIII: Làm quen với biến cố và xác suất', pageFrom: 61, pageTo: 76, lessonCount: 3 },
      { id: 'c7-9', title: 'Chương IX: Quan hệ giữa các yếu tố trong một tam giác', pageFrom: 77, pageTo: 106, lessonCount: 6 },
      { id: 'c7-10', title: 'Chương X: Một số hình khối trong thực tiễn', pageFrom: 107, pageTo: 128, lessonCount: 3 },
    ],
    formulas: [
      { id: 'f7-3', latex: '\\frac{a}{b} = \\frac{c}{d} = \\frac{a+c}{b+d} = \\frac{a-c}{b-d}', text: 'Tính chất dãy tỉ số bằng nhau', context: 'Tính chất dãy tỉ số bằng nhau - Trang 12', page: 12, lessonTitle: 'Tính chất dãy tỉ số bằng nhau' },
      { id: 'f7-4', latex: 'V = S_{\\text{đáy}} \\cdot h', text: 'Thể tích hình lăng trụ đứng', context: 'Hình lăng trụ đứng tam giác - Trang 114', page: 114, lessonTitle: 'Hình lăng trụ đứng tam giác' },
    ],
    tables: [],
    images: [],
  },

  // 5. KNTT Toán 8 Tập 2
  'doc-math8-sgk-kntt-t2': {
    id: 'analysis-doc-math8-sgk-kntt-t2',
    documentId: 'doc-math8-sgk-kntt-t2',
    sourceId: 'SGK_TOAN8_KNTT_T2',
    documentVersion: 1,
    analysisVersion: 1,
    status: 'analyzed',
    analyzedAt: Date.now() - 3600000 * 24 * 4,
    metadata: {
      title: 'SGK Toán 8 Tập 2 (Kết nối tri thức với cuộc sống).pdf',
      originalName: 'SGK_Toan_8_Tap_2_KNTT.pdf',
      subject: 'Toán học',
      grade: 8,
      documentType: 'pdf',
      pageCount: 130,
      wordCount: 37800,
      scope: 'shared',
    },
    summary: 'Sách giáo khoa Toán 8 Tập 2 Kết nối tri thức: Phân thức đại số, Phương trình bậc nhất một ẩn, Hàm số bậc nhất y = ax + b, Tam giác đồng dạng và Hình chóp tam giác đều / tứ giác đều.',
    confidence: 0.98,
    topics: ['Phân thức đại số', 'Phương trình bậc nhất', 'Hàm số bậc nhất', 'Hệ số góc', 'Tam giác đồng dạng', 'Hình chóp đều'],
    warnings: [],
    chapters: [
      { id: 'c8-6', title: 'Chương VI: Phân thức đại số', pageFrom: 5, pageTo: 34, lessonCount: 4 },
      { id: 'c8-7', title: 'Chương VII: Phương trình bậc nhất và hàm số bậc nhất', pageFrom: 35, pageTo: 66, lessonCount: 5 },
      { id: 'c8-8', title: 'Chương VIII: Mở đầu về tính xác suất của biến cố', pageFrom: 67, pageTo: 82, lessonCount: 3 },
      { id: 'c8-9', title: 'Chương IX: Tam giác đồng dạng', pageFrom: 83, pageTo: 112, lessonCount: 5 },
      { id: 'c8-10', title: 'Chương X: Một số hình khối trong thực tiễn', pageFrom: 113, pageTo: 130, lessonCount: 3 },
    ],
    formulas: [
      { id: 'f8-6', latex: 'ax + b = 0 \\Leftrightarrow x = -\\frac{b}{a} \\quad (a \\neq 0)', text: 'Phương trình bậc nhất một ẩn', context: 'Phương trình bậc nhất một ẩn - Trang 40', page: 40, lessonTitle: 'Phương trình bậc nhất một ẩn' },
      { id: 'f8-7', latex: 'V = \\frac{1}{3} S_{\\text{đáy}} \\cdot h', text: 'Thể tích hình chóp đều', context: 'Hình chóp tam giác đều và tứ giác đều - Trang 120', page: 120, lessonTitle: 'Hình chóp tam giác đều và tứ giác đều' },
    ],
    tables: [],
    images: [],
  },

  // 6. KNTT Toán 9 Tập 1
  'doc-math9-sgk-kntt-t1': {
    id: 'analysis-doc-math9-sgk-kntt-t1',
    documentId: 'doc-math9-sgk-kntt-t1',
    sourceId: 'SGK_TOAN9_KNTT_T1',
    documentVersion: 1,
    analysisVersion: 1,
    status: 'analyzed',
    analyzedAt: Date.now() - 3600000 * 24 * 3,
    metadata: {
      title: 'SGK Toán 9 Tập 1 (Kết nối tri thức với cuộc sống).pdf',
      originalName: 'SGK_Toan_9_Tap_1_KNTT.pdf',
      subject: 'Toán học',
      grade: 9,
      documentType: 'pdf',
      pageCount: 144,
      wordCount: 42500,
      scope: 'shared',
    },
    summary: 'Sách giáo khoa Toán 9 Tập 1 Kết nối tri thức: Phương trình và Hệ phương trình bậc nhất hai ẩn, Bất phương trình bậc nhất một ẩn, Căn bậc hai & căn bậc ba, Hệ thức lượng trong tam giác vuông, Đường tròn & tiếp tuyến.',
    confidence: 0.98,
    topics: ['Hệ phương trình bậc nhất hai ẩn', 'Căn bậc hai', 'Căn bậc ba', 'Hệ thức lượng', 'Tỉ số lượng giác', 'Đường tròn'],
    warnings: [],
    chapters: [
      { id: 'c9-1', title: 'Chương I: Phương trình và hệ hai phương trình bậc nhất hai ẩn', pageFrom: 5, pageTo: 32, lessonCount: 4 },
      { id: 'c9-2', title: 'Chương II: Phương trình và bất phương trình bậc nhất một ẩn', pageFrom: 33, pageTo: 56, lessonCount: 4 },
      { id: 'c9-3', title: 'Chương III: Căn bậc hai và căn bậc ba', pageFrom: 57, pageTo: 82, lessonCount: 4 },
      { id: 'c9-4', title: 'Chương IV: Hệ thức lượng trong tam giác vuông', pageFrom: 83, pageTo: 108, lessonCount: 4 },
      { id: 'c9-5', title: 'Chương V: Đường tròn', pageFrom: 109, pageTo: 144, lessonCount: 6 },
    ],
    formulas: [
      { id: 'f9-1', latex: '\\sin \\alpha = \\frac{\\text{đối}}{\\text{huyền}}, \\quad \\cos \\alpha = \\frac{\\text{kề}}{\\text{huyền}}, \\quad \\tan \\alpha = \\frac{\\text{đối}}{\\text{kề}}', text: 'Tỉ số lượng giác góc nhọn', context: 'Tỉ số lượng giác của góc nhọn - Trang 88', page: 88, lessonTitle: 'Tỉ số lượng giác của góc nhọn' },
      { id: 'f9-2', latex: 'b^2 = a \\cdot b\', \\quad c^2 = a \\cdot c\', \\quad h^2 = b\' \\cdot c\'', text: 'Hệ thức lượng trong tam giác vuông', context: 'Một số hệ thức về cạnh và đường cao - Trang 94', page: 94, lessonTitle: 'Một số hệ thức về cạnh và đường cao' },
    ],
    tables: [],
    images: [],
  },

  // 7. KNTT Toán 9 Tập 2
  'doc-math9-sgk-kntt-t2': {
    id: 'analysis-doc-math9-sgk-kntt-t2',
    documentId: 'doc-math9-sgk-kntt-t2',
    sourceId: 'SGK_TOAN9_KNTT_T2',
    documentVersion: 1,
    analysisVersion: 1,
    status: 'analyzed',
    analyzedAt: Date.now() - 3600000 * 24 * 3,
    metadata: {
      title: 'SGK Toán 9 Tập 2 (Kết nối tri thức với cuộc sống).pdf',
      originalName: 'SGK_Toan_9_Tap_2_KNTT.pdf',
      subject: 'Toán học',
      grade: 9,
      documentType: 'pdf',
      pageCount: 148,
      wordCount: 43600,
      scope: 'shared',
    },
    summary: 'Sách giáo khoa Toán 9 Tập 2 Kết nối tri thức: Hàm số y = ax^2 & Phương trình bậc hai một ẩn, Định lí Viète, Tần số và tần số tương đối, Xác suất biến cố, Tứ giác nội tiếp, Đường tròn ngoại tiếp/nội tiếp và Hình khối không gian (Hình trụ, Hình nón, Hình cầu).',
    confidence: 0.99,
    topics: ['Hàm số y = ax^2', 'Phương trình bậc hai', 'Định lí Viète', 'Tứ giác nội tiếp', 'Hình trụ', 'Hình nón', 'Hình cầu'],
    warnings: [],
    chapters: [
      { id: 'c9-6', title: 'Chương VI: Hàm số y = ax^2 và Phương trình bậc hai một ẩn', pageFrom: 5, pageTo: 38, lessonCount: 5 },
      { id: 'c9-7', title: 'Chương VII: Tần số và tần số tương đối', pageFrom: 39, pageTo: 66, lessonCount: 4 },
      { id: 'c9-8', title: 'Chương VIII: Xác suất của biến cố trong một số mô hình', pageFrom: 67, pageTo: 84, lessonCount: 3 },
      { id: 'c9-9', title: 'Chương IX: Đường tròn ngoại tiếp và nội tiếp', pageFrom: 85, pageTo: 118, lessonCount: 5 },
      { id: 'c9-10', title: 'Chương X: Một số hình khối trong thực tiễn', pageFrom: 119, pageTo: 148, lessonCount: 4 },
    ],
    formulas: [
      { id: 'f9-3', latex: 'x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a} \\quad (\\Delta = b^2 - 4ac > 0)', text: 'Công thức nghiệm phương trình bậc hai', context: 'Phương trình bậc hai một ẩn - Trang 18', page: 18, lessonTitle: 'Phương trình bậc hai một ẩn' },
      { id: 'f9-4', latex: 'x_1 + x_2 = -\\frac{b}{a}, \\quad x_1 \\cdot x_2 = \\frac{c}{a}', text: 'Định lí Viète', context: 'Định lí Viète và ứng dụng - Trang 24', page: 24, lessonTitle: 'Định lí Viète và ứng dụng' },
      { id: 'f9-5', latex: 'V_{\\text{trụ}} = \\pi R^2 h, \\quad V_{\\text{nón}} = \\frac{1}{3} \\pi R^2 h, \\quad V_{\\text{cầu}} = \\frac{4}{3} \\pi R^3', text: 'Thể tích các hình khối tròn xoay', context: 'Hình trụ, Hình nón, Hình cầu - Trang 135', page: 135, lessonTitle: 'Hình trụ, Hình nón, Hình cầu' },
    ],
    tables: [],
    images: [],
  },
};

// Helper to ensure all required array fields are initialized
export function normalizeAnalysis(analysis: DocumentAnalysisResult | Partial<DocumentAnalysisResult>): DocumentAnalysisResult {
  return {
    id: analysis.id || `analysis-${analysis.documentId || 'unknown'}`,
    documentId: analysis.documentId || '',
    sourceId: analysis.sourceId || '',
    documentVersion: analysis.documentVersion || 1,
    analysisVersion: analysis.analysisVersion || 1,
    status: analysis.status || 'unprocessed',
    analyzedAt: analysis.analyzedAt || Date.now(),
    errorMessage: analysis.errorMessage,
    metadata: analysis.metadata || {
      title: 'Tài liệu',
      originalName: 'tailieu.pdf',
      subject: 'Toán học',
      grade: 8,
      documentType: 'pdf',
      scope: 'shared',
    },
    chapters: Array.isArray(analysis.chapters) ? analysis.chapters : [],
    lessons: Array.isArray(analysis.lessons) ? analysis.lessons : [],
    sections: Array.isArray(analysis.sections) ? analysis.sections : [],
    formulas: Array.isArray(analysis.formulas) ? analysis.formulas : [],
    tables: Array.isArray(analysis.tables) ? analysis.tables : [],
    images: Array.isArray(analysis.images) ? analysis.images : [],
    topics: Array.isArray(analysis.topics) ? analysis.topics : [],
    links: Array.isArray(analysis.links) ? analysis.links : [],
    warnings: Array.isArray(analysis.warnings) ? analysis.warnings : [],
    confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.85,
    summary: analysis.summary || '',
    teacherEdited: analysis.teacherEdited,
    teacherNotes: analysis.teacherNotes,
  };
}

// Open IndexedDB connection
function openAnalysisDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not available in this environment'));
    }
    const request = indexedDB.open(ANALYSIS_DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ANALYSIS_STORE_NAME)) {
        const store = db.createObjectStore(ANALYSIS_STORE_NAME, { keyPath: 'documentId' });
        store.createIndex('sourceId', 'sourceId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const DocumentAnalysisService = {
  // 1. Initialize & Seed pre-analyzed sample data
  async init(): Promise<void> {
    if (Object.keys(memoryAnalysisCache).length > 0) return;

    try {
      const db = await openAnalysisDB();
      const tx = db.transaction(ANALYSIS_STORE_NAME, 'readonly');
      const store = tx.objectStore(ANALYSIS_STORE_NAME);
      const req = store.getAll();

      const items = await new Promise<DocumentAnalysisResult[]>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      if (items.length > 0) {
        items.forEach((item) => {
          memoryAnalysisCache[item.documentId] = normalizeAnalysis(item);
        });
        // Upsert any missing pre-analyzed sample data (e.g. newly added KNTT 6, 7, 8, 9 books)
        for (const [docId, sample] of Object.entries(SAMPLE_ANALYSIS_MAP)) {
          if (!memoryAnalysisCache[docId]) {
            const fullSample = normalizeAnalysis(sample as DocumentAnalysisResult);
            memoryAnalysisCache[docId] = fullSample;
            await this.saveAnalysis(fullSample);
          }
        }
      } else {
        // Seed default analyses
        for (const [docId, sample] of Object.entries(SAMPLE_ANALYSIS_MAP)) {
          const fullSample = normalizeAnalysis(sample as DocumentAnalysisResult);
          memoryAnalysisCache[docId] = fullSample;
          await this.saveAnalysis(fullSample);
        }
      }
    } catch {
      // Fallback in-memory
      for (const [docId, sample] of Object.entries(SAMPLE_ANALYSIS_MAP)) {
        memoryAnalysisCache[docId] = normalizeAnalysis(sample as DocumentAnalysisResult);
      }
    }
  },

  // 2. Get Analysis by Document ID
  async getAnalysis(documentId: string): Promise<DocumentAnalysisResult | null> {
    await this.init();
    if (memoryAnalysisCache[documentId]) {
      return normalizeAnalysis(memoryAnalysisCache[documentId]);
    }

    try {
      const db = await openAnalysisDB();
      const tx = db.transaction(ANALYSIS_STORE_NAME, 'readonly');
      const store = tx.objectStore(ANALYSIS_STORE_NAME);
      const req = store.get(documentId);

      const result = await new Promise<DocumentAnalysisResult | undefined>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (result) {
        const normalized = normalizeAnalysis(result);
        memoryAnalysisCache[documentId] = normalized;
        return normalized;
      }
    } catch {
      // Ignore DB errors
    }

    return null;
  },

  // 3. Save Analysis Result
  async saveAnalysis(analysis: DocumentAnalysisResult): Promise<void> {
    const normalized = normalizeAnalysis(analysis);
    memoryAnalysisCache[normalized.documentId] = normalized;

    try {
      const db = await openAnalysisDB();
      const tx = db.transaction(ANALYSIS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(ANALYSIS_STORE_NAME);
      store.put(normalized);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('Could not persist analysis in IndexedDB:', e);
    }
  },

  // 4. Trigger AI Deep Analysis with Gemini API (Phase 2 Core Engine)
  async triggerDocumentAnalysis(
    doc: DocumentSource,
    forceReanalyze = false
  ): Promise<DocumentAnalysisResult> {
    await this.init();

    // Check if already analyzed and valid
    const existing = memoryAnalysisCache[doc.id];
    if (existing && existing.status === 'analyzed' && !forceReanalyze) {
      if (existing.documentVersion === doc.version) {
        return existing;
      }
    }

    // Mark as analyzing
    const pendingAnalysis: DocumentAnalysisResult = {
      id: `analysis-${doc.id}`,
      documentId: doc.id,
      sourceId: doc.sourceId,
      documentVersion: doc.version,
      analysisVersion: 1,
      status: 'analyzing',
      analyzedAt: Date.now(),
      metadata: {
        title: doc.name,
        originalName: doc.originalName,
        subject: doc.subjectName || doc.subject || 'Toán học',
        grade: doc.gradeLevel || doc.grade || 8,
        documentType: doc.type,
        pageCount: doc.pageCount || 1,
        wordCount: doc.wordCount || 0,
        scope: doc.scope,
        lessonId: doc.lessonId,
        lessonTitle: doc.lessonTitle,
      },
      chapters: [],
      lessons: [],
      sections: [],
      formulas: [],
      tables: [],
      images: [],
      topics: doc.topics || [],
      links: [],
      warnings: [],
      confidence: 0.8,
      summary: 'Đang gửi yêu cầu phân tích dữ liệu qua Gemini AI...',
    };

    memoryAnalysisCache[doc.id] = pendingAnalysis;

    try {
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: doc.id,
          sourceId: doc.sourceId,
          title: doc.name,
          originalName: doc.originalName,
          subject: doc.subjectName || doc.subject || 'Toán học',
          grade: doc.gradeLevel || doc.grade || 8,
          documentType: doc.type,
          scope: doc.scope,
          lessonId: doc.lessonId,
          lessonTitle: doc.lessonTitle,
          documentText: doc.extractedText || doc.extractedTextSnippet || '',
          fileBase64: doc.fileDataUrl,
          mimeType: doc.mimeType,
          pageCount: doc.pageCount,
          documentVersion: doc.version,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Máy chủ phản hồi lỗi ${response.status}`);
      }

      const resJson = await response.json();
      if (!resJson.analysis) {
        throw new Error('Không nhận được dữ liệu cấu trúc hợp lệ từ AI');
      }

      const completedAnalysis: DocumentAnalysisResult = normalizeAnalysis({
        ...resJson.analysis,
        status: 'analyzed',
        analyzedAt: Date.now(),
      });

      await this.saveAnalysis(completedAnalysis);

      // Also update DocumentSource with the newly extracted topics and chapters for indexing
      if (completedAnalysis.topics?.length || completedAnalysis.chapters?.length) {
        await documentStorageService.updateDocument(doc.id, {
          topics: completedAnalysis.topics,
          chapters: completedAnalysis.chapters.map((c) => c.title),
          pageRanges: (completedAnalysis.lessons || []).map((l) => ({
            lessonId: l.matchedLessonId || l.id,
            lessonTitle: l.title,
            fromPage: l.pageFrom,
            toPage: l.pageTo,
          })),
        });
      }

      return completedAnalysis;
    } catch (err: any) {
      console.error('Error during AI document analysis:', err);
      const errorResult: DocumentAnalysisResult = {
        ...pendingAnalysis,
        status: 'error',
        errorMessage: err.message || 'Lỗi xử lý phân tích AI',
        summary: `Không thể hoàn thành phân tích AI: ${err.message || 'Lỗi không xác định'}`,
      };
      await this.saveAnalysis(errorResult);
      return errorResult;
    }
  },

  // 5. Teacher inline edit / correction (Human-in-the-loop review)
  async updateAnalysisByTeacher(
    documentId: string,
    updates: Partial<DocumentAnalysisResult>,
    teacherNote?: string
  ): Promise<DocumentAnalysisResult | null> {
    const current = await this.getAnalysis(documentId);
    if (!current) return null;

    const updated: DocumentAnalysisResult = {
      ...current,
      ...updates,
      teacherEdited: true,
      teacherNotes: teacherNote || current.teacherNotes,
      analyzedAt: Date.now(),
    };

    await this.saveAnalysis(updated);
    return updated;
  },

  // 6. Query Structured Context for a Lesson (Bridge for Phase 3 - Lesson Structure Generation)
  async getStructuredLessonContext(
    subjectId: string,
    gradeLevel: number,
    lessonId: string,
    lessonTitle = ''
  ): Promise<StructuredLessonContext> {
    await this.init();

    // 1. Get all documents for this subject & grade
    const sharedDocs = await documentStorageService.getSharedDocuments(subjectId, gradeLevel);
    const lessonDocsAll = await documentStorageService.getLessonDocuments(subjectId, gradeLevel, lessonId);
    const allDocs = [...sharedDocs, ...lessonDocsAll];

    // 2. Filter default shared documents and lesson specific documents
    const defaultSharedDocs = allDocs.filter((d) => d.scope === 'shared' && d.isDefault);
    const lessonDocs = allDocs.filter((d) => d.scope === 'lesson' && (d.lessonId === lessonId || !d.lessonId));

    const sharedSourceRefs: StructuredLessonSourceRef[] = [];
    const lessonSourceRefs: StructuredLessonSourceRef[] = [];

    const cleanTitle = (lessonTitle || '').toLowerCase().replace(/bài\s*\d+\s*:\s*/i, '').trim();

    // 3. Process Shared Sources (Extract only sections matching this lesson)
    for (const doc of defaultSharedDocs) {
      const rawAnalysis = await this.getAnalysis(doc.id);
      const analysis = rawAnalysis ? normalizeAnalysis(rawAnalysis) : null;
      if (analysis && analysis.status === 'analyzed') {
        const lessonsList = Array.isArray(analysis.lessons) ? analysis.lessons : [];
        // Find matching lesson in the textbook analysis
        const matchedLesson = lessonsList.find((l) => {
          if (l.matchedLessonId === lessonId) return true;
          const lTitle = (l.title || '').toLowerCase();
          return cleanTitle && (lTitle.includes(cleanTitle) || cleanTitle.includes(lTitle.replace(/bài\s*\d+\s*:\s*/i, '').trim()));
        }) || lessonsList[0]; // fallback to first or general if small doc

        if (matchedLesson) {
          const formulasList = Array.isArray(analysis.formulas) ? analysis.formulas : [];
          const tablesList = Array.isArray(analysis.tables) ? analysis.tables : [];
          const imagesList = Array.isArray(analysis.images) ? analysis.images : [];
          sharedSourceRefs.push({
            sourceId: doc.sourceId,
            documentName: doc.name,
            scope: 'shared',
            isDefault: doc.isDefault,
            pageRange: { from: matchedLesson.pageFrom, to: matchedLesson.pageTo },
            matchedLessonTitle: matchedLesson.title,
            confidence: matchedLesson.confidence,
            sections: Array.isArray(matchedLesson.sections) ? matchedLesson.sections : [],
            formulas: formulasList.filter((f) => f.lessonTitle?.includes(matchedLesson.title) || (f.page && f.page >= matchedLesson.pageFrom && f.page <= matchedLesson.pageTo)),
            tables: tablesList.filter((t) => t.lessonTitle?.includes(matchedLesson.title) || (t.page && t.page >= matchedLesson.pageFrom && t.page <= matchedLesson.pageTo)),
            images: imagesList.filter((i) => i.page && i.page >= matchedLesson.pageFrom && i.page <= matchedLesson.pageTo),
            rawTextSnippet: doc.extractedTextSnippet,
          });
        }
      } else {
        // If unanalyzed yet, still include reference with text snippet
        sharedSourceRefs.push({
          sourceId: doc.sourceId,
          documentName: doc.name,
          scope: 'shared',
          isDefault: doc.isDefault,
          confidence: 0.7,
          sections: [],
          formulas: [],
          tables: [],
          images: [],
          rawTextSnippet: doc.extractedTextSnippet || doc.extractedText?.slice(0, 1500),
        });
      }
    }

    // 4. Process Lesson-Specific Sources (Include all content since it belongs directly to this lesson)
    for (const doc of lessonDocs) {
      const rawAnalysis = await this.getAnalysis(doc.id);
      const analysis = rawAnalysis ? normalizeAnalysis(rawAnalysis) : null;
      if (analysis && analysis.status === 'analyzed') {
        const sectionsList = Array.isArray(analysis.sections) && analysis.sections.length > 0 
          ? analysis.sections 
          : (Array.isArray(analysis.lessons) && analysis.lessons[0]?.sections ? analysis.lessons[0].sections : []);
        lessonSourceRefs.push({
          sourceId: doc.sourceId,
          documentName: doc.name,
          scope: 'lesson',
          isDefault: false,
          confidence: analysis.confidence || 0.95,
          sections: sectionsList,
          formulas: Array.isArray(analysis.formulas) ? analysis.formulas : [],
          tables: Array.isArray(analysis.tables) ? analysis.tables : [],
          images: Array.isArray(analysis.images) ? analysis.images : [],
          rawTextSnippet: doc.extractedTextSnippet || doc.extractedText?.slice(0, 2000),
        });
      } else {
        lessonSourceRefs.push({
          sourceId: doc.sourceId,
          documentName: doc.name,
          scope: 'lesson',
          isDefault: false,
          confidence: 0.8,
          sections: [],
          formulas: [],
          tables: [],
          images: [],
          rawTextSnippet: doc.extractedTextSnippet || doc.extractedText?.slice(0, 1500),
        });
      }
    }

    // 5. Aggregate formulas, theorems, and topics
    const allFormulas: string[] = [];
    const allTheorems: string[] = [];
    const allTopics: string[] = [];

    [...sharedSourceRefs, ...lessonSourceRefs].forEach((ref) => {
      ref.formulas.forEach((f) => {
        if (!allFormulas.includes(f.latex)) allFormulas.push(f.latex);
      });
      ref.sections.forEach((s) => {
        if (s.type === 'theorem' || s.type === 'property') {
          if (!allTheorems.includes(s.contentSnippet)) allTheorems.push(s.contentSnippet);
        }
        if (s.keyTerms) {
          s.keyTerms.forEach((term) => {
            if (!allTopics.includes(term)) allTopics.push(term);
          });
        }
      });
    });

    return {
      lessonId,
      lessonTitle,
      subject: subjectId === 'math' ? 'Toán học' : subjectId,
      grade: gradeLevel,
      totalSourcesCount: sharedSourceRefs.length + lessonSourceRefs.length,
      sharedSources: sharedSourceRefs,
      lessonSources: lessonSourceRefs,
      combinedSummary: `Ngữ cảnh bài học tổng hợp từ ${sharedSourceRefs.length} tài liệu SGK/Giáo án chung và ${lessonSourceRefs.length} tài liệu riêng của bài.`,
      allKeyFormulas: allFormulas,
      allKeyTheorems: allTheorems,
      allTopics: allTopics,
      isReadyForPhase3: sharedSourceRefs.length > 0 || lessonSourceRefs.length > 0,
    };
  },
};
