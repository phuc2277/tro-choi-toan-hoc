export type ComicArtStyle =
  | 'modern-comic'
  | 'anime'
  | '2d-animation'
  | 'cinematic'
  | 'infographic';

export type ComicHumorLevel =
  | 'serious'
  | 'natural'
  | 'playful'
  | 'funny'
  | 'adventurous';

export type CharacterRole = 'student' | 'teacher' | 'guide' | 'supporting';

export interface CharacterProfile {
  id: string;
  name: string;
  age: number;
  grade: string;
  role: CharacterRole;
  personality: string;
  appearance: string;
  outfit: string;
  signatureColor: string; // e.g. '#3b82f6'
  speechStyle: string;
  educationalRole: string; // e.g. 'Tò mò, hay đặt câu hỏi', 'Cẩn thận, thích suy luận'
  avatarUrl?: string;
  gender?: 'male' | 'female';
  referenceImage?: {
    imageUrl: string; // Firebase Storage download URL (không còn base64 — tránh phình state/Firestore)
    mimeType: string;
    generatedAt: string;
  };
}

export interface LessonKnowledgeProfile {
  subject: string;
  grade: string;
  chapter: string;
  lessonTitle: string;
  objectives: string[];
  coreKnowledge: string[];
  concepts: string[];
  formulas: string[];
  examples: string[];
  problemSolvingProcess: string[];
  importantDiagrams: string[];
  keyTerms: string[];
  commonMisconceptions: string[];
  teacherNotes?: string;
}

export interface StoryKernel {
  problemStatement: string; // Vấn đề trung tâm thực tiễn (Ví dụ: đo cây không thể trèo)
  protagonistNames: string[];
  goal: string;
  obstacles: string;
  knowledgeToDiscover: string; // Kiến thức cần khám phá (VD: Định lý Thales, tam giác đồng dạng)
  climax: string; // Cao trào / nút thắt suy luận
  resolution: string; // Cách giải quyết thực tế
  knowledgeConclusion: string; // Kết luận và bài học rút ra
}

export interface SpeechBubble {
  id: string;
  characterId: string;
  characterName: string;
  text: string;
  position: { x: number; y: number }; // % relative to frame
  type: 'speech' | 'thought' | 'shout' | 'whisper';
}

export interface MathFormulaLayer {
  id?: string;
  latex: string;
  label?: string;
  position: { x: number; y: number };
}

export interface FramePromptDetails {
  character: string;
  environment: string;
  action: string;
  camera: string;
  composition: string;
  lighting: string;
  emotion: string;
  educationalObject: string;
  artStyle: string;
  consistencyInfo: string;
  fullPrompt: string;
  videoPrompt: string;
}

export interface ConsistencyCheckResult {
  characterScore: number; // 0 - 100
  sceneScore: number;
  objectScore: number;
  accuracyScore: number;
  continuityScore: number;
  feedback: string;
  passed: boolean;
}

export interface AIVideoClip {
  videoUrl: string; // Firebase Storage download URL (mp4)
  mimeType: string;
  prompt: string;
  generatedAt: string;
}

export interface ComicFrame {
  frameId: string; // e.g. "SC01-F01"
  sceneId: string;
  frameNumber: number;
  title?: string;
  panelLayout?: 'wide' | 'half-left' | 'half-right' | 'full' | 'square';
  characterIds: string[];
  backgroundId: string;
  backgroundName: string;
  visualAction: string;
  speechBubbles: SpeechBubble[];
  mathFormulaLayer?: MathFormulaLayer;
  captionText?: string;
  promptDetails: FramePromptDetails;
  illustrationSceneType: 'schoolyard_tree' | 'schoolyard_measure' | 'classroom_board' | 'library_study' | 'greenhouse_plant' | 'nature_field' | 'lab_discovery';
  audioTracks?: {
    narrationText: string;
    dialogueLines: Array<{ characterId: string; text: string; durationSec: number }>;
    sfx?: string;
    durationSec: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'regenerate';
  consistencyCheck?: ConsistencyCheckResult;
  // AI Video (Veo): chỉ những khung cần chuyển động thực sự mới dùng, còn lại dùng Ken Burns
  needsAiVideo?: boolean;
  aiVideoClip?: AIVideoClip;
    generatedImage?: {
    imageUrl: string; // Firebase Storage download URL (không còn base64)
    mimeType: string;
    generatedAt: string;
  };
}

export interface GeneratedAudioClip {
  audioBase64: string; // base64-encoded WAV
  mimeType: string;
  durationSec: number;
  voiceName?: string;
}

export interface ComicScene {
  sceneId: string; // e.g. "SC01"
  sceneNumber: number; // 1 - 8
  title?: string; // tiêu đề hiển thị đầy đủ của cảnh (một số dữ liệu bài học dùng thay/kèm sceneName)
  sceneType:
    | 'opening'
    | 'problem'
    | 'questioning'
    | 'hypothesis'
    | 'discovery'
    | 'application'
    | 'result'
    | 'summary';
  sceneName: string;
  educationalGoal: string;
  environmentId: string;
  environmentName: string;
  characters: string[];
  actionDescription: string;
  dialogue: Array<{ characterId: string; characterName: string; text: string; emotion?: string }>;
  narration: string;
  knowledgeAppeared: string;
  emotion: string;
  props: string[];
  visualDescription: string;
  videoMotion: string;
  estimatedDurationSec: number;
  frames: ComicFrame[];
  // AI-generated audio (Step 7: Audio Director) — optional, filled in after real TTS/music synthesis
  narrationAudio?: GeneratedAudioClip;
  dialogueAudio?: Array<GeneratedAudioClip | null>; // index-aligned with `dialogue`
  bgmAudio?: GeneratedAudioClip;
}

export interface PedagogicalAuditReport {
  gradeLevelAppropriate: boolean;
  mathematicalAccuracy: boolean;
  conceptClarityScore: number; // 0 - 100
  pedagogyRemarks: string;
  suggestions: string[];
  approvedForClassroom: boolean;
  auditTimestamp: string;
  coreKnowledgePreserved?: boolean;
  formulasAccurate?: boolean;
  conceptsCorrect?: boolean;
  engagementScore?: number;
  comprehensionScore?: number;
  overallVerdict?: string;
  warnings?: string[];
}

export interface ComicLessonProject {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  style: ComicArtStyle;
  artStyle?: ComicArtStyle;
  humorLevel: ComicHumorLevel;
  currentStep: number; // 1 to 8
  knowledgeProfile: LessonKnowledgeProfile;
  storyKernel: StoryKernel;
  characters: CharacterProfile[];
  scenes: ComicScene[];
  pedagogicalAudit?: PedagogicalAuditReport;
  createdAt: string;
  updatedAt: string;
}