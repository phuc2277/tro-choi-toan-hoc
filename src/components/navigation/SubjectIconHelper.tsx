import React from 'react';
import {
  Calculator,
  Atom,
  Compass,
  Cpu,
  Languages,
  BookOpen,
  Music,
  Palette,
  Shield,
  Globe,
  FlaskConical,
  Dna,
  Microscope,
  Trophy,
  HeartPulse,
  Wrench,
  Sparkles,
  Bot,
  Binary,
  GraduationCap,
  Scale,
  Brain,
  Feather,
  Lightbulb,
} from 'lucide-react';

export interface SubjectIconOption {
  name: string;
  label: string;
  category: string;
}

export const AVAILABLE_SUBJECT_ICONS: SubjectIconOption[] = [
  { name: 'Calculator', label: 'Toán học / Máy tính', category: 'Tự nhiên' },
  { name: 'Atom', label: 'Khoa học tự nhiên / Vật lí', category: 'Tự nhiên' },
  { name: 'FlaskConical', label: 'Hóa học / Thí nghiệm', category: 'Tự nhiên' },
  { name: 'Dna', label: 'Sinh học / Di truyền', category: 'Tự nhiên' },
  { name: 'Microscope', label: 'Kính hiển vi / Nghiên cứu', category: 'Tự nhiên' },
  { name: 'Compass', label: 'Lịch sử & Địa lí', category: 'Xã hội' },
  { name: 'Globe', label: 'Địa lí thế giới', category: 'Xã hội' },
  { name: 'BookOpen', label: 'Ngữ văn / Tiếng Việt', category: 'Ngôn ngữ' },
  { name: 'Languages', label: 'Ngoại ngữ / Tiếng Anh', category: 'Ngôn ngữ' },
  { name: 'Cpu', label: 'Tin học / Khoa học máy tính', category: 'Công nghệ' },
  { name: 'Binary', label: 'Lập trình / Dữ liệu', category: 'Công nghệ' },
  { name: 'Bot', label: 'Trí tuệ nhân tạo / Robotics', category: 'Công nghệ' },
  { name: 'Wrench', label: 'Công nghệ / Kĩ thuật', category: 'Công nghệ' },
  { name: 'Shield', label: 'Giáo dục công dân / Quốc phòng', category: 'Xã hội' },
  { name: 'Scale', label: 'Pháp luật / Đạo đức', category: 'Xã hội' },
  { name: 'Music', label: 'Âm nhạc / Nghệ thuật', category: 'Nghệ thuật' },
  { name: 'Palette', label: 'Mĩ thuật / Hội họa', category: 'Nghệ thuật' },
  { name: 'Trophy', label: 'Giáo dục thể chất / Thể thao', category: 'Kỹ năng' },
  { name: 'HeartPulse', label: 'Sức khỏe / Sinh hoạt lớp', category: 'Kỹ năng' },
  { name: 'Brain', label: 'Kĩ năng sống / Tư duy', category: 'Kỹ năng' },
  { name: 'Sparkles', label: 'Hoạt động trải nghiệm / Hướng nghiệp', category: 'Khác' },
  { name: 'Lightbulb', label: 'Sáng tạo / STEM', category: 'Khác' },
  { name: 'GraduationCap', label: 'Tổng hợp / Ôn thi', category: 'Khác' },
];

export const AVAILABLE_GRADIENTS = [
  { id: 'teal', name: 'Ngọc lục bảo (Teal)', gradient: 'from-teal-600 to-emerald-600', badgeColor: 'bg-teal-50 text-teal-800 border-teal-200' },
  { id: 'blue', name: 'Xanh dương (Blue/Indigo)', gradient: 'from-blue-600 to-indigo-600', badgeColor: 'bg-blue-50 text-blue-800 border-blue-200' },
  { id: 'purple', name: 'Tím oải hương (Purple/Fuchsia)', gradient: 'from-purple-600 to-pink-600', badgeColor: 'bg-purple-50 text-purple-800 border-purple-200' },
  { id: 'amber', name: 'Cam hổ phách (Amber/Orange)', gradient: 'from-amber-600 to-orange-600', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'rose', name: 'Đỏ hoa hồng (Rose/Red)', gradient: 'from-rose-600 to-red-600', badgeColor: 'bg-rose-50 text-rose-800 border-rose-200' },
  { id: 'cyan', name: 'Xanh lơ biển (Cyan/Sky)', gradient: 'from-cyan-600 to-blue-600', badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  { id: 'emerald', name: 'Xanh lá tươi (Emerald/Green)', gradient: 'from-emerald-600 to-teal-700', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'violet', name: 'Tím đậm hoàng gia (Violet/Indigo)', gradient: 'from-violet-700 to-purple-800', badgeColor: 'bg-violet-50 text-violet-800 border-violet-200' },
];

export const renderSubjectIcon = (iconName: string, className = 'w-4 h-4') => {
  switch (iconName) {
    case 'Calculator':
      return <Calculator className={className} />;
    case 'Atom':
      return <Atom className={className} />;
    case 'FlaskConical':
      return <FlaskConical className={className} />;
    case 'Dna':
      return <Dna className={className} />;
    case 'Microscope':
      return <Microscope className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Languages':
      return <Languages className={className} />;
    case 'Cpu':
      return <Cpu className={className} />;
    case 'Binary':
      return <Binary className={className} />;
    case 'Bot':
      return <Bot className={className} />;
    case 'Wrench':
      return <Wrench className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Scale':
      return <Scale className={className} />;
    case 'Music':
      return <Music className={className} />;
    case 'Palette':
      return <Palette className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Brain':
      return <Brain className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Lightbulb':
      return <Lightbulb className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    default:
      return <BookOpen className={className} />;
  }
};
