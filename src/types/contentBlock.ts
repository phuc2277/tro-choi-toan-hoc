/**
 * Unified Content Block System Specification for Teacher Presentations
 * Strictly complies with:
 * Lesson -> TeachingActivity[] -> EditorSlide[] -> ContentBlock[]
 */

export type ContentBlockType =
  | 'text'
  | 'heading'
  | 'math'
  | 'list'
  | 'image'
  | 'video'
  | 'audio'
  | 'table'
  | 'question'
  | 'geometry'
  | 'chart'
  | 'model3d'
  | 'experiment'
  | 'game';

export type BlockType = ContentBlockType;

export interface BlockPosition {
  x: number; // percentage 0-100 or pixel
  y: number; // percentage 0-100 or pixel
}

export interface BlockSize {
  width: number; // percentage 0-100 or pixel
  height: number; // percentage 0-100 or pixel
}

export type AnimationEntranceType =
  | 'none'
  | 'fade'
  | 'appear'
  | 'slide'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom'
  | 'bounce'
  | 'typewriter'
  | 'glow';

export type AnimationExitType =
  | 'none'
  | 'fade-out'
  | 'slide-down'
  | 'slide-up'
  | 'zoom-out'
  | 'shrink';

export type AnimationTrigger = 'click' | 'auto' | 'with-previous';

export interface BlockAnimation {
  type?: AnimationEntranceType;
  entrance?: AnimationEntranceType;
  exit?: AnimationExitType;
  trigger?: AnimationTrigger; // 'click' (Giáo viên bấm chuột / Space) | 'auto' (Tự động sau delay) | 'with-previous'
  delaySeconds?: number; // Độ trễ tự động xuất hiện (giây, vd 0.5s, 1s, 2s...)
  durationMs?: number; // Thời lượng hiệu ứng (ms, vd 400ms, 600ms)
  order?: number; // Thứ tự xuất hiện trong slide (1, 2, 3...)
  autoDisappear?: boolean; // Tự động biến mất
  disappearDelaySeconds?: number; // Số giây xuất hiện trước khi biến mất (vd 3s, 5s)
  disappearOnNextStep?: boolean; // Biến mất khi bước tiếp theo xuất hiện
  revealByParagraph?: boolean; // Xuất hiện từng đoạn / từng dòng cho văn bản dài
}

export interface BaseContentBlock {
  id: string; // Unique UUID, NEVER array index
  type: ContentBlockType;
  position?: BlockPosition;
  size?: BlockSize;
  order?: number;
  visible?: boolean; // For hiding/showing in presentation
  locked?: boolean; // Prevent accidental editing/deletion
  revealOrder?: number; // Reveal sequence in presentation (Stage 4 ready)
  revealMode?: AnimationEntranceType;
  animation?: BlockAnimation;
  settings?: Record<string, any>;
}

// 1. TextBlock
export interface TextBlockContent {
  text: string;
  fontSize?: number; // 14, 18, 24, 32...
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  backgroundColor?: string;
}

export interface TextBlock extends BaseContentBlock {
  type: 'text';
  content: TextBlockContent;
}

// 2. HeadingBlock
export interface HeadingBlockContent {
  text: string;
  level: 'h1' | 'h2' | 'h3';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  badge?: string;
}

export interface HeadingBlock extends BaseContentBlock {
  type: 'heading';
  content: HeadingBlockContent;
}

// 3. MathBlock
export interface MathBlockContent {
  latex: string;
  explanation?: string;
  displayMode?: 'inline' | 'block';
  color?: string;
  isLarge?: boolean;
}

export interface MathBlock extends BaseContentBlock {
  type: 'math';
  content: MathBlockContent;
}

// 4. ImageBlock
export interface ImageBlockContent {
  url: string;
  caption?: string;
  altText?: string;
  fit?: 'contain' | 'cover' | 'fill';
  borderRadius?: number;
}

export interface ImageBlock extends BaseContentBlock {
  type: 'image';
  content: ImageBlockContent;
}

// 5. VideoBlock
export interface VideoBlockContent {
  url: string; // YouTube, MP4, direct link
  title?: string;
  controls?: boolean;
  autoplay?: boolean;
}

export interface VideoBlock extends BaseContentBlock {
  type: 'video';
  content: VideoBlockContent;
}

// 6. AudioBlock
export interface AudioBlockContent {
  url: string;
  title?: string;
  duration?: string;
  autoPlay?: boolean;
}

export interface AudioBlock extends BaseContentBlock {
  type: 'audio';
  content: AudioBlockContent;
}

// 7. ListBlock
export interface ListBlockContent {
  listType: 'bullet' | 'numbered';
  items: string[];
  fontSize?: number;
  color?: string;
  lineHeight?: number;
}

export interface ListBlock extends BaseContentBlock {
  type: 'list';
  content: ListBlockContent;
}

// 8. TableBlock
export interface TableBlockContent {
  title?: string;
  headers: string[];
  rows: string[][];
  highlightHeader?: boolean;
}

export interface TableBlock extends BaseContentBlock {
  type: 'table';
  content: TableBlockContent;
}

// 8. QuestionBlock (Linked to QuestionBank or customized)
export interface QuestionOption {
  id: string;
  label: string; // 'A', 'B', 'C', 'D'
  text: string;
}

export interface QuestionBlockContent {
  questionId?: string; // Reference to QuestionBank question
  content: string; // Question statement with LaTeX/Math
  options: QuestionOption[];
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D'
  solution?: string; // Step-by-step solution
  hint?: string;
  showAnswerByDefault?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuestionBlock extends BaseContentBlock {
  type: 'question';
  content: QuestionBlockContent;
}

// 9. GeometryBlock
export interface GeometryBlockContent {
  shapeType: 'triangle' | 'circle' | 'square' | 'rectangle' | 'coordinate' | 'angle' | 'polygon';
  title?: string;
  parameters?: Record<string, any>;
  showLabels?: boolean;
  diagramSvg?: string;
}

export interface GeometryBlock extends BaseContentBlock {
  type: 'geometry';
  content: GeometryBlockContent;
}

// 10. ChartBlock
export interface ChartBlockContent {
  chartType: 'bar' | 'line' | 'pie';
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  data: Array<{ label: string; value: number }>;
}

export interface ChartBlock extends BaseContentBlock {
  type: 'chart';
  content: ChartBlockContent;
}

// 11. Model3DBlock
export interface Model3DBlockContent {
  modelType: 'cube' | 'prism' | 'cylinder' | 'sphere' | 'cone' | 'pyramid' | 'atom';
  title?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    radius?: number;
  };
  wireframe?: boolean;
  colorTheme?: string;
}

export interface Model3DBlock extends BaseContentBlock {
  type: 'model3d';
  content: Model3DBlockContent;
}

// 12. ExperimentBlock (Math Lab integration)
export interface ExperimentBlockContent {
  experimentId?: string;
  title: string;
  description?: string;
  category?: string;
}

export interface ExperimentBlock extends BaseContentBlock {
  type: 'experiment';
  content: ExperimentBlockContent;
}

// 13. GameBlock (Strictly linked: QuestionBank -> Exam/QuestionSet -> 9 Games -> GameBlock)
export interface GameBlockContent {
  gameType:
    | 'GESTURE_QUIZ_AI'
    | 'WHEEL_FORTUNE'
    | 'GOLDEN_BELL_CHALLENGE'
    | 'MILLIONAIRE_QUIZ'
    | 'CROSSWORD_PUZZLE'
    | 'MYSTERY_DOORS'
    | 'OBSTACLE_COURSE'
    | 'MATH_RACING'
    | 'MATH_ARENA';
  gameTitle: string;
  questionSetId: string; // Linked questionSet/exam id
  questionCount?: number;
  bannerImage?: string;
}

export interface GameBlock extends BaseContentBlock {
  type: 'game';
  content: GameBlockContent;
}

// Union of all Content Blocks
export type ContentBlock =
  | TextBlock
  | HeadingBlock
  | MathBlock
  | ListBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | TableBlock
  | QuestionBlock
  | GeometryBlock
  | ChartBlock
  | Model3DBlock
  | ExperimentBlock
  | GameBlock;

// Slide definition
export interface EditorSlide {
  id: string; // Unique slideId
  title: string;
  order: number;
  background?: string;
  notes?: string; // Pedagogical notes for teachers
  layout?: 'blank' | 'title-content' | 'two-column' | 'media-text' | 'question-center' | 'full-media';
  blocks: ContentBlock[];
}

// Teaching Activity definition (GDPT 2018 Pedagogical Flow)
export interface TeachingActivity {
  id: string; // Unique activityId
  title: string; // e.g. "01. KHỞI ĐỘNG"
  order: number;
  timeMinutes?: number;
  description?: string;
  slides: EditorSlide[];
}

// Overall Package for standardized Lesson Presentation
export interface LessonPresentationPackage {
  id: string;
  lessonId: string;
  title: string;
  subject: string;
  grade: number;
  bookSeries?: string;
  chapter?: string;
  period?: string;
  duration?: string;
  objectives: string[];
  teacherName?: string;
  schoolYear?: string;
  status: 'draft' | 'completed';
  createdAt: string;
  updatedAt: string;
  activities: TeachingActivity[];
}
