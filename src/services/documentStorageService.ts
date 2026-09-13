import { DocumentSource, DocumentScope, DocumentType, DocumentStats, DocumentFilter } from '../types/documentSource';

const DB_NAME = 'TeacherEducationDocDB_v1';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

// In-memory fallback if IndexedDB is not available
let memoryDocsCache: DocumentSource[] | null = null;

// Initial sample data for secondary school subjects & grades
const INITIAL_SAMPLE_DOCS: DocumentSource[] = [
  // Math Grade 8 - Shared Library
  {
    id: 'doc-math8-sgk-kntt-t1',
    sourceId: 'SGK_TOAN8_KNTT_T1',
    name: 'SGK Toán 8 Tập 1 (Kết nối tri thức với cuộc sống).pdf',
    originalName: 'SGK_Toan_8_Tap_1_KNTT.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 25400000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 8,
    scope: 'shared',
    isDefault: true,
    pageCount: 132,
    wordCount: 39200,
    extractedText: `BỘ GIÁO DỤC VÀ ĐÀO TẠO - TOÁN 8 TẬP 1 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
CHƯƠNG 1: ĐA THỨC
Bài 1: Đơn thức
- Đơn thức là biểu thức đại số chỉ gồm một số, hoặc một biến, hoặc một tích giữa các số và các biến.
- Đơn thức thu gọn là đơn thức chỉ gồm tích của một số với các biến mà mỗi biến chỉ được viết một lần dưới dạng lũy thừa với số mũ nguyên dương.
- Bậc của đơn thức: là tổng các số mũ của tất cả các biến có trong đơn thức đó.
- Hai đơn thức đồng dạng là hai đơn thức có hệ số khác 0 và có cùng phần biến.
- Cộng, trừ đơn thức đồng dạng: cộng (hoặc trừ) các hệ số với nhau và giữ nguyên phần biến.
Bài 2: Đa thức
- Đa thức là một tổng của những đơn thức. Mỗi đơn thức trong tổng gọi là một hạng tử của đa thức đó.
- Đa thức thu gọn là đa thức không chứa hai hạng tử nào đồng dạng.
- Bậc của đa thức là bậc của hạng tử có bậc cao nhất trong dạng thu gọn của đa thức đó.
Bài 3: Phép cộng và phép trừ đa thức
Bài 4: Phép nhân đa thức
Bài 5: Phép chia đa thức cho đơn thức
CHƯƠNG 2: HẰNG ĐẲNG THỨC ĐÁNG NHỚ VÀ ỨNG DỤNG
1. (A + B)^2 = A^2 + 2AB + B^2
2. (A - B)^2 = A^2 - 2AB + B^2
3. A^2 - B^2 = (A - B)(A + B)
4. (A + B)^3 = A^3 + 3A^2B + 3AB^2 + B^3
5. (A - B)^3 = A^3 - 3A^2B + 3AB^2 - B^3
6. A^3 + B^3 = (A + B)(A^2 - AB + B^2)
7. A^3 - B^3 = (A - B)(A^2 + AB + B^2)
CHƯƠNG 3: TỨ GIÁC (Hình thang cân, Hình bình hành, Hình chữ nhật, Hình thoi, Hình vuông)
CHƯƠNG 4: ĐỊNH LÍ THALÈS
CHƯƠNG 5: DỮ LIỆU VÀ BIỂU ĐỒ`,
    extractedTextSnippet: 'Sách giáo khoa Toán 8 Tập 1 - Kết nối tri thức: Chương 1 Đa thức (Đơn thức, Đa thức, Các phép toán), Chương 2 Hằng đẳng thức đáng nhớ, Chương 3 Tứ giác, Chương 4 Định lí Thalès...',
    topics: ['Đơn thức', 'Đa thức', 'Hằng đẳng thức đáng nhớ', 'Tứ giác', 'Định lí Thalès'],
    chapters: ['Chương 1: Đa thức', 'Chương 2: Hằng đẳng thức đáng nhớ và ứng dụng', 'Chương 3: Tứ giác', 'Chương 4: Định lí Thalès'],
    version: 1,
    uploadedBy: 'Thầy Nguyễn Quốc Phong',
    createdAt: Date.now() - 86400000 * 16,
    updatedAt: Date.now() - 86400000 * 16,
  },
  {
    id: 'doc-math8-sgk-kntt-t2',
    sourceId: 'SGK_TOAN8_KNTT_T2',
    name: 'SGK Toán 8 Tập 2 (Kết nối tri thức với cuộc sống).pdf',
    originalName: 'SGK_Toan_8_Tap_2_KNTT.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 24800000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 8,
    scope: 'shared',
    isDefault: true,
    pageCount: 130,
    wordCount: 37800,
    extractedText: `BỘ GIÁO DỤC VÀ ĐÀO TẠO - TOÁN 8 TẬP 2 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
CHƯƠNG 6: PHÂN THỨC ĐẠI SỐ
- Bài 21: Phân thức đại số: Biểu thức dạng \\frac{A}{B} với A, B là các đa thức và B \\neq 0.
- Hai phân thức bằng nhau: \\frac{A}{B} = \\frac{C}{D} \\Leftrightarrow A \\cdot D = B \\cdot C.
- Tính chất cơ bản: \\frac{A}{B} = \\frac{A \\cdot M}{B \\cdot M}; \\frac{A}{B} = \\frac{A : N}{B : N}. Rút gọn phân thức đại số.
- Bài 22: Phép cộng và phép trừ phân thức đại số (Cùng mẫu, khác mẫu quy đồng).
- Bài 23: Phép nhân và phép chia phân thức đại số.
CHƯƠNG 7: PHƯƠNG TRÌNH BẬC NHẤT VÀ HÀM SỐ BẬC NHẤT
- Bài 25: Phương trình bậc nhất một ẩn: ax + b = 0 (a \\neq 0) \\Leftrightarrow x = -\\frac{b}{a}.
- Bài 26: Giải bài toán bằng cách lập phương trình (Toán chuyển động s = v \\cdot t, toán năng suất, hình học).
- Bài 27: Khái niệm hàm số và đồ thị của hàm số.
- Bài 28: Hàm số bậc nhất y = ax + b (a \\neq 0). Tính đồng biến (a > 0) và nghịch biến (a < 0).
- Bài 29: Hệ số góc của đường thẳng y = ax + b. Hai đường thẳng song song, cắt nhau, trùng nhau.
CHƯƠNG 8: MỞ ĐẦU VỀ TÍNH XÁC SUẤT CỦA BIẾN CỐ
- Bài 30: Kết quả có thể và kết quả thuận lợi.
- Bài 31: Cách tính xác suất của biến cố bằng tỉ số P(A) = \\frac{n(A)}{n(\\Omega)}.
CHƯƠNG 9: TAM GIÁC ĐỒNG DẠNG
- Bài 33: Hai tam giác đồng dạng (\\Delta ABC \\backsim \\Delta A'B'C'). Tỉ số đồng dạng k.
- Bài 34: Ba trường hợp đồng dạng của hai tam giác: c-c-c, c-g-c, g-c-g.
- Bài 35: Định lí Pythagore và các trường hợp đồng dạng của tam giác vuông.
- Bài 36: Các hình đồng dạng trong thực tiễn.
CHƯƠNG 10: MỘT SỐ HÌNH KHỐI TRONG THỰC TIỄN
- Bài 38: Hình chóp tam giác đều.
- Bài 39: Hình chóp tứ giác đều.
- Diện tích xung quanh S_{xq} = p \\cdot d (nửa chu vi đáy nhân trung đoạn). Thể tích V = \\frac{1}{3} S_{\\text{đáy}} \\cdot h.`,
    extractedTextSnippet: 'Sách giáo khoa Toán 8 Tập 2 - Kết nối tri thức: Chương 6 Phân thức đại số, Chương 7 Phương trình bậc nhất & Hàm số bậc nhất, Chương 8 Xác suất của biến cố, Chương 9 Tam giác đồng dạng, Chương 10 Hình chóp tam giác đều & chóp tứ giác đều...',
    topics: ['Phân thức đại số', 'Rút gọn phân thức', 'Phương trình bậc nhất', 'Hàm số bậc nhất', 'Hệ số góc', 'Tam giác đồng dạng', 'Hình chóp đều', 'Xác suất'],
    chapters: ['Chương 6: Phân thức đại số', 'Chương 7: Phương trình bậc nhất và hàm số bậc nhất', 'Chương 8: Xác suất của biến cố', 'Chương 9: Tam giác đồng dạng', 'Chương 10: Một số hình khối trong thực tiễn'],
    version: 1,
    uploadedBy: 'Thầy Nguyễn Quốc Phong',
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 15,
  },
  {
    id: 'doc-math8-giao-an',
    sourceId: 'GIAO_AN_TOAN8_5512',
    name: 'Giáo án Toán 8 cả năm chuẩn Công văn 5512.docx',
    originalName: 'Giao_An_Toan_8_NamHoc2024_2025.docx',
    type: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 4620000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 8,
    scope: 'shared',
    isDefault: true,
    pageCount: 310,
    wordCount: 89000,
    extractedText: `KẾ HOẠCH BÀI DẠY MÔN TOÁN LỚP 8 — CHUẨN CÔNG VĂN 5512/BGDĐT-GDTrH
CẤU TRÚC KẾ HOẠCH DẠY HỌC 4 HOẠT ĐỘNG:
I. MỤC TIÊU:
1. Về kiến thức: Nhận biết, vận dụng các khái niệm và định lí.
2. Về năng lực: Năng lực tư duy và lập luận toán học, năng lực mô hình hóa toán học, năng lực giải quyết vấn đề toán học.
3. Về phẩm chất: Chăm chỉ, trách nhiệm, trung thực.
II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU:
- Giáo viên: SGK, máy chiếu, thước đo góc, phiếu học tập, phần mềm tương tác / trò chơi trắc nghiệm.
- Học sinh: SGK, vở ghi, đồ dùng học tập.
III. TIẾN TRÌNH DẠY HỌC:
- Hoạt động 1: Khởi động / Mở đầu (5 phút)
- Hoạt động 2: Hình thành kiến thức mới / Khám phá (20 phút)
- Hoạt động 3: Luyện tập (12 phút)
- Hoạt động 4: Vận dụng và mở rộng (8 phút)`,
    extractedTextSnippet: 'Kế hoạch bài dạy (Giáo án) môn Toán lớp 8 cả năm chuẩn theo công văn 5512 đầy đủ 4 hoạt động: Khởi động, Khám phá kiến thức, Luyện tập, Vận dụng...',
    topics: ['Kế hoạch bài dạy', 'Công văn 5512', 'Mục tiêu phẩm chất năng lực', 'Tiến trình 4 hoạt động'],
    version: 1,
    uploadedBy: 'Thầy Nguyễn Quốc Phong',
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'doc-math8-ppct',
    sourceId: 'PPCT_TOAN8',
    name: 'Phân phối chương trình môn Toán 8 (140 tiết).docx',
    originalName: 'PPCT_Toan8_140tiet.docx',
    type: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 780000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 8,
    scope: 'shared',
    isDefault: false,
    pageCount: 14,
    wordCount: 4200,
    extractedText: `KHUNG KẾ HOẠCH DẠY HỌC MÔN TOÁN LỚP 8 - NĂM HỌC 2024 - 2025
Tổng số tiết: 140 tiết (Học kì I: 18 tuần x 4 tiết = 72 tiết; Học kì II: 17 tuần x 4 tiết = 68 tiết).
HỌC KÌ I:
- Tuần 1-3: Đơn thức và đa thức nhiều biến (8 tiết)
- Tuần 4-6: Các hằng đẳng thức đáng nhớ (10 tiết)
- Tuần 7-9: Phân tích đa thức thành nhân tử (8 tiết)
- Tuần 10: Kiểm tra giữa kì I (2 tiết)
- Tuần 11-14: Tứ giác, hình thang cân, hình bình hành, hình thoi, hình chữ nhật, hình vuông (14 tiết)
- Tuần 15-17: Định lí Pythagore và tam giác vuông (8 tiết)
- Tuần 18: Ôn tập và kiểm tra cuối kì I`,
    extractedTextSnippet: 'Phân phối chương trình môn Toán 8 tổng số 140 tiết phân bổ theo tuần học kì 1 và học kì 2 theo chương trình GDPT 2018...',
    topics: ['Phân phối chương trình', 'Kế hoạch dạy học', 'Thời lượng tiết học'],
    version: 1,
    uploadedBy: 'Tổ Chuyên môn Toán - Tin',
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'doc-math8-tltk',
    sourceId: 'TLTK_TOAN8_HINH',
    name: 'Tài liệu Chuyên đề Tứ giác và Định lí Pythagore.pdf',
    originalName: 'ChuyenDe_TuGiac_Pythagore.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 5320000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 8,
    scope: 'shared',
    isDefault: false,
    pageCount: 45,
    wordCount: 12500,
    extractedText: `CHUYÊN ĐỀ HÌNH HỌC 8: TỨ GIÁC VÀ ĐỊNH LÍ PYTHAGORE
Phần 1: Tổng các góc của một tứ giác luôn bằng 360 độ.
Phần 2: Hình thang cân - Dấu hiệu nhận biết và tính chất đường chéo, cạnh bên.
Phần 3: Hình bình hành - Tính chất các cạnh đối song song và bằng nhau, hai đường chéo cắt nhau tại trung điểm của mỗi đường.
Phần 4: Hình chữ nhật, hình thoi, hình vuông.
Phần 5: Định lí Pythagore: Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông (a^2 + b^2 = c^2).`,
    extractedTextSnippet: 'Tài liệu chuyên đề hình học 8 nâng cao tổng hợp các dạng bài toán tứ giác, chứng minh hình học và vận dụng định lí Pythagore...',
    topics: ['Tứ giác', 'Hình thang cân', 'Hình bình hành', 'Định lí Pythagore'],
    version: 1,
    uploadedBy: 'Thầy Nguyễn Quốc Phong',
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
  },

  // Math Grade 8 - Specific Lesson Documents (Lesson 1: Đơn thức nhiều biến)
  {
    id: 'doc-lesson-math8-b1-phieu-bt',
    sourceId: 'PHIEU_BT_DONTHUC_B1',
    name: 'Phiếu học tập phân hóa: Đơn thức và Bậc của đơn thức.docx',
    originalName: 'Phieu_Hoc_Tap_Don_Thuc_Lop8_Bai1.docx',
    type: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1250000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 8,
    scope: 'lesson',
    lessonId: 'lesson-math8-b1',
    lessonTitle: 'Bài 1: Đơn thức nhiều biến. Đa thức nhiều biến',
    isDefault: false,
    pageCount: 4,
    wordCount: 1450,
    extractedText: `PHIẾU HỌC TẬP SỐ 1: ĐƠN THỨC NHIỀU BIẾN
Họ và tên học sinh: ....................................... Lớp: 8A...
Mức độ 1 (Nhận biết): Trong các biểu thức sau, biểu thức nào là đơn thức?
a) -3x^2y
b) 2x + 3y
c) 5/x
d) (1/2)xy^3z
Mức độ 2 (Thông hiểu): Thu gọn và tìm bậc của đơn thức:
A = (-2x^2y) * (3xy^3z)
B = (1/3 x^2 y)^2 * (-9xy)
Mức độ 3 (Vận dụng): Tính giá trị của đơn thức P = -2x^3y^2 khi x = -1, y = 2.
Mức độ 4 (Vận dụng cao): Cho đơn thức M = (a - 2)x^3y^4 (a là hằng số). Tìm a để bậc của đơn thức M bằng 7.`,
    extractedTextSnippet: 'Phiếu học tập 4 cấp độ nhận thức dành riêng cho Bài 1 Toán 8: Nhận diện đơn thức, thu gọn đơn thức, tính bậc và tính giá trị biểu thức...',
    topics: ['Đơn thức', 'Thu gọn đơn thức', 'Bậc đơn thức', 'Đơn thức đồng dạng'],
    version: 1,
    uploadedBy: 'Thầy Nguyễn Quốc Phong',
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 8,
  },
  {
    id: 'doc-lesson-math8-b1-so-do',
    sourceId: 'SODO_DONTHUC_B1',
    name: 'Sơ đồ tư duy trực quan Đơn thức và Đa thức.png',
    originalName: 'SoDoTuDuy_DonThuc_DaThuc.png',
    type: 'image',
    mimeType: 'image/png',
    size: 2100000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 8,
    scope: 'lesson',
    lessonId: 'lesson-math8-b1',
    lessonTitle: 'Bài 1: Đơn thức nhiều biến. Đa thức nhiều biến',
    isDefault: false,
    wordCount: 120,
    extractedText: `Sơ đồ tư duy Bài 1 Toán 8:
1. Đơn thức: Khái niệm -> Thu gọn (Hệ số x Phần biến) -> Bậc (Tổng các số mũ) -> Đơn thức đồng dạng.
2. Đa thức: Tổng các đơn thức -> Hạng tử -> Thu gọn đa thức -> Bậc của đa thức (Bậc của hạng tử có bậc cao nhất).`,
    extractedTextSnippet: 'Ảnh sơ đồ tư duy hệ thống hóa toàn bộ kiến thức Bài 1: Khái niệm, công thức thu gọn, quy tắc cộng trừ đơn thức đồng dạng...',
    topics: ['Sơ đồ tư duy', 'Hệ thống hóa kiến thức'],
    version: 1,
    uploadedBy: 'Thầy Nguyễn Quốc Phong',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
  },

  // Math Grade 6 KNTT Shared Textbooks
  {
    id: 'doc-math6-sgk-kntt-t1',
    sourceId: 'SGK_TOAN6_KNTT_T1',
    name: 'SGK Toán 6 Tập 1 (Kết nối tri thức với cuộc sống).pdf',
    originalName: 'SGK_Toan_6_Tap_1_KNTT.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 21800000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 6,
    scope: 'shared',
    isDefault: true,
    pageCount: 124,
    wordCount: 33500,
    extractedText: `BỘ GIÁO DỤC VÀ ĐÀO TẠO - TOÁN 6 TẬP 1 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
CHƯƠNG 1: TẬP HỢP CÁC SỐ TỰ NHIÊN
- Bài 1: Tập hợp. Phần tử của tập hợp (Kí hiệu thuộc \\in, không thuộc \\notin).
- Bài 2: Cách ghi số tự nhiên. Hệ thập phân, số La Mã.
- Bài 3: Thứ tự trong tập hợp các số tự nhiên.
- Bài 4: Phép cộng và phép trừ số tự nhiên.
- Bài 5: Phép nhân và phép chia số tự nhiên.
- Bài 6: Lũy thừa với số mũ tự nhiên (a^n = a \\cdot a \\dots a). Nhân và chia hai lũy thừa cùng cơ số.
- Bài 7: Thứ tự thực hiện các phép tính.
CHƯƠNG 2: TÍNH CHIA HẾT TRONG TẬP HỢP CÁC SỐ TỰ NHIÊN
- Bài 8: Quan hệ chia hết và tính chất chia hết (a \\vdots b).
- Bài 9: Dấu hiệu chia hết cho 2, cho 5, cho 3, cho 9.
- Bài 10: Số nguyên tố. Hợp số. Phân tích một số ra thừa số nguyên tố.
- Bài 11: Ước chung. Ước chung lớn nhất (ƯCLN).
- Bài 12: Bội chung. Bội chung nhỏ nhất (BCNN).
CHƯƠNG 3: SỐ NGUYÊN
- Bài 13: Tập hợp các số nguyên (Số nguyên âm, tập hợp \\mathbb{Z} = \\{..., -2, -1, 0, 1, 2, ...\\}). Trục số nguyên.
- Bài 14: Phép cộng và phép trừ hai số nguyên. Quy tắc dấu ngoặc.
- Bài 15: Phép nhân và phép chia hết hai số nguyên. Bội và ước của một số nguyên.
CHƯƠNG 4: MỘT SỐ HÌNH PHẲNG TRONG THỰC TIỄN
- Bài 18: Hình tam giác đều. Hình vuông. Hình lục giác đều.
- Bài 19: Hình chữ nhật. Hình thoi. Hình bình hành. Hình thang cân.
- Bài 20: Chu vi và diện tích của một số tứ giác đã học.
CHƯƠNG 5: TÍNH ĐỐI XỨNG CỦA HÌNH PHẲNG TRONG TỰ NHIÊN
- Bài 21: Hình có trục đối xứng.
- Bài 22: Hình có tâm đối xứng.`,
    extractedTextSnippet: 'Sách giáo khoa Toán 6 Tập 1 - Kết nối tri thức với cuộc sống: Tập hợp số tự nhiên, Lũy thừa, Thứ tự phép tính, Chia hết, Số nguyên tố, ƯCLN, BCNN, Tập số nguyên Z, Hình học trực quan (Tam giác đều, Lục giác đều, Hình chữ nhật, Hình thoi)...',
    topics: ['Tập hợp số tự nhiên', 'Lũy thừa', 'Số nguyên tố', 'ƯCLN', 'BCNN', 'Số nguyên Z', 'Hình học trực quan', 'Tính đối xứng'],
    chapters: ['Chương 1: Tập hợp các số tự nhiên', 'Chương 2: Tính chia hết trong tập hợp số tự nhiên', 'Chương 3: Số nguyên', 'Chương 4: Một số hình phẳng trong thực tiễn', 'Chương 5: Tính đối xứng của hình phẳng'],
    version: 1,
    uploadedBy: 'Thầy Nguyễn Quốc Phong',
    createdAt: Date.now() - 86400000 * 18,
    updatedAt: Date.now() - 86400000 * 18,
  },
  {
    id: 'doc-math6-sgk-kntt-t2',
    sourceId: 'SGK_TOAN6_KNTT_T2',
    name: 'SGK Toán 6 Tập 2 (Kết nối tri thức với cuộc sống).pdf',
    originalName: 'SGK_Toan_6_Tap_2_KNTT.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 22400000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 6,
    scope: 'shared',
    isDefault: true,
    pageCount: 128,
    wordCount: 34800,
    extractedText: `BỘ GIÁO DỤC VÀ ĐÀO TẠO - TOÁN 6 TẬP 2 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
CHƯƠNG 6: PHÂN SỐ
- Bài 23: Mở rộng phân số. Phân số bằng nhau.
  Định nghĩa phân số: \\frac{a}{b} (a, b \\in \\mathbb{Z}, b \\neq 0). Hai phân số bằng nhau nếu a \\cdot d = b \\cdot c.
- Bài 24: So sánh phân số. Hỗn số dương.
- Bài 25: Phép cộng và phép trừ phân số.
- Bài 26: Phép nhân và phép chia phân số.
- Bài 27: Hai bài toán về phân số (Tìm giá trị phân số của một số cho trước; Tìm một số biết giá trị phân số của nó).
CHƯƠNG 7: SỐ THẬP PHÂN
- Bài 28: Số thập phân. Các phép tính với số thập phân (Cộng, trừ, nhân, chia).
- Bài 29: Làm tròn số và ước lượng.
- Bài 30: Tỉ số và tỉ số phần trăm.
- Bài 31: Một số bài toán về tỉ số và tỉ số phần trăm.
CHƯƠNG 8: NHỮNG HÌNH HỌC CƠ BẢN
- Bài 32: Điểm và đường thẳng. Ba điểm thẳng hàng.
- Bài 33: Điểm nằm giữa hai điểm. Tia.
- Bài 34: Đoạn thẳng. Độ dài đoạn thẳng. Trung điểm của đoạn thẳng.
- Bài 35: Góc. Các góc đặc biệt (góc vuông, góc nhọn, góc tù, góc bẹt). Số đo góc.
CHƯƠNG 9: DỮ LIỆU VÀ XÁC SUẤT THỰC NGHIỆM
- Bài 38: Dữ liệu và thu thập dữ liệu. Bảng thống kê.
- Bài 39: Biểu đồ tranh. Biểu đồ cột và biểu đồ cột kép.
- Bài 42: Kết quả có thể và sự kiện trong trò chơi, thí nghiệm.
- Bài 43: Xác suất thực nghiệm của một biến cố.`,
    extractedTextSnippet: 'Sách giáo khoa Toán 6 Tập 2 - Kết nối tri thức với cuộc sống: Chương 6 Phân số và các phép tính, Chương 7 Số thập phân và tỉ số phần trăm, Chương 8 Hình học cơ bản (Điểm, Đường thẳng, Đoạn thẳng, Góc), Chương 9 Dữ liệu và Xác suất thực nghiệm...',
    topics: ['Phân số', 'Số thập phân', 'Tỉ số phần trăm', 'Điểm và đường thẳng', 'Đoạn thẳng', 'Góc', 'Biểu đồ cột', 'Xác suất thực nghiệm'],
    chapters: ['Chương 6: Phân số', 'Chương 7: Số thập phân', 'Chương 8: Những hình học cơ bản', 'Chương 9: Dữ liệu và xác suất thực nghiệm'],
    version: 1,
    uploadedBy: 'Thầy Nguyễn Quốc Phong',
    createdAt: Date.now() - 86400000 * 17,
    updatedAt: Date.now() - 86400000 * 17,
  },

  // Math Grade 7 KNTT Shared Textbooks
  {
    id: 'doc-math7-sgk-kntt-t1',
    sourceId: 'SGK_TOAN7_KNTT_T1',
    name: 'SGK Toán 7 Tập 1 (Kết nối tri thức với cuộc sống).pdf',
    originalName: 'SGK_Toan_7_Tap_1_KNTT.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 24200000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 7,
    scope: 'shared',
    isDefault: true,
    pageCount: 132,
    wordCount: 36200,
    extractedText: `BỘ GIÁO DỤC VÀ ĐÀO TẠO - TOÁN 7 TẬP 1 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
CHƯƠNG 1: SỐ HỮU TỈ
- Bài 1: Tập hợp các số hữu tỉ \\mathbb{Q} (Số hữu tỉ là số viết được dưới dạng \\frac{a}{b} với a, b \\in \\mathbb{Z}, b \\neq 0).
- Bài 2: Cộng, trừ, nhân, chia số hữu tỉ.
- Bài 3: Lũy thừa với số mũ tự nhiên của một số hữu tỉ: x^m \\cdot x^n = x^{m+n}; (x^m)^n = x^{m \\cdot n}; (x \\cdot y)^n = x^n \\cdot y^n.
- Bài 4: Quy tắc dấu ngoặc và quy tắc chuyển vế: Khi chuyển vế một số hạng từ vế này sang vế kia ta phải đổi dấu số hạng đó.
CHƯƠNG 2: SỐ THỰC
- Bài 5: Làm quen với số thập phân vô hạn tuần hoàn.
- Bài 6: Số vô tỉ. Căn bậc hai số học: \\sqrt{a} = x \\Leftrightarrow x \\geq 0 \\text{ và } x^2 = a.
- Bài 7: Tập hợp các số thực \\mathbb{R}. Trục số thực. Giá trị tuyệt đối của một số thực |x|.
CHƯƠNG 3: GÓC VÀ HAI ĐƯỜNG THẲNG SONG SONG
- Bài 8: Góc ở vị trí đặc biệt (Hai góc kề bù, hai góc đối đỉnh). Tia phân giác của một góc.
- Bài 9: Hai đường thẳng song song và dấu hiệu nhận biết (Góc so le trong, đồng vị, trong cùng phía).
- Bài 10: Tiên đề Euclid về đường thẳng song song. Tính chất hai đường thẳng song song.
- Bài 11: Định lí và chứng minh định lí (Giả thiết và kết luận).
CHƯƠNG 4: TAM GIÁC BẰNG NHAU
- Bài 12: Tổng các góc trong một tam giác (Tổng ba góc bằng 180^\\circ).
- Bài 13: Hai tam giác bằng nhau. Trường hợp bằng nhau thứ nhất: Cạnh - Cạnh - Cạnh (c-c-c).
- Bài 14: Trường hợp bằng nhau thứ hai và thứ ba: Cạnh - Góc - Cạnh (c-g-c) và Góc - Cạnh - Góc (g-c-g).
- Bài 15: Các trường hợp bằng nhau của tam giác vuông.
- Bài 16: Tam giác cân. Đường trung trực của đoạn thẳng.
CHƯƠNG 5: THU THẬP VÀ BIỂU DIỄN DỮ LIỆU
- Bài 17: Thu thập và phân loại dữ liệu.
- Bài 18: Biểu đồ hình quạt tròn.
- Bài 19: Biểu đồ đoạn thẳng.`,
    extractedTextSnippet: 'Sách giáo khoa Toán 7 Tập 1 - Kết nối tri thức với cuộc sống: Chương 1 Số hữu tỉ, Chương 2 Số thực & Căn bậc hai số học, Chương 3 Góc & Hai đường thẳng song song, Chương 4 Tam giác bằng nhau (c-c-c, c-g-c, g-c-g), Chương 5 Thu thập và biểu diễn dữ liệu...',
    topics: ['Số hữu tỉ', 'Số thực', 'Căn bậc hai số học', 'Hai đường thẳng song song', 'Tam giác bằng nhau', 'Tam giác cân', 'Biểu đồ hình quạt tròn'],
    chapters: ['Chương 1: Số hữu tỉ', 'Chương 2: Số thực', 'Chương 3: Góc và hai đường thẳng song song', 'Chương 4: Tam giác bằng nhau', 'Chương 5: Thu thập và biểu diễn dữ liệu'],
    version: 1,
    uploadedBy: 'Thầy Nguyễn Quốc Phong',
    createdAt: Date.now() - 86400000 * 16,
    updatedAt: Date.now() - 86400000 * 16,
  },
  {
    id: 'doc-math7-sgk-kntt-t2',
    sourceId: 'SGK_TOAN7_KNTT_T2',
    name: 'SGK Toán 7 Tập 2 (Kết nối tri thức với cuộc sống).pdf',
    originalName: 'SGK_Toan_7_Tap_2_KNTT.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 23900000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 7,
    scope: 'shared',
    isDefault: true,
    pageCount: 128,
    wordCount: 35100,
    extractedText: `BỘ GIÁO DỤC VÀ ĐÀO TẠO - TOÁN 7 TẬP 2 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
CHƯƠNG 6: TỈ LỆ THỨC VÀ ĐẠI LƯỢNG TỈ LỆ
- Bài 20: Tỉ lệ thức \\frac{a}{b} = \\frac{c}{d} \\Leftrightarrow ad = bc.
- Bài 21: Tính chất của dãy tỉ số bằng nhau: \\frac{a}{b} = \\frac{c}{d} = \\frac{e}{f} = \\frac{a+c+e}{b+d+f} = \\frac{a-c+e}{b-d+f}.
- Bài 22: Đại lượng tỉ lệ thuận (y = kx) và Đại lượng tỉ lệ nghịch (y = \\frac{a}{x}).
- Bài 23: Một số bài toán về đại lượng tỉ lệ.
CHƯƠNG 7: BIỂU THỨC ĐẠI SỐ VÀ ĐA THỨC MỘT BIẾN
- Bài 24: Biểu thức đại số. Giá trị của biểu thức đại số.
- Bài 25: Đa thức một biến P(x) = a_n x^n + \\dots + a_1 x + a_0. Nghiệm của đa thức một biến.
- Bài 26: Phép cộng và phép trừ đa thức một biến.
- Bài 27: Phép nhân đa thức một biến.
- Bài 28: Phép chia đa thức một biến.
CHƯƠNG 8: LÀM QUEN VỚI BIẾN CỐ VÀ XÁC SUẤT CỦA BIẾN CỐ
- Bài 29: Biến cố ngẫu nhiên, biến cố chắc chắn, biến cố không thể.
- Bài 30: Xác suất của biến cố trong một số trò chơi đơn giản (Gieo xúc xắc, tung đồng xu).
CHƯƠNG 9: QUAN HỆ GIỮA CÁC YẾU TỐ TRONG MỘT TAM GIÁC
- Bài 31: Quan hệ giữa góc và cạnh đối diện trong một tam giác.
- Bài 32: Quan hệ giữa đường vuông góc và đường xiên.
- Bài 33: Bất đẳng thức tam giác: |b - c| < a < b + c.
- Bài 34: Sự đồng quy của ba đường trung tuyến trong tam giác (Trọng tâm G, AG = \\frac{2}{3}AM).
- Bài 35: Sự đồng quy của ba đường phân giác, ba đường trung trực, ba đường cao.
CHƯƠNG 10: MỘT SỐ HÌNH KHỐI TRONG THỰC TIỄN
- Bài 36: Hình hộp chữ nhật và hình lập phương.
- Bài 37: Hình lăng trụ đứng tam giác và hình lăng trụ đứng tứ giác.
- Thể tích V = S_{\\text{đáy}} \\cdot h; Diện tích xung quanh S_{xq} = C_{\\text{đáy}} \\cdot h.`,
    extractedTextSnippet: 'Sách giáo khoa Toán 7 Tập 2 - Kết nối tri thức với cuộc sống: Chương 6 Tỉ lệ thức và dãy tỉ số bằng nhau, Chương 7 Biểu thức đại số & Đa thức một biến, Chương 8 Xác suất biến cố, Chương 9 Các đường đồng quy trong tam giác (Trọng tâm, Trực tâm), Chương 10 Hình lăng trụ đứng...',
    topics: ['Tỉ lệ thức', 'Dãy tỉ số bằng nhau', 'Đa thức một biến', 'Nghiệm của đa thức', 'Xác suất biến cố', 'Quan hệ trong tam giác', 'Trọng tâm tam giác', 'Hình lăng trụ đứng'],
    chapters: ['Chương 6: Tỉ lệ thức và đại lượng tỉ lệ', 'Chương 7: Biểu thức đại số và đa thức một biến', 'Chương 8: Xác suất của biến cố', 'Chương 9: Quan hệ giữa các yếu tố trong tam giác', 'Chương 10: Một số hình khối trong thực tiễn'],
    version: 1,
    uploadedBy: 'Thầy Nguyễn Quốc Phong',
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 15,
  },
  {
    id: 'doc-math7-sgk-cd-t1',
    sourceId: 'SGK_TOAN7_CD_T1',
    name: 'SGK Toán 7 Tập 1 (Cánh Diều).pdf',
    originalName: 'SGK_Toan_7_Tap_1_CanhDieu.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 23400000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 7,
    scope: 'shared',
    isDefault: false,
    pageCount: 130,
    wordCount: 35600,
    extractedText: `BỘ GIÁO DỤC VÀ ĐÀO TẠO - TOÁN 7 TẬP 1 (CÁNH DIỀU)
CHƯƠNG 1: SỐ HỮU TỈ (Tập hợp Q, cộng trừ nhân chia số hữu tỉ, lũy thừa của một số hữu tỉ).
CHƯƠNG 2: SỐ THỰC (Số vô tỉ, căn bậc hai số học, tập hợp R, giá trị tuyệt đối của một số thực).
CHƯƠNG 3: HÌNH HỌC TRỰC QUAN (Hình lăng trụ đứng tam giác, hình lăng trụ đứng tứ giác).
CHƯƠNG 4: GÓC VÀ ĐƯỜNG THẲNG SONG SONG (Góc ở vị trí đặc biệt, tia phân giác của một góc, hai đường thẳng song song).`,
    extractedTextSnippet: 'Sách giáo khoa Toán 7 Tập 1 (Cánh Diều): Số hữu tỉ, Số thực và Căn bậc hai, Hình lăng trụ đứng, Hai đường thẳng song song...',
    topics: ['Số hữu tỉ', 'Số thực', 'Căn bậc hai', 'Hình lăng trụ', 'Đường thẳng song song'],
    version: 1,
    uploadedBy: 'Thầy Lê Hoàng Nam',
    createdAt: Date.now() - 86400000 * 16,
    updatedAt: Date.now() - 86400000 * 16,
  },

  // Math Grade 9 KNTT Shared Textbooks
  {
    id: 'doc-math9-sgk-kntt-t1',
    sourceId: 'SGK_TOAN9_KNTT_T1',
    name: 'SGK Toán 9 Tập 1 (Kết nối tri thức với cuộc sống).pdf',
    originalName: 'SGK_Toan_9_Tap_1_KNTT.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 26200000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 9,
    scope: 'shared',
    isDefault: true,
    pageCount: 144,
    wordCount: 42500,
    extractedText: `BỘ GIÁO DỤC VÀ ĐÀO TẠO - TOÁN 9 TẬP 1 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
CHƯƠNG 1: PHƯƠNG TRÌNH VÀ HỆ HAI PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN
- Khái niệm phương trình bậc nhất hai ẩn ax + by = c (a, b không đồng thời bằng 0).
- Hệ hai phương trình bậc nhất hai ẩn.
- Các phương pháp giải hệ: Phương pháp thế, Phương pháp cộng đại số.
- Giải bài toán bằng cách lập hệ phương trình (toán chuyển động, năng suất, quan hệ hình học).
CHƯƠNG 2: PHƯƠNG TRÌNH VÀ BẤT PHƯƠNG TRÌNH BẬC NHẤT MỘT ẨN
- Phương trình quy về phương trình bậc nhất một ẩn.
- Bất đẳng thức và tính chất. Bất phương trình bậc nhất một ẩn.
CHƯƠNG 3: CĂN BẬC HAI VÀ CĂN BẬC BA
- Căn bậc hai số học và tính chất (\\sqrt{A \\cdot B} = \\sqrt{A} \\cdot \\sqrt{B}; \\sqrt{\\frac{A}{B}} = \\frac{\\sqrt{A}}{\\sqrt{B}}).
- Trục căn thức ở mẫu và rút gọn biểu thức chứa căn thức bậc hai.
- Căn bậc ba.
CHƯƠNG 4: HỆ THỨC LƯỢNG TRONG TAM GIÁC VUÔNG
- Tỉ số lượng giác của góc nhọn (\\sin, \\cos, \\tan, \\cot).
- Một số hệ thức về cạnh và góc trong tam giác vuông (a = b \\cdot \\sin B = c \\cdot \\tan B). Ứng dụng thực tế.
CHƯƠNG 5: ĐƯỜNG TRÒN
- Khái niệm đường tròn, tính chất đối xứng của đường tròn.
- Đường kính và dây cung. Vị trí tương đối của hai đường tròn.
- Tiếp tuyến của đường tròn và tính chất hai tiếp tuyến cắt nhau.`,
    extractedTextSnippet: 'Sách giáo khoa Toán 9 Tập 1 - Kết nối tri thức: Chương 1 Phương trình & Hệ phương trình bậc nhất hai ẩn, Chương 2 Phương trình bậc nhất một ẩn, Chương 3 Căn bậc hai & căn bậc ba, Chương 4 Hệ thức lượng tam giác vuông, Chương 5 Đường tròn...',
    topics: ['Hệ phương trình bậc nhất hai ẩn', 'Căn bậc hai', 'Hệ thức lượng', 'Tỉ số lượng giác', 'Đường tròn', 'Tiếp tuyến'],
    chapters: ['Chương 1: Phương trình và hệ hai phương trình bậc nhất hai ẩn', 'Chương 2: Phương trình và bất phương trình bậc nhất', 'Chương 3: Căn bậc hai và căn bậc ba', 'Chương 4: Hệ thức lượng trong tam giác vuông', 'Chương 5: Đường tròn'],
    version: 1,
    uploadedBy: 'Thầy Nguyễn Quốc Phong',
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'doc-math9-sgk-kntt-t2',
    sourceId: 'SGK_TOAN9_KNTT_T2',
    name: 'SGK Toán 9 Tập 2 (Kết nối tri thức với cuộc sống).pdf',
    originalName: 'SGK_Toan_9_Tap_2_KNTT.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 26800000,
    subjectId: 'math',
    subjectName: 'Toán học',
    gradeLevel: 9,
    scope: 'shared',
    isDefault: true,
    pageCount: 148,
    wordCount: 43600,
    extractedText: `BỘ GIÁO DỤC VÀ ĐÀO TẠO - TOÁN 9 TẬP 2 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
CHƯƠNG 6: HÀM SỐ y = ax^2 (a \\neq 0). PHƯƠNG TRÌNH BẬC HAI MỘT ẨN
- Bài 18: Hàm số y = ax^2 (a \\neq 0). Đồ thị Parabol đối xứng qua trục tung Oy.
- Bài 19: Phương trình bậc hai một ẩn: ax^2 + bx + c = 0 (a \\neq 0).
  Biệt thức \\Delta = b^2 - 4ac.
  + \\Delta > 0: Phương trình có 2 nghiệm phân biệt x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}.
  + \\Delta = 0: Phương trình có nghiệm kép x_1 = x_2 = -\\frac{b}{2a}.
  + \\Delta < 0: Phương trình vô nghiệm.
- Bài 20: Định lí Viète: x_1 + x_2 = -\\frac{b}{a}; x_1 \\cdot x_2 = \\frac{c}{a}.
  Ứng dụng nhẩm nghiệm (a + b + c = 0 \\Rightarrow x_1 = 1, x_2 = \\frac{c}{a}; a - b + c = 0 \\Rightarrow x_1 = -1, x_2 = -\\frac{c}{a}) và tìm hai số biết tổng và tích.
- Bài 21: Giải bài toán bằng cách lập phương trình bậc hai.
CHƯƠNG 7: TẦN SỐ VÀ TẦN SỐ TƯƠNG ĐỐI
- Bài 22: Bảng tần số và biểu đồ tần số (Biểu đồ cột, biểu đồ đoạn thẳng biểu diễn tần số).
- Bài 23: Bảng tần số tương đối và biểu đồ tần số tương đối (Biểu đồ hình quạt tròn, biểu đồ cột).
- Bài 24: Bảng tần số ghép nhóm và biểu đồ tần số ghép nhóm.
CHƯƠNG 8: XÁC SUẤT CỦA BIẾN CỐ TRONG MỘT SỐ MÔ HÌNH XÁC SUẤT ĐƠN GIẢN
- Phép thử ngẫu nhiên, không gian mẫu, biến cố đồng khả năng, mô hình xác suất hình học.
CHƯƠNG 9: ĐƯỜNG TRÒN NGOẠI TIẾP VÀ ĐƯỜNG TRÒN NỘI TIẾP
- Bài 27: Đường tròn ngoại tiếp tam giác. Đường tròn nội tiếp tam giác.
- Bài 28: Tứ giác nội tiếp đường tròn. Dấu hiệu nhận biết: Tổng hai góc đối diện bằng 180^\\circ; hai đỉnh kề cùng nhìn một cạnh dưới góc bằng nhau.
- Bài 29: Đa giác đều. Độ dài cung tròn l = \\frac{\\pi R n}{180}; Diện tích hình quạt tròn S = \\frac{\\pi R^2 n}{360}.
CHƯƠNG 10: MỘT SỐ HÌNH KHỐI TRONG THỰC TIỄN
- Bài 30: Hình trụ. Diện tích xung quanh S_{xq} = 2\\pi Rh, Thể tích V = \\pi R^2 h.
- Bài 31: Hình nón. S_{xq} = \\pi R l, Thể tích V = \\frac{1}{3} \\pi R^2 h.
- Bài 32: Hình cầu. Diện tích mặt cầu S = 4\\pi R^2, Thể tích hình cầu V = \\frac{4}{3} \\pi R^3.`,
    extractedTextSnippet: 'Sách giáo khoa Toán 9 Tập 2 - Kết nối tri thức với cuộc sống: Chương 6 Hàm số y = ax^2 & Phương trình bậc hai một ẩn, Định lí Viète, Chương 7 Tần số và tần số tương đối, Chương 8 Xác suất biến cố, Chương 9 Tứ giác nội tiếp & Đường tròn ngoại tiếp, Chương 10 Hình trụ, Hình nón, Hình cầu...',
    topics: ['Hàm số y = ax^2', 'Phương trình bậc hai', 'Định lí Viète', 'Tứ giác nội tiếp', 'Đường tròn ngoại tiếp', 'Hình trụ', 'Hình nón', 'Hình cầu', 'Bảng tần số'],
    chapters: ['Chương 6: Hàm số y = ax^2 và Phương trình bậc hai một ẩn', 'Chương 7: Tần số và tần số tương đối', 'Chương 8: Xác suất của biến cố', 'Chương 9: Đường tròn ngoại tiếp và nội tiếp', 'Chương 10: Một số hình khối trong thực tiễn'],
    version: 1,
    uploadedBy: 'Thầy Nguyễn Quốc Phong',
    createdAt: Date.now() - 86400000 * 11,
    updatedAt: Date.now() - 86400000 * 11,
  },

  // Natural Science Grade 8 Shared
  {
    id: 'doc-science8-sgk',
    sourceId: 'SGK_KHTN8_KNTT',
    name: 'SGK Khoa học tự nhiên 8 (Kết nối tri thức).pdf',
    originalName: 'SGK_KHTN_8_KNTT.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    size: 28400000,
    subjectId: 'natural_science',
    subjectName: 'Khoa học tự nhiên',
    gradeLevel: 8,
    scope: 'shared',
    isDefault: true,
    pageCount: 180,
    wordCount: 52000,
    extractedText: `KHOA HỌC TỰ NHIÊN 8
CHỦ ĐỀ 1: PHẢN ỨNG HÓA HỌC (Biến đổi hóa học, Phản ứng hóa học, Định luật bảo toàn khối lượng, Mol và tỉ khối của chất khí).
CHỦ ĐỀ 2: MỘT SỐ HỢP CHẤT THÔNG DỤNG (Acid, Base, Oxide, Muối, Thang pH).
CHỦ ĐỀ 3: KHỐI LƯỢNG RIÊNG VÀ ÁP SUẤT (Khối lượng riêng, Áp suất, Áp suất chất lỏng, Lực đẩy Archimedes).
CHỦ ĐỀ 4: TÁC DỤNG LÀM QUAY CỦA LỰC (Moment lực, Đòn bẩy).
CHỦ ĐỀ 5: ĐIỆN (Dòng điện, Mạch điện, Tác dụng của dòng điện).
CHỦ ĐỀ 6: SINH HỌC CƠ THỂ NGƯỜI (Hệ vận động, Hệ tuần hoàn, Hệ hô hấp, Hệ bài tiết, Hệ thần kinh).`,
    extractedTextSnippet: 'SGK Khoa học tự nhiên 8: Phản ứng hóa học, Khối lượng riêng & Áp suất, Đòn bẩy, Dòng điện và Cơ thể người...',
    topics: ['Phản ứng hóa học', 'Acid - Base - Muối', 'Áp suất', 'Lực đẩy Archimedes', 'Hệ tuần hoàn'],
    version: 1,
    uploadedBy: 'Cô Phạm Bích Ngọc',
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 12,
  },
];

// Open IndexedDB database safely
function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('subject_grade', ['subjectId', 'gradeLevel'], { unique: false });
          store.createIndex('scope', 'scope', { unique: false });
          store.createIndex('lessonId', 'lessonId', { unique: false });
          store.createIndex('isDefault', 'isDefault', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (err) => {
        console.warn('IndexedDB open error:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB not supported:', e);
      resolve(null);
    }
  });
}

// Helper to filter out any "Chân trời sáng tạo" textbooks
const isCTSTDoc = (d: DocumentSource) =>
  d.id === 'doc-math8-sgk-t1' ||
  d.id === 'doc-math8-sgk-t2' ||
  d.id === 'doc-math9-sgk-t1' ||
  d.sourceId === 'SGK_TOAN8_T1' ||
  d.sourceId === 'SGK_TOAN8_T2' ||
  d.sourceId === 'SGK_TOAN9_T1' ||
  Boolean(d.name && d.name.toLowerCase().includes('chân trời')) ||
  Boolean(d.originalName && d.originalName.toLowerCase().includes('ctst'));

export const documentStorageService = {
  // Initialize Database & Seed initial sample docs
  async init(): Promise<void> {
    if (memoryDocsCache !== null) return;

    try {
      const db = await openDB();
      if (!db) {
        // Fallback to localStorage
        const stored = localStorage.getItem(DB_NAME);
        if (stored) {
          try {
            const parsed: DocumentSource[] = JSON.parse(stored);
            memoryDocsCache = parsed.filter((d) => !isCTSTDoc(d));
            localStorage.setItem(DB_NAME, JSON.stringify(memoryDocsCache));
          } catch {
            memoryDocsCache = [...INITIAL_SAMPLE_DOCS];
            localStorage.setItem(DB_NAME, JSON.stringify(memoryDocsCache));
          }
        } else {
          memoryDocsCache = [...INITIAL_SAMPLE_DOCS];
          localStorage.setItem(DB_NAME, JSON.stringify(memoryDocsCache));
        }
        return;
      }

      // Check count in IndexedDB
      const count = await new Promise<number>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const countReq = store.count();
        countReq.onsuccess = () => resolve(countReq.result);
        countReq.onerror = () => resolve(0);
      });

      if (count === 0) {
        // Seed initial data
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const doc of INITIAL_SAMPLE_DOCS) {
          store.put(doc);
        }
        await new Promise((resolve) => {
          tx.oncomplete = resolve;
          tx.onerror = resolve;
        });
      }

      // Load all into memoryDocsCache for high-speed access
      const allDocs = await new Promise<DocumentSource[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.getAll();
        getReq.onsuccess = () => resolve(getReq.result || []);
        getReq.onerror = () => resolve([...INITIAL_SAMPLE_DOCS]);
      });

      // Purge any legacy CTST documents from IndexedDB
      const ctstDocs = allDocs.filter(isCTSTDoc);
      if (ctstDocs.length > 0) {
        try {
          const delTx = db.transaction(STORE_NAME, 'readwrite');
          const delStore = delTx.objectStore(STORE_NAME);
          for (const d of ctstDocs) {
            delStore.delete(d.id);
          }
        } catch (err) {
          console.warn('Error purging legacy CTST docs from IndexedDB:', err);
        }
      }

      const filteredDocs = allDocs.filter((d) => !isCTSTDoc(d));

      // Ensure all INITIAL_SAMPLE_DOCS (e.g. newly added KNTT 6, 7, 8, 9 books) are present in the warehouse
      const missingInitialDocs = INITIAL_SAMPLE_DOCS.filter(
        (initDoc) => !filteredDocs.some((d) => d.id === initDoc.id || d.sourceId === initDoc.sourceId)
      );
      if (missingInitialDocs.length > 0) {
        try {
          const addTx = db.transaction(STORE_NAME, 'readwrite');
          const addStore = addTx.objectStore(STORE_NAME);
          for (const doc of missingInitialDocs) {
            addStore.put(doc);
            filteredDocs.push(doc);
          }
        } catch (err) {
          console.warn('Error upserting missing initial docs to IndexedDB:', err);
          filteredDocs.push(...missingInitialDocs);
        }
      }

      memoryDocsCache = filteredDocs.length > 0 ? filteredDocs : [...INITIAL_SAMPLE_DOCS];
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(DB_NAME, JSON.stringify(memoryDocsCache));
        } catch {
          // Ignore quota error
        }
      }
    } catch (e) {
      console.warn('Document storage init fallback:', e);
      memoryDocsCache = [...INITIAL_SAMPLE_DOCS];
    }
  },

  // Save to persistence
  async persistDoc(doc: DocumentSource): Promise<void> {
    try {
      const db = await openDB();
      if (db) {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(doc);
      }
      if (typeof window !== 'undefined' && window.localStorage && memoryDocsCache) {
        try {
          localStorage.setItem(DB_NAME, JSON.stringify(memoryDocsCache));
        } catch {
          // Ignore localStorage quota error if files are large
        }
      }
    } catch (err) {
      console.warn('Persist error:', err);
    }
  },

  // Delete from persistence
  async removePersistedDoc(id: string): Promise<void> {
    try {
      const db = await openDB();
      if (db) {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
      }
      if (typeof window !== 'undefined' && window.localStorage && memoryDocsCache) {
        try {
          localStorage.setItem(DB_NAME, JSON.stringify(memoryDocsCache));
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      console.warn('Remove persist error:', err);
    }
  },

  // 1. Get Shared Documents for a Subject + Grade
  async getSharedDocuments(subjectId: string, gradeLevel: number): Promise<DocumentSource[]> {
    await this.init();
    if (!memoryDocsCache) return [];

    return memoryDocsCache.filter(
      (d) => d.subjectId === subjectId && Number(d.gradeLevel) === Number(gradeLevel) && d.scope === 'shared'
    ).sort((a, b) => {
      // Sort default sources first, then by date desc
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return b.createdAt - a.createdAt;
    });
  },

  // 2. Get Lesson-Specific Documents for a Lesson
  async getLessonDocuments(subjectId: string, gradeLevel: number, lessonId: string): Promise<DocumentSource[]> {
    await this.init();
    if (!memoryDocsCache) return [];

    return memoryDocsCache.filter(
      (d) => d.scope === 'lesson' && d.lessonId === lessonId
    ).sort((a, b) => b.createdAt - a.createdAt);
  },

  // 3. Get Combined Sources for a Lesson (Inherited Default Shared + Lesson Specific)
  async getEffectiveDocumentsForLesson(
    subjectId: string,
    gradeLevel: number,
    lessonId: string
  ): Promise<{
    defaultShared: DocumentSource[];
    allShared: DocumentSource[];
    lessonDocs: DocumentSource[];
    combinedContextText: string;
  }> {
    const allShared = await this.getSharedDocuments(subjectId, gradeLevel);
    const defaultShared = allShared.filter((d) => d.isDefault);
    const lessonDocs = await this.getLessonDocuments(subjectId, gradeLevel, lessonId);

    // Build consolidated context text for AI
    const combinedTexts: string[] = [];

    if (defaultShared.length > 0) {
      combinedTexts.push('=== TÀI LIỆU CHUNG (SÁCH GIÁO KHOA & GIÁO ÁN MÔN/LỚP) ===');
      for (const d of defaultShared) {
        combinedTexts.push(`[${d.name}]:\n${d.extractedText || d.extractedTextSnippet || ''}`);
      }
    }

    if (lessonDocs.length > 0) {
      combinedTexts.push('\n=== TÀI LIỆU RIÊNG CỦA BÀI HỌC ===');
      for (const d of lessonDocs) {
        combinedTexts.push(`[${d.name}]:\n${d.extractedText || d.extractedTextSnippet || ''}`);
      }
    }

    return {
      defaultShared,
      allShared,
      lessonDocs,
      combinedContextText: combinedTexts.join('\n\n'),
    };
  },

  // 4. Save New Document
  async saveDocument(
    docData: Omit<DocumentSource, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'sourceId'> & { sourceId?: string }
  ): Promise<DocumentSource> {
    await this.init();
    
    // Generate stable unique IDs
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    
    // Auto generate clean sourceId if not provided (e.g. DOC_TOAN8_SGK_T1)
    const cleanSourceId = docData.sourceId || docData.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 30);

    const storagePath = docData.storageReference || (
      docData.scope === 'shared'
        ? `storage/subjects/${docData.subjectId}/grades/${docData.gradeLevel}/sharedSources/${cleanSourceId}`
        : `storage/subjects/${docData.subjectId}/grades/${docData.gradeLevel}/lessons/${docData.lessonId || 'general'}/sources/${cleanSourceId}`
    );

    const newDoc: DocumentSource = {
      ...docData,
      id,
      sourceId: cleanSourceId,
      subject: docData.subject || docData.subjectId,
      grade: docData.grade || docData.gradeLevel,
      storageReference: storagePath,
      url: docData.url || '',
      version: 1,
      versionHistory: [
        {
          version: 1,
          name: docData.name,
          size: docData.size,
          updatedAt: now,
          uploadedBy: docData.uploadedBy || 'Giáo viên',
          note: 'Bản tải lên đầu tiên',
        },
      ],
      createdAt: now,
      updatedAt: now,
      extractedTextSnippet: docData.extractedText 
        ? docData.extractedText.slice(0, 350) + (docData.extractedText.length > 350 ? '...' : '')
        : docData.extractedTextSnippet,
    };

    if (!memoryDocsCache) memoryDocsCache = [];
    memoryDocsCache.unshift(newDoc);
    await this.persistDoc(newDoc);

    return newDoc;
  },

  // 5. Update Existing Document (e.g. Rename, update version)
  async updateDocument(id: string, updates: Partial<DocumentSource>, newVersionNote?: string): Promise<DocumentSource | null> {
    await this.init();
    if (!memoryDocsCache) return null;

    const index = memoryDocsCache.findIndex((d) => d.id === id);
    if (index === -1) return null;

    const current = memoryDocsCache[index];
    const now = Date.now();
    
    const isNewVersion = updates.extractedText && updates.extractedText !== current.extractedText;
    const nextVersion = isNewVersion ? current.version + 1 : current.version;

    const updatedHistory = [...(current.versionHistory || [])];
    if (isNewVersion) {
      updatedHistory.push({
        version: nextVersion,
        name: updates.name || current.name,
        size: updates.size || current.size,
        updatedAt: now,
        uploadedBy: updates.uploadedBy || current.uploadedBy,
        note: newVersionNote || `Cập nhật nội dung phiên bản ${nextVersion}`,
      });
    }

    const updated: DocumentSource = {
      ...current,
      ...updates,
      updatedAt: now,
      version: nextVersion,
      versionHistory: updatedHistory,
    };

    memoryDocsCache[index] = updated;
    await this.persistDoc(updated);
    return updated;
  },

  // 6. Toggle Default Status (⭐ Nguồn mặc định)
  async toggleDefault(id: string): Promise<DocumentSource | null> {
    await this.init();
    if (!memoryDocsCache) return null;

    const target = memoryDocsCache.find((d) => d.id === id);
    if (!target) return null;

    return this.updateDocument(id, { isDefault: !target.isDefault });
  },

  // 7. Delete Document
  async deleteDocument(id: string): Promise<boolean> {
    await this.init();
    if (!memoryDocsCache) return false;

    const index = memoryDocsCache.findIndex((d) => d.id === id);
    if (index === -1) return false;

    memoryDocsCache.splice(index, 1);
    await this.removePersistedDoc(id);
    return true;
  },

  // 8. Extract Text from File using backend
  async extractTextFromFile(
    file: File
  ): Promise<{ text: string; wordCount: number; pageCount?: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileBase64 = reader.result as string;
          const res = await fetch('/api/document/extract-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64,
              fileName: file.name,
              mimeType: file.type,
            }),
          });

          if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
          }

          const data = await res.json();
          resolve({
            text: data.text || '',
            wordCount: data.wordCount || 0,
            pageCount: data.pageCount,
          });
        } catch (err: any) {
          console.warn('Text extraction error, using client fallback:', err);
          // Fallback for plain text files
          if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            const rawText = atob((reader.result as string).split(',')[1] || '');
            resolve({
              text: rawText,
              wordCount: rawText.split(/\s+/).filter(Boolean).length,
            });
          } else {
            resolve({
              text: `Tài liệu: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
              wordCount: 10,
            });
          }
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  // 9. Extract Web URL Content
  async extractUrlContent(url: string): Promise<{ title: string; text: string; wordCount: number }> {
    try {
      const res = await fetch('/api/document/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch URL');
      }

      return await res.json();
    } catch (err) {
      console.log('[Document Storage] URL extract fallback activated:', err);
      return {
        title: url,
        text: `Liên kết tài liệu tham khảo trực tuyến: ${url}`,
        wordCount: 7,
      };
    }
  },

  // 10. Search Documents with Filters
  async searchDocuments(
    subjectId: string,
    gradeLevel: number,
    filter: DocumentFilter
  ): Promise<DocumentSource[]> {
    await this.init();
    if (!memoryDocsCache) return [];

    let docs = memoryDocsCache.filter(
      (d) => d.subjectId === subjectId && Number(d.gradeLevel) === Number(gradeLevel)
    );

    if (filter.scope && filter.scope !== 'all') {
      docs = docs.filter((d) => d.scope === filter.scope);
    }

    if (filter.type && filter.type !== 'all') {
      docs = docs.filter((d) => d.type === filter.type);
    }

    if (filter.isDefaultOnly) {
      docs = docs.filter((d) => d.isDefault);
    }

    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.toLowerCase().trim();
      docs = docs.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.originalName.toLowerCase().includes(q) ||
          (d.extractedText && d.extractedText.toLowerCase().includes(q)) ||
          (d.topics && d.topics.some((t) => t.toLowerCase().includes(q))) ||
          (d.chapters && d.chapters.some((c) => c.toLowerCase().includes(q)))
      );
    }

    return docs;
  },

  // 11. Calculate Library Stats
  async calculateStats(subjectId: string, gradeLevel: number): Promise<DocumentStats> {
    await this.init();
    if (!memoryDocsCache) {
      return {
        totalCount: 0,
        totalSize: 0,
        totalWordCount: 0,
        defaultCount: 0,
        sharedCount: 0,
        lessonCount: 0,
      };
    }

    const relevant = memoryDocsCache.filter(
      (d) => d.subjectId === subjectId && Number(d.gradeLevel) === Number(gradeLevel)
    );

    return {
      totalCount: relevant.length,
      totalSize: relevant.reduce((acc, cur) => acc + (cur.size || 0), 0),
      totalWordCount: relevant.reduce((acc, cur) => acc + (cur.wordCount || 0), 0),
      defaultCount: relevant.filter((d) => d.isDefault).length,
      sharedCount: relevant.filter((d) => d.scope === 'shared').length,
      lessonCount: relevant.filter((d) => d.scope === 'lesson').length,
    };
  },
};

export const DocumentStorageService = documentStorageService;

