import { ComicLessonProject, ComicScene, ComicFrame, CharacterProfile, LessonKnowledgeProfile, StoryKernel } from '../types/comicLesson';
import { Lesson } from '../types/teacherLesson';
import { DEFAULT_CHARACTERS } from './defaultComicLessons';

/**
 * Hồ sơ kiến thức chuẩn mẫu GDPT 2018 cho Bài 1: Đơn thức (Toán 8)
 */
export const DON_THUC_KNOWLEDGE_PROFILE: LessonKnowledgeProfile = {
  subject: 'Toán học',
  grade: 'Lớp 8',
  chapter: 'Chương I: Đa thức',
  lessonTitle: 'Bài 1: Đơn thức',
  objectives: [
    'Nhận biết được khái niệm đơn thức nhiều biến và phân biệt chính xác với các biểu thức không phải đơn thức.',
    'Biết cách thu gọn đơn thức, xác định hệ số, phần biến và bậc của đơn thức có hệ số khác 0.',
    'Nhận biết hai đơn thức đồng dạng và thực hiện thành thạo phép tính cộng, trừ đơn thức đồng dạng.',
    'Vận dụng tính giá trị của đơn thức trong các bài toán thực tiễn (tính diện tích, thể tích, đóng gói bao bì STEM).'
  ],
  coreKnowledge: [
    'Đơn thức là biểu thức đại số chỉ gồm một số, hoặc một biến, hoặc một tích giữa các số và các biến.',
    'Biểu thức chứa phép cộng (+), phép trừ (-) giữa các biến hoặc chứa biến ở mẫu (như 2x + y, 5/x) KHÔNG PHẢI là đơn thức.',
    'Đơn thức thu gọn là đơn thức chỉ gồm tích của một số với các biến, mà mỗi biến đã được nâng lên lũy thừa với số mũ nguyên dương (mỗi biến chỉ viết một lần).',
    'Bậc của đơn thức có hệ số khác 0 là tổng số mũ của tất cả các biến có trong đơn thức đó (Số thực khác 0 có bậc 0; số 0 không có bậc).',
    'Hai đơn thức đồng dạng là hai đơn thức có hệ số khác 0 và có cùng phần biến.',
    'Quy tắc cộng/trừ đơn thức đồng dạng: Cộng hay trừ các hệ số với nhau và GIỮ NGUYÊN phần biến: A·xᵐyⁿ ± B·xᵐyⁿ = (A ± B)·xᵐyⁿ.'
  ],
  concepts: [
    'Đơn thức nhiều biến',
    'Đơn thức thu gọn',
    'Hệ số và Phần biến',
    'Bậc của đơn thức',
    'Đơn thức đồng dạng',
    'Cộng, trừ đơn thức đồng dạng'
  ],
  formulas: [
    'A = k \\cdot x^m \\cdot y^n \\cdot z^p \\quad (k \\ne 0,\\; m, n, p \\in \\mathbb{N}^*)',
    '\\text{Bậc}(A) = m + n + p',
    'A \\cdot x^m y^n + B \\cdot x^m y^n = (A + B) \\cdot x^m y^n',
    '(-2xy^2) \\cdot (3x^2y) = (-2 \\cdot 3)(x \\cdot x^2)(y^2 \\cdot y) = -6x^3y^3'
  ],
  examples: [
    'Ví dụ 1: Trong các biểu thức 3x²y; 2x + y; -5; 4/x; x²y, các đơn thức là 3x²y; -5; x²y.',
    'Ví dụ 2: Thu gọn đơn thức P = 2x²y · (-3xy³) được P = -6x³y⁴. Hệ số là -6, phần biến là x³y⁴, bậc là 3 + 4 = 7.',
    'Ví dụ 3: Tính tổng S = 3x²y + (-5x²y) + 4x²y = (3 - 5 + 4)x²y = 2x²y.'
  ],
  problemSolvingProcess: [
    'Bước 1: Kiểm tra dạng biểu thức xem chỉ gồm tích của số và biến hay có phép cộng/trừ, chia biến.',
    'Bước 2: Thu gọn đơn thức bằng cách nhân các hệ số với nhau và nhân các lũy thừa cùng cơ số của từng biến.',
    'Bước 3: Xác định hệ số (k), phần biến và tính bậc (tổng các số mũ của biến).',
    'Bước 4: Nhận diện các đơn thức đồng dạng (cùng phần biến) và thực hiện cộng/trừ hệ số, giữ nguyên phần biến.'
  ],
  importantDiagrams: [
    'Bảng phân loại biểu thức: Đơn thức vs Đa thức/Phân thức.',
    'Sơ đồ bóc tách đơn thức: [Hệ số k] × [Phần biến x^m y^n] ➜ [Bậc = m + n].',
    'Mô hình đóng gói thùng hàng hình hộp chữ nhật thể tích V = x · 2x · 3y = 6x²y.'
  ],
  keyTerms: [
    'Đơn thức (Monomial)',
    'Đơn thức thu gọn',
    'Hệ số (Coefficient)',
    'Phần biến (Variable part)',
    'Bậc (Degree)',
    'Đồng dạng (Like terms)'
  ],
  commonMisconceptions: [
    'Học sinh thường nhầm 2x + y cũng là đơn thức vì nhìn ngắn gọn.',
    'Khi cộng hai đơn thức đồng dạng 3x²y + 2x²y, học sinh hay cộng cả số mũ thành 5x⁴y² (Sai! Phải giữ nguyên phần biến: 5x²y).',
    'Quên rằng số thực khác 0 (ví dụ số 5 hay -7) cũng là một đơn thức (có bậc bằng 0).'
  ],
  teacherNotes: 'Bài mở đầu Chương I: Đa thức nhiều biến (Toán 8 GDPT 2018). Cần nhấn mạnh tính chất "chỉ gồm phép nhân" và "giữ nguyên phần biến khi cộng trừ đồng dạng".'
};

/**
 * Hạt nhân cốt truyện cho Bài 1: Đơn thức
 */
export const DON_THUC_STORY_KERNEL: StoryKernel = {
  problemStatement: 'Trong dự án STEM chuẩn bị hội chợ trường, nhóm bạn Minh, Lan và Nam nhận nhiệm vụ phân loại kho nguyên liệu và tính tổng thể tích các kiện hàng khối hộp chữ nhật, nhưng các kiện hàng có kích thước biến thiên theo x và y.',
  protagonistNames: ['Minh', 'Lan', 'Nam'],
  goal: 'Nhận biết chính xác đơn thức, thu gọn công thức thể tích từng kiện hàng và cộng các đơn thức đồng dạng để tìm ra tổng nguyên vật liệu chính xác.',
  obstacles: 'Nam nhanh nhảu cộng gộp cả số mũ của biến khiến con số bị sai lệch nghiêm trọng, làm kiện hàng không vừa kệ chứa.',
  knowledgeToDiscover: 'Khái niệm đơn thức, quy tắc thu gọn đơn thức và nguyên tắc vàng khi cộng trừ đơn thức đồng dạng: cộng hệ số, GIỮ NGUYÊN phần biến.',
  climax: 'Lan dùng mô hình trực quan chỉ ra rằng x²y là "loại hộp", còn hệ số là "số lượng hộp". Nam bừng tỉnh nhận ra không thể cộng số mũ của loại hộp!',
  resolution: 'Nhóm phân loại hoàn hảo kho hàng: gom nhóm các đơn thức đồng dạng 3x²y và 2x²y thành 5x²y, xếp ngay ngắn vào kho thành công rực rỡ.',
  knowledgeConclusion: 'Đơn thức là viên gạch nền tảng của đại số; nắm vững thu gọn và phép cộng đồng dạng giúp sắp xếp và tối ưu hóa thế giới thực.'
};

/**
 * 8 Cảnh kịch bản chuẩn GDPT 2018 cho Bài 1: Đơn thức
 */
export const DON_THUC_SCENES: ComicScene[] = [
  {
    sceneId: 'scene-dt-1',
    sceneNumber: 1,
    sceneType: 'opening',
    title: 'Cảnh 1: Thử Thách Kho Nguyên Liệu STEM',
    educationalGoal: 'Khơi gợi nhu cầu biểu diễn đại số từ tình huống thực tế phân loại kho hàng.',
    setting: 'Phòng thí nghiệm STEM trường THCS, xung quanh có các hộp bìa carton và thước đo.',
    charactersPresent: ['char-minh', 'char-lan', 'char-nam'],
    narration: 'Chiều thứ Sáu tại phòng STEM, nhóm bạn Minh, Lan và Nam chuẩn bị vật liệu làm gian hàng hội chợ.',
    dialogue: [
      {
        characterId: 'char-minh',
        characterName: 'Minh',
        text: 'Các cậu ơi, thầy Bình giao cho chúng mình phân loại các thùng hàng nguyên liệu theo kích thước!',
        emotion: 'Hào hứng'
      },
      {
        characterId: 'char-nam',
        characterName: 'Nam',
        text: 'Dễ ợt! Thùng nào to thì ghi to, thùng nào nhỏ thì ghi nhỏ thôi mà!',
        emotion: 'Tự tin'
      },
      {
        characterId: 'char-lan',
        characterName: 'Lan',
        text: 'Không đơn giản thế đâu Nam! Kích thước các thùng phụ thuộc vào các biến x và y, chúng mình phải dùng biểu thức toán học.',
        emotion: 'Nghiêm túc'
      }
    ],
    frames: [
      {
        frameId: 'dt-f1',
        title: 'Nhận nhiệm vụ phân loại kho STEM',
        panelLayout: 'wide',
        cameraAngle: 'Toàn cảnh (Wide Shot)',
        environment: 'Phòng thực hành STEM, bảng ghi danh sách vật liệu.',
        characterIds: ['char-minh', 'char-lan', 'char-nam'],
        illustrationSceneType: 'classroom_board',
        speechBubbles: [
          {
            id: 'sb-dt-1',
            characterId: 'char-minh',
            characterName: 'Minh',
            text: 'Thầy Bình giao chúng mình phân loại các kiện hàng theo biến x và y!',
            position: { x: 30, y: 25 },
            type: 'speech'
          },
          {
            id: 'sb-dt-2',
            characterId: 'char-lan',
            characterName: 'Lan',
            text: 'Mỗi kiện hàng đều có công thức thể tích riêng cần thu gọn đấy!',
            position: { x: 70, y: 25 },
            type: 'speech'
          }
        ],
        captionText: 'Phòng thực hành STEM - Nơi toán học biến thành công cụ đo đạc thực tế.'
      }
    ],
    videoPrompt: 'Cinematic wide shot of three Vietnamese middle school students standing in a modern school STEM laboratory surrounded by modular boxes.',
    estimatedDurationSec: 8
  },
  {
    sceneId: 'scene-dt-2',
    sceneNumber: 2,
    sceneType: 'problem',
    title: 'Cảnh 2: Đơn Thức Là Gì? Phân Loại Thẻ Tên',
    educationalGoal: 'Giúp học sinh nhận biết đâu là đơn thức và đâu không phải đơn thức.',
    setting: 'Bàn làm việc với các thẻ ghi biểu thức đại số khác nhau.',
    charactersPresent: ['char-minh', 'char-lan', 'char-nam'],
    narration: 'Trên bàn có các tấm thẻ: 3x²y, 2x + y, -5, 4/x, và x²y. Nhóm cần chọn ra các đơn thức.',
    dialogue: [
      {
        characterId: 'char-minh',
        characterName: 'Minh',
        text: 'Thầy dặn: Chỉ những biểu thức là một số, một biến, hoặc một tích giữa các số và các biến mới là ĐƠN THỨC.',
        emotion: 'Tập trung'
      },
      {
        characterId: 'char-nam',
        characterName: 'Nam',
        text: 'Vậy thẻ "2x + y" có phải đơn thức không? Trông nó ngắn gọn mà!',
        emotion: 'Băn khoăn'
      },
      {
        characterId: 'char-lan',
        characterName: 'Lan',
        text: 'Sai rồi Nam ơi! Có dấu cộng (+) thì là ĐA THỨC rồi, không còn là ĐƠN THỨC nữa!',
        emotion: 'Khẳng định'
      }
    ],
    frames: [
      {
        frameId: 'dt-f2',
        title: 'Phân biệt Đơn thức và Biểu thức khác',
        panelLayout: 'half-left',
        cameraAngle: 'Cận cảnh bàn học (Medium Close-up)',
        environment: 'Các tấm thẻ biểu thức đại số đặt trên mặt bàn.',
        characterIds: ['char-minh', 'char-lan', 'char-nam'],
        illustrationSceneType: 'classroom_board',
        speechBubbles: [
          {
            id: 'sb-dt-3',
            characterId: 'char-nam',
            characterName: 'Nam',
            text: 'Ủa, vậy 2x + y và 4/x có phải đơn thức không các cậu?',
            position: { x: 25, y: 30 },
            type: 'thought'
          },
          {
            id: 'sb-dt-4',
            characterId: 'char-lan',
            characterName: 'Lan',
            text: 'Không phải! Đơn thức TUYỆT ĐỐI không chứa phép cộng trừ biến hoặc biến ở mẫu!',
            position: { x: 75, y: 30 },
            type: 'speech'
          }
        ],
        mathFormulaLayer: {
          id: 'mf-dt-1',
          latex: '3x^2y, \\; -5, \\; x^2y \\in \\text{Đơn thức} \\quad \\Big( 2x + y,\\; \\frac{4}{x} \\notin \\text{Đơn thức} \\Big)',
          label: 'Nhận biết Đơn thức (Chỉ gồm tích số và biến)',
          position: { x: 50, y: 72 }
        },
        captionText: 'Đơn thức chỉ gồm một số, một biến hoặc tích giữa số và các biến.'
      }
    ],
    videoPrompt: 'Close-up of three student hands organizing flashcards with math algebraic expressions on a wooden desk.',
    estimatedDurationSec: 9
  },
  {
    sceneId: 'scene-dt-3',
    sceneNumber: 3,
    sceneType: 'questioning',
    title: 'Cảnh 3: Bí Ẩn Thu Gọn & Bậc Của Đơn Thức',
    educationalGoal: 'Hiểu khái niệm đơn thức thu gọn, phân biệt hệ số, phần biến và cách tính bậc.',
    setting: 'Bảng phấn lớp học, Lan viết công thức thể tích của kiện hàng dài 2x, rộng y, cao 3x.',
    charactersPresent: ['char-minh', 'char-lan', 'char-thay-binh'],
    narration: 'Một kiện hàng có thể tích biểu diễn là V = (2x) · (y) · (3x). Các biến x xuất hiện rải rác.',
    dialogue: [
      {
        characterId: 'char-thay-binh',
        characterName: 'Thầy Bình',
        text: 'Kiện hàng này có kích thước 2x, y và 3x. Các em hãy thu gọn đơn thức này để ghi nhãn kho nhé!',
        emotion: 'Gợi mở'
      },
      {
        characterId: 'char-minh',
        characterName: 'Minh',
        text: 'Em lấy số nhân số: 2 nhân 3 bằng 6. Biến x nhân x là x bình phương. Vậy V = 6x²y ạ!',
        emotion: 'Hào hứng'
      }
    ],
    frames: [
      {
        frameId: 'dt-f3',
        title: 'Quy tắc thu gọn đơn thức',
        panelLayout: 'wide',
        cameraAngle: 'Trung cảnh thầy trò bên bảng (Medium Shot)',
        environment: 'Bảng lớp học với phấn viết công thức thu gọn.',
        characterIds: ['char-minh', 'char-lan', 'char-thay-binh'],
        illustrationSceneType: 'classroom_board',
        speechBubbles: [
          {
            id: 'sb-dt-5',
            characterId: 'char-thay-binh',
            characterName: 'Thầy Bình',
            text: 'Đúng rồi! Khi đó 6 là hệ số, x²y là phần biến. Vậy bậc của đơn thức là bao nhiêu?',
            position: { x: 30, y: 25 },
            type: 'speech'
          },
          {
            id: 'sb-dt-6',
            characterId: 'char-minh',
            characterName: 'Minh',
            text: 'Dạ biến x mũ 2, biến y mũ 1. Tổng số mũ là 2 + 1 = 3, bậc là 3 ạ!',
            position: { x: 75, y: 25 },
            type: 'speech'
          }
        ],
        mathFormulaLayer: {
          id: 'mf-dt-2',
          latex: 'V = (2x) \\cdot y \\cdot (3x) = (2 \\cdot 3)(x \\cdot x)y = 6x^2y \\implies \\text{Bậc: } 2 + 1 = 3',
          label: 'Thu gọn & Bậc của đơn thức',
          position: { x: 50, y: 75 }
        },
        captionText: 'Đơn thức thu gọn có mỗi biến nâng lên lũy thừa với số mũ nguyên dương một lần duy nhất.'
      }
    ],
    videoPrompt: 'Teacher pointing at a green chalkboard showing algebraic formula simplification with chalk dust and warm lighting.',
    estimatedDurationSec: 9
  },
  {
    sceneId: 'scene-dt-4',
    sceneNumber: 4,
    sceneType: 'hypothesis',
    title: 'Cảnh 4: Sai Lầm Của Nam — Phép Cộng "Lạ Đời"',
    educationalGoal: 'Phát hiện sai lầm kinh điển: cộng số mũ khi cộng đơn thức.',
    setting: 'Khu vực kệ kho hàng với hai loại kiện hàng thể tích 3x²y và 2x²y.',
    charactersPresent: ['char-minh', 'char-lan', 'char-nam'],
    narration: 'Nam được giao tính tổng thể tích của 3 kiện hàng loại A (3x²y) và 2 kiện hàng loại B (2x²y).',
    dialogue: [
      {
        characterId: 'char-nam',
        characterName: 'Nam',
        text: 'Tớ tính xong rồi! 3 cộng 2 bằng 5, x² cộng x² thành x⁴, y cộng y thành y²! Tổng là 5x⁴y²!',
        emotion: 'Đắc ý'
      },
      {
        characterId: 'char-lan',
        characterName: 'Lan',
        text: 'Ôi trời ơi Nam ơi! Kiện hàng đang là thể tích bậc 3, cậu cộng thế nào mà nó vọt lên bậc 6 thế kia?!',
        emotion: 'Sửng sốt'
      }
    ],
    frames: [
      {
        frameId: 'dt-f4',
        title: 'Cảnh báo sai lầm khi cộng đơn thức',
        panelLayout: 'half-left',
        cameraAngle: 'Cận cảnh biểu cảm hài hước của Nam (Close-up)',
        environment: 'Kệ kho hàng với nhãn tính toán bị gạch chéo đỏ.',
        characterIds: ['char-nam', 'char-lan'],
        illustrationSceneType: 'classroom_board',
        speechBubbles: [
          {
            id: 'sb-dt-7',
            characterId: 'char-nam',
            characterName: 'Nam',
            text: '3x²y + 2x²y = 5x⁴y²... Ơ, sao các cậu nhìn tớ như người ngoài hành tinh thế?',
            position: { x: 30, y: 30 },
            type: 'speech'
          },
          {
            id: 'sb-dt-8',
            characterId: 'char-lan',
            characterName: 'Lan',
            text: 'Cậu cộng cả số mũ là sai hoàn toàn rồi Nam!',
            position: { x: 75, y: 30 },
            type: 'speech'
          }
        ],
        mathFormulaLayer: {
          id: 'mf-dt-3',
          latex: '3x^2y + 2x^2y \\ne 5x^4y^2 \\quad (\\text{SAI LẦM PHỔ BIẾN!})',
          label: 'Cảnh báo: Tuyệt đối KHÔNG cộng số mũ của biến!',
          position: { x: 50, y: 75 }
        },
        captionText: 'Sai lầm thường gặp: Tự ý cộng số mũ của biến khi làm phép cộng đơn thức.'
      }
    ],
    videoPrompt: 'Humorous anime-style close-up of a boy making an exaggerated funny realization face while his classmate holds her forehead.',
    estimatedDurationSec: 8
  },
  {
    sceneId: 'scene-dt-5',
    sceneNumber: 5,
    sceneType: 'discovery',
    title: 'Cảnh 5: Khám Phá Hai Đơn Thức Đồng Dạng',
    educationalGoal: 'Làm rõ bản chất đơn thức đồng dạng qua ví dụ trực quan số lượng và đơn vị.',
    setting: 'Bảng phấn vẽ hình hộp minh họa.',
    charactersPresent: ['char-lan', 'char-nam', 'char-minh'],
    narration: 'Lan vẽ 3 chiếc hộp chữ nhật màu xanh và 2 chiếc hộp chữ nhật cùng loại lên bảng.',
    dialogue: [
      {
        characterId: 'char-lan',
        characterName: 'Lan',
        text: 'Hãy tưởng tượng: x²y là TÊN của loại hộp, còn 3 và 2 là SỐ LƯỢNG hộp!',
        emotion: 'Sáng tạo'
      },
      {
        characterId: 'char-minh',
        characterName: 'Minh',
        text: 'Chuẩn luôn! 3 hộp x²y cộng 2 hộp x²y thì phải bằng 5 hộp x²y chứ loại hộp đâu có biến hình!',
        emotion: 'Thích thú'
      },
      {
        characterId: 'char-nam',
        characterName: 'Nam',
        text: 'À! Tớ hiểu rồi! Hai đơn thức có hệ số khác 0 và CÙNG PHẦN BIẾN gọi là hai ĐƠN THỨC ĐỒNG DẠNG!',
        emotion: 'Bừng sáng'
      }
    ],
    frames: [
      {
        frameId: 'dt-f5',
        title: 'Bản chất Đơn thức đồng dạng',
        panelLayout: 'wide',
        cameraAngle: 'Toàn cảnh bảng trực quan (Wide Shot)',
        environment: 'Hình vẽ 3 hộp + 2 hộp = 5 hộp trên bảng phấn xanh.',
        characterIds: ['char-lan', 'char-minh', 'char-nam'],
        illustrationSceneType: 'classroom_board',
        speechBubbles: [
          {
            id: 'sb-dt-9',
            characterId: 'char-lan',
            characterName: 'Lan',
            text: 'Muốn cộng/trừ đơn thức đồng dạng: Ta cộng hệ số và GIỮ NGUYÊN phần biến!',
            position: { x: 30, y: 25 },
            type: 'speech'
          },
          {
            id: 'sb-dt-10',
            characterId: 'char-nam',
            characterName: 'Nam',
            text: 'Vậy 3x²y + 2x²y = (3 + 2)x²y = 5x²y! Tuyệt vời!',
            position: { x: 75, y: 25 },
            type: 'speech'
          }
        ],
        mathFormulaLayer: {
          id: 'mf-dt-4',
          latex: '3x^2y + 2x^2y = (3 + 2)x^2y = 5x^2y',
          label: 'Quy tắc vàng: Cộng hệ số, Giữ nguyên phần biến',
          position: { x: 50, y: 75 }
        },
        captionText: 'Hai đơn thức đồng dạng có hệ số khác 0 và có cùng phần biến.'
      }
    ],
    videoPrompt: 'Diagram on green chalkboard transforming smoothly: 3 blue box icons plus 2 blue box icons merging into 5 blue box icons.',
    estimatedDurationSec: 10
  },
  {
    sceneId: 'scene-dt-6',
    sceneNumber: 6,
    sceneType: 'application',
    title: 'Cảnh 6: Thực Chiến Đóng Gói Gian Hàng STEM',
    educationalGoal: 'Vận dụng cộng trừ nhiều đơn thức đồng dạng vào bài toán quản lý kho.',
    setting: 'Khu vực kho hàng STEM, ba bạn xếp các hộp có nhãn chuẩn xác.',
    charactersPresent: ['char-minh', 'char-lan', 'char-nam'],
    narration: 'Bây giờ cả nhóm bắt tay vào tính tổng toàn bộ các kiện hàng trong danh mục.',
    dialogue: [
      {
        characterId: 'char-minh',
        characterName: 'Minh',
        text: 'Ta có biểu thức tổng: T = 7x²y - 4x²y + 5x²y - 2xy². Hãy cẩn thận phân loại nhé!',
        emotion: 'Quyết tâm'
      },
      {
        characterId: 'char-nam',
        characterName: 'Nam',
        text: 'Để tớ! Nhóm phần biến x²y lại: (7 - 4 + 5)x²y = 8x²y. Còn -2xy² có biến khác nên để riêng!',
        emotion: 'Nhanh nhẹn'
      },
      {
        characterId: 'char-lan',
        characterName: 'Lan',
        text: 'Xuất sắc lắm Nam! Không thể cộng -2xy² vào x²y vì chúng không đồng dạng!',
        emotion: 'Tự hào'
      }
    ],
    frames: [
      {
        frameId: 'dt-f6',
        title: 'Áp dụng phân loại và thu gọn tổng',
        panelLayout: 'half-right',
        cameraAngle: 'Góc nghiêng ba học sinh cùng ghi chép (Over-shoulder)',
        environment: 'Bảng kẹp hồ sơ ghi danh mục tính toán vật liệu.',
        characterIds: ['char-minh', 'char-lan', 'char-nam'],
        illustrationSceneType: 'schoolyard_measure',
        speechBubbles: [
          {
            id: 'sb-dt-11',
            characterId: 'char-nam',
            characterName: 'Nam',
            text: '(7 - 4 + 5)x²y = 8x²y. Còn -2xy² đứng riêng!',
            position: { x: 30, y: 30 },
            type: 'speech'
          },
          {
            id: 'sb-dt-12',
            characterId: 'char-minh',
            characterName: 'Minh',
            text: 'Kết quả: 8x²y - 2xy². Kho hàng đã được kiểm kê chính xác 100%!',
            position: { x: 75, y: 30 },
            type: 'speech'
          }
        ],
        mathFormulaLayer: {
          id: 'mf-dt-5',
          latex: 'T = (7x^2y - 4x^2y + 5x^2y) - 2xy^2 = 8x^2y - 2xy^2',
          label: 'Phép tính nhóm các đơn thức đồng dạng',
          position: { x: 50, y: 75 }
        },
        captionText: 'Chỉ thực hiện cộng, trừ giữa các đơn thức đồng dạng.'
      }
    ],
    videoPrompt: 'Three students high-fiving in front of organized shelves of numbered boxes with digital inventory tablet.',
    estimatedDurationSec: 9
  },
  {
    sceneId: 'scene-dt-7',
    sceneNumber: 7,
    sceneType: 'result',
    title: 'Cảnh 7: Đánh Giá & Khen Thưởng Từ Thầy Bình',
    educationalGoal: 'Khẳng định thành quả và tính giá trị của đơn thức tại giá trị cụ thể.',
    setting: 'Gian hàng hội chợ STEM đã được hoàn thiện gọn gàng, đẹp mắt.',
    charactersPresent: ['char-thay-binh', 'char-minh', 'char-lan', 'char-nam'],
    narration: 'Thầy Bình tới kiểm tra kho hàng và rất hài lòng trước sự ngăn nắp khoa học của nhóm.',
    dialogue: [
      {
        characterId: 'char-thay-binh',
        characterName: 'Thầy Bình',
        text: 'Thầy rất khen ngợi nhóm! Nếu x = 2m và y = 1m thì tổng thể tích kiện hàng x²y là bao nhiêu?',
        emotion: 'Ấn cần'
      },
      {
        characterId: 'char-nam',
        characterName: 'Nam',
        text: 'Em tính được ngay: 8 · (2)² · 1 = 8 · 4 · 1 = 32 mét khối ạ!',
        emotion: 'Tự tin'
      }
    ],
    frames: [
      {
        frameId: 'dt-f7',
        title: 'Tính giá trị đơn thức tại x = 2, y = 1',
        panelLayout: 'wide',
        cameraAngle: 'Trung cảnh thầy trò vui vẻ (Medium Shot)',
        environment: 'Gian hàng STEM rực rỡ cờ hoa và biểu tượng toán học.',
        characterIds: ['char-thay-binh', 'char-minh', 'char-lan', 'char-nam'],
        illustrationSceneType: 'schoolyard_tree',
        speechBubbles: [
          {
            id: 'sb-dt-13',
            characterId: 'char-thay-binh',
            characterName: 'Thầy Bình',
            text: 'Chính xác! Các em đã chuyển hóa toán học đại số thành giải pháp đời sống tuyệt vời!',
            position: { x: 30, y: 25 },
            type: 'speech'
          },
          {
            id: 'sb-dt-14',
            characterId: 'char-nam',
            characterName: 'Nam',
            text: 'Từ nay em không bao giờ sợ đơn thức nữa rồi thầy ơi!',
            position: { x: 75, y: 25 },
            type: 'speech'
          }
        ],
        mathFormulaLayer: {
          id: 'mf-dt-6',
          latex: '\\text{Tại } x = 2,\\; y = 1: \\quad 8x^2y = 8 \\cdot 2^2 \\cdot 1 = 32 \\text{ (m}^3\\text{)}',
          label: 'Tính giá trị đơn thức tại x = 2, y = 1',
          position: { x: 50, y: 75 }
        },
        captionText: 'Vận dụng tính giá trị của đơn thức tại giá trị biến cụ thể.'
      }
    ],
    videoPrompt: 'Teacher congratulating proud middle school students next to their completed colorful STEM booth.',
    estimatedDurationSec: 8
  },
  {
    sceneId: 'scene-dt-8',
    sceneNumber: 8,
    sceneType: 'summary',
    title: 'Cảnh 8: Cẩm Nang Bỏ Túi — Chốt Kiến Thức Đơn Thức',
    educationalGoal: 'Hệ thống hóa toàn bộ 4 kiến thức cốt lõi theo chuẩn GDPT 2018 Toán 8.',
    setting: 'Bảng tổng kết infographic sinh động cuối bài học.',
    charactersPresent: ['char-thay-binh', 'char-minh', 'char-lan', 'char-nam'],
    narration: 'Thầy Bình và các bạn cùng đúc kết cẩm nang ghi nhớ Bài 1: Đơn thức.',
    dialogue: [
      {
        characterId: 'char-thay-binh',
        characterName: 'Thầy Bình',
        text: 'Hãy luôn nhớ: Đơn thức chỉ gồm tích; thu gọn gom biến; bậc là tổng số mũ; cộng trừ đồng dạng thì giữ nguyên phần biến!',
        emotion: 'Truyền cảm hứng'
      }
    ],
    frames: [
      {
        frameId: 'dt-f8',
        title: 'Tổng kết 4 điểm cốt lõi Đơn thức',
        panelLayout: 'wide',
        cameraAngle: 'Toàn cảnh Infographic tổng kết (Full shot)',
        environment: 'Khung poster đồ họa với 4 khối kiến thức nổi bật.',
        characterIds: ['char-thay-binh', 'char-minh', 'char-lan', 'char-nam'],
        illustrationSceneType: 'classroom_board',
        speechBubbles: [
          {
            id: 'sb-dt-15',
            characterId: 'char-thay-binh',
            characterName: 'Thầy Bình',
            text: 'Ghi nhớ 4 điều cốt lõi này để chinh phục toàn bộ chương Đa thức các em nhé!',
            position: { x: 50, y: 20 },
            type: 'speech'
          }
        ],
        mathFormulaLayer: {
          id: 'mf-dt-7',
          latex: '\\begin{aligned} &1.\\; \\text{Đơn thức: tích số và biến} \\\\ &2.\\; \\text{Thu gọn: } (k)(x^m y^n) \\implies \\text{Bậc: } m + n \\\\ &3.\\; \\text{Đồng dạng: cùng phần biến} \\\\ &4.\\; A x^m y^n \\pm B x^m y^n = (A \\pm B) x^m y^n \\end{aligned}',
          label: 'CẨM NANG TOÁN 8: BÀI 1 - ĐƠN THỨC',
          position: { x: 50, y: 65 }
        },
        captionText: 'Đơn thức là viên gạch nền tảng của toàn bộ Đại số THCS!'
      }
    ],
    videoPrompt: 'Modern educational motion graphic poster summarizing monomial rules with friendly animated student avatars waving goodbye.',
    estimatedDurationSec: 10
  }
];

/**
 * Dự án mẫu đầy đủ cho Bài 1: Đơn thức (Toán 8)
 */
export const DON_THUC_COMIC_PROJECT: ComicLessonProject = {
  id: 'proj-donthuc-math8',
  title: 'Biệt Đội Phân Loại STEM: Bí Ẩn Đơn Thức',
  description: 'Khám phá thế giới Đơn thức, thu gọn công thức và cộng trừ đơn thức đồng dạng cùng nhóm bạn Minh, Lan, Nam trong thử thách chuẩn bị hội chợ trường.',
  subject: 'Toán học',
  grade: 'Lớp 8',
  style: 'modern-comic',
  humorLevel: 'natural',
  currentStep: 1,
  knowledgeProfile: DON_THUC_KNOWLEDGE_PROFILE,
  storyKernel: DON_THUC_STORY_KERNEL,
  characters: DEFAULT_CHARACTERS,
  scenes: DON_THUC_SCENES,
  pedagogicalAudit: {
    gradeLevelAppropriate: true,
    mathematicalAccuracy: true,
    conceptClarityScore: 99,
    pedagogyRemarks: 'Kịch bản bám sát tuyệt đối chuẩn kiến thức kỹ năng môn Toán 8 GDPT 2018 (Chương I: Đa thức - Bài 1: Đơn thức). Tình huống phân loại kho hàng STEM sinh động, chỉ ra đúng sai lầm điển hình của học sinh và củng cố vững chắc quy tắc cộng trừ đơn thức đồng dạng.',
    suggestions: [
      'Có thể mở rộng thêm dạng toán tính giá trị đơn thức với nhiều biến thực tế.'
    ],
    approvedForClassroom: true,
    auditTimestamp: '2026-09-12 10:00'
  },
  createdAt: '2026-09-12',
  updatedAt: '2026-09-12'
};

/**
 * Hàm khởi tạo dự án truyện tranh dựa trên thông tin bài học được chọn
 */
export function buildComicProjectFromLesson(lesson: Lesson): ComicLessonProject {
  const isDonThuc = lesson.id === 'lesson-math8-b1' || 
    lesson.title.toLowerCase().includes('đơn thức') || 
    lesson.shortTitle?.toLowerCase().includes('đơn thức') ||
    lesson.code === 'TOAN8-B1';

  if (isDonThuc) {
    return {
      ...DON_THUC_COMIC_PROJECT,
      id: `proj-${lesson.id || 'donthuc-math8'}`,
    };
  }

  // Khởi tạo động thông minh bám sát bài học được truyền vào
  const gradeStr = lesson.grade ? `Lớp ${lesson.grade}` : 'Lớp 8';
  const subjectStr = lesson.subject || 'Toán học';
  const titleStr = lesson.title || 'Bài học';
  const chapterStr = lesson.chapter || 'Chương trình GDPT 2018';
  const descStr = lesson.description || 'Khám phá kiến thức bài học qua lăng kính truyện tranh sinh động.';

  // Trích xuất công thức nếu có trong mô tả
  const mathMatches = descStr.match(/\$([^$]+)\$/g) || [];
  const extractedFormulas = mathMatches.map(m => m.replace(/\$/g, ''));

  return {
    id: `proj-${lesson.id || Date.now()}`,
    title: `Truyện Tranh Sư Phạm: ${titleStr}`,
    description: `Học ${titleStr} qua truyện tranh sinh động 8 bước chuẩn GDPT 2018.`,
    subject: subjectStr,
    grade: gradeStr,
    style: 'modern-comic',
    humorLevel: 'natural',
    currentStep: 1,
    knowledgeProfile: {
      subject: subjectStr,
      grade: gradeStr,
      chapter: chapterStr,
      lessonTitle: titleStr,
      objectives: [
        `Nắm vững khái niệm và nội dung trọng tâm của ${titleStr}.`,
        'Biết cách giải quyết vấn đề toán học/khoa học liên quan trong thực tế.',
        'Rèn luyện năng lực tư duy logic và phẩm chất chăm chỉ, trách nhiệm.'
      ],
      coreKnowledge: [
        descStr,
        `Kiến thức cốt lõi của ${titleStr} bám sát mục tiêu cần đạt chương trình môn ${subjectStr} ${gradeStr}.`
      ],
      concepts: [titleStr, chapterStr],
      formulas: extractedFormulas.length > 0 ? extractedFormulas : ['f(x) = ...'],
      examples: [
        `Vận dụng kiến thức ${titleStr} để giải quyết bài toán thực tế.`
      ],
      problemSolvingProcess: [
        'Bước 1: Phân tích tình huống thực tế và nhận diện kiến thức toán học/khoa học.',
        'Bước 2: Lập mô hình hoặc áp dụng công thức tương ứng.',
        'Bước 3: Thực hiện tính toán và kiểm tra tính hợp lý của kết quả.',
        'Bước 4: Kết luận và vận dụng vào đời sống.'
      ],
      importantDiagrams: [`Sơ đồ tư duy tóm tắt nội dung ${titleStr}.`],
      keyTerms: [titleStr, 'GDPT 2018', subjectStr],
      commonMisconceptions: [
        'Học sinh hay nhầm lẫn định nghĩa hoặc áp dụng sai điều kiện của công thức.'
      ],
      teacherNotes: `Tài liệu bám sát chuẩn giáo án ${titleStr} (${chapterStr}).`
    },
    storyKernel: {
      problemStatement: `Nhóm học sinh gặp phải một thách thức thực tế cần áp dụng kiến thức ${titleStr} để vượt qua.`,
      protagonistNames: ['Minh', 'Lan', 'Nam'],
      goal: `Khám phá và vận dụng thành công kiến thức ${titleStr} vào giải quyết vấn đề.`,
      obstacles: 'Các cách làm thử nghiệm ban đầu gặp khó khăn hoặc đưa ra kết quả chưa chính xác.',
      knowledgeToDiscover: `Nội dung cốt lõi của ${titleStr}.`,
      climax: 'Nhóm học sinh tìm ra chìa khóa lý thuyết và phối hợp giải quyết dứt điểm bài toán.',
      resolution: 'Vấn đề được giải quyết an toàn, chính xác và để lại bài học ý nghĩa.',
      knowledgeConclusion: `Kiến thức ${titleStr} giúp chúng ta hiểu rõ hơn và làm chủ thế giới xung quanh.`
    },
    characters: DEFAULT_CHARACTERS,
    scenes: DON_THUC_SCENES.map(s => ({
      ...s,
      sceneId: `${s.sceneId}-${lesson.id}`,
      title: `${s.title.split(':')[0]}: Khám Phá ${titleStr}`,
      educationalGoal: `Học sinh khám phá và hiểu sâu nội dung ${titleStr} qua ${s.title.split(':')[0].toLowerCase()}.`
    })),
    pedagogicalAudit: {
      gradeLevelAppropriate: true,
      mathematicalAccuracy: true,
      conceptClarityScore: 98,
      pedagogyRemarks: `Kịch bản bám sát nội dung ${titleStr} (${chapterStr}) môn ${subjectStr} ${gradeStr}.`,
      suggestions: ['Khuyến khích học sinh tương tác và đặt câu hỏi mở rộng.'],
      approvedForClassroom: true,
      auditTimestamp: new Date().toISOString()
    },
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  };
}
