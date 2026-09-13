import React, { useState } from 'react';
import { LessonKnowledgeProfile } from '../../types/comicLesson';
import {
  FileText,
  Upload,
  Sparkles,
  BookOpen,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ListOrdered,
  Plus,
  Trash2,
} from 'lucide-react';

interface Step1KnowledgeProfileProps {
  knowledgeProfile: LessonKnowledgeProfile;
  onUpdateKnowledgeProfile: (updated: LessonKnowledgeProfile) => void;
  onNextStep: () => void;
}

export const Step1KnowledgeProfile: React.FC<Step1KnowledgeProfileProps> = ({
  knowledgeProfile,
  onUpdateKnowledgeProfile,
  onNextStep,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [directInputText, setDirectInputText] = useState('');
  const [selectedSample, setSelectedSample] = useState<string>('math8-thales');
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'rawSource'>('profile');
  const [attachedFile, setAttachedFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(';base64,') ? result.split(';base64,')[1] : result;
      setAttachedFile({ name: file.name, base64, mimeType: file.type || '' });
      setDirectInputText('');
    };
    reader.readAsDataURL(file);
  };

  // Handle sample selection
  const handleLoadSample = (sampleKey: string) => {
    setSelectedSample(sampleKey);
    if (sampleKey === 'math8-thales') {
      onUpdateKnowledgeProfile({
        subject: 'Toán học',
        grade: 'Lớp 8',
        chapter: 'Chương 4: Định lý Thales trong tam giác',
        lessonTitle: 'Bài 15: Định lý Thales và Ứng dụng thực tế đo chiều cao',
        objectives: [
          'Nắm vững nội dung định lý Thales trong tam giác và hệ quả tỉ lệ thức.',
          'Vận dụng bóng của ánh sáng mặt trời để thiết lập tam giác đồng dạng đo gián tiếp chiều cao vật thể.',
          'Rèn luyện năng lực giải quyết vấn đề toán học và tư duy mô hình hóa thực tiễn.',
        ],
        coreKnowledge: [
          'Nếu một đường thẳng song song với một cạnh của tam giác và cắt hai cạnh còn lại thì nó định ra trên hai cạnh đó những đoạn thẳng tương ứng tỉ lệ.',
          'Hệ quả: Các tia sáng mặt trời xem như song song, tạo nên hai tam giác vuông có các cạnh góc vuông tỉ lệ thuận: Chiều cao cọc / Chiều cao cây = Bóng cọc / Bóng cây.',
        ],
        concepts: [
          'Đoạn thẳng tỉ lệ',
          'Định lý Thales thuận và đảo',
          'Tia sáng song song của mặt trời lúc cùng một thời điểm',
          'Đo đạc gián tiếp',
        ],
        formulas: [
          '\\frac{A\'B\'}{AB} = \\frac{A\'C\'}{AC} = \\frac{B\'C\'}{BC}',
          'h_{cây} = h_{cọc} \\times \\frac{L_{bóng cây}}{L_{bóng cọc}}',
        ],
        examples: [
          'Một chiếc cọc cao 1.5m có bóng dài 2m. Cùng lúc đó bóng của cây cổ thụ dài 12m. Tính chiều cao cây: h = 1.5 * (12 / 2) = 9m.',
        ],
        problemSolvingProcess: [
          'Bước 1: Cắm cọc tiêu thẳng đứng vuông góc với mặt đất.',
          'Bước 2: Đo độ cao phần cọc nổi trên mặt đất (h1).',
          'Bước 3: Đo chiều dài bóng của cọc trên mặt đất cùng thời điểm (b1).',
          'Bước 4: Đo chiều dài bóng của cây cổ thụ (b2).',
          'Bước 5: Áp dụng tỉ số định lý Thales để suy ra chiều cao cây: H = h1 * (b2 / b1).',
        ],
        importantDiagrams: [
          'Mô hình hai tam giác vuông đồng dạng tạo bởi cây và cọc dưới tia nắng song song.',
        ],
        keyTerms: [
          'Định lý Thales (Thales\'s Theorem)',
          'Tỉ lệ thức (Proportion)',
          'Đo gián tiếp (Indirect Measurement)',
        ],
        commonMisconceptions: [
          'Học sinh đo bóng của cọc và bóng của cây ở hai thời điểm khác nhau (mặt trời thay đổi góc chiếu làm sai tỉ số).',
          'Cọc bị cắm xiên không vuông góc với mặt đất.',
        ],
        teacherNotes: 'Nguồn sách giáo khoa Toán 8 - Kết nối tri thức với cuộc sống. Ưu tiên bài toán đo cây thực tế.',
      });
    } else if (sampleKey === 'science7-photosynthesis') {
      onUpdateKnowledgeProfile({
        subject: 'Khoa học tự nhiên',
        grade: 'Lớp 7',
        chapter: 'Chương 7: Trao đổi chất và chuyển hóa năng lượng ở sinh vật',
        lessonTitle: 'Bài 23: Quang hợp ở thực vật và vai trò đối với sự sống',
        objectives: [
          'Nêu được khái niệm, phương trình tổng quát của quang hợp ở thực vật.',
          'Giải thích được vai trò của diệp lục, nước, ánh sáng và khí carbon dioxide trong quang hợp.',
          'Nhận thức được ý nghĩa của việc trồng và bảo vệ cây xanh trong môi trường học đường.',
        ],
        coreKnowledge: [
          'Quang hợp là quá trình lá cây sử dụng năng lượng ánh sáng mặt trời được lục lạp hấp thụ để tổng hợp chất hữu cơ (glucose/tinh bột) từ nước và khí carbon dioxide, đồng thời giải phóng khí oxygen.',
          'Phương trình: Nước + Carbon dioxide + Ánh sáng mặt trời (Diệp lục) -> Chất hữu cơ + Khí Oxygen.',
        ],
        concepts: ['Lục lạp (Chloroplast)', 'Diệp lục (Chlorophyll)', 'Khí khổng (Stomata)', 'Quang hợp (Photosynthesis)'],
        formulas: ['6CO_2 + 6H_2O \\xrightarrow[diệp\\ lục]{ánh\\ sáng} C_6H_{12}O_6 + 6O_2'],
        examples: [
          'Thí nghiệm bịt một phần lá bằng băng dính đen, sau đó ngâm cồn và thử iod: phần được chiếu sáng đổi màu xanh tím đặc trưng của tinh bột.',
        ],
        problemSolvingProcess: [
          'Bước 1: Quan sát hiện tượng cây bị thiếu nắng héo vàng.',
          'Bước 2: Thiết kế thí nghiệm đối chứng có ánh sáng và che tối.',
          'Bước 3: Thu khí thoát ra từ cây thủy sinh để thử que đóm bùng cháy (khí O2).',
          'Bước 4: Kết luận vai trò sinh mệnh của quang hợp.',
        ],
        importantDiagrams: ['Cấu tạo lá cây, tế bào lục lạp hấp thụ ánh sáng và trao đổi khí qua khí khổng.'],
        keyTerms: ['Quang hợp', 'Khí khổng', 'Chất hữu cơ', 'Oxygen', 'Diệp lục'],
        commonMisconceptions: ['Học sinh nghĩ cây chỉ quang hợp vào ban ngày và ban đêm cây "ngừng thở". Cây hô hấp 24/24!'],
        teacherNotes: 'Tài liệu SGK KHTN 7 - Cánh Diều. Thích hợp truyện tranh phiêu lưu sinh học tại nhà kính trường.',
      });
    }
  };

  // AI Analysis from uploaded file (PDF/DOCX/PPTX/Image) or pasted text
  const handleAnalyzeWithAI = async () => {
    if (!directInputText.trim() && !attachedFile) {
      setAnalyzeError('Vui lòng tải lên tệp hoặc dán nội dung bài học trước khi phân tích.');
      return;
    }
    setAnalyzeError(null);
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/comic/analyze-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: directInputText,
          fileBase64: attachedFile?.base64 || '',
          mimeType: attachedFile?.mimeType || '',
          originalName: attachedFile?.name || '',
          subject: knowledgeProfile.subject,
          grade: knowledgeProfile.grade,
        }),
      });

      const data = await res.json();
      if (res.ok && data.knowledgeProfile) {
        onUpdateKnowledgeProfile(data.knowledgeProfile);
      } else {
        setAnalyzeError(data.error || 'AI không thể phân tích nguồn tài liệu này. Vui lòng thử lại.');
      }
    } catch {
      setAnalyzeError('Lỗi kết nối tới máy chủ AI. Vui lòng kiểm tra mạng và thử lại.');
    } finally {
      setIsAnalyzing(false);
      setActiveSubTab('profile');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: GDPT 2018 Pedagogical Core */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-xs uppercase tracking-wider border border-cyan-400/40">
              BƯỚC 1 — HỒ SƠ KIẾN THỨC BÀI HỌC
            </span>
            <span className="text-xs text-slate-400 font-medium">GDPT 2018 THCS</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Nhập Nguồn & Thẩm Định Hồ Sơ Kiến Thức Trọng Tâm
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            AI coi tài liệu của giáo viên là <strong>nguồn kiến thức ưu tiên tuyệt đối</strong>. Mọi định nghĩa, công thức, số liệu và quy trình giải quyết vấn đề đều được bóc tách chuẩn xác trước khi viết truyện tranh.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex flex-col gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Chọn Bài Học Mẫu Chuẩn GDPT:
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleLoadSample('math8-thales')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedSample === 'math8-thales'
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              📐 Toán 8: Định lý Thales
            </button>
            <button
              onClick={() => handleLoadSample('science7-photosynthesis')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedSample === 'science7-photosynthesis'
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              🌱 KHTN 7: Quang Hợp
            </button>
          </div>
        </div>
      </div>

      {/* Input Options: Upload File or Direct Text */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Upload / Direct Input */}
        <div className="lg:col-span-1 space-y-4">
          <div className="eduverse-glass p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Tải Lên Giáo Án / SGK
              </h3>
            </div>

            <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/40 group">
              <FileText className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition-colors mb-2" />
              <span className="text-xs font-bold text-slate-300 text-center">
                Kéo thả hoặc bấm để tải lên
              </span>
              <span className="text-[11px] text-slate-500 text-center mt-1">
                Hỗ trợ PDF, DOCX, PPTX, TXT (tối đa 25MB)
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelected(file);
                  }
                }}
              />
            </label>

            {attachedFile && (
              <div className="mt-2 px-3 py-2 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-2">
                <span className="text-[11px] text-cyan-200 font-bold truncate">📎 {attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="text-[11px] text-slate-400 hover:text-rose-400 font-bold shrink-0 cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Hoặc Dán Nội Dung Trực Tiếp:
              </label>
              <textarea
                rows={5}
                value={directInputText}
                onChange={(e) => {
                  setDirectInputText(e.target.value);
                  if (e.target.value) setAttachedFile(null);
                }}
                placeholder="Dán nội dung bài học từ SGK, giáo án CV 5512, hoặc ghi chú của thầy cô..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors resize-none"
              />
            </div>

            <button
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? 'AI Đang Bóc Tách Hồ Sơ...' : 'AI Phân Tích & Cập Nhật Hồ Sơ'}
            </button>

            {analyzeError && (
              <p className="mt-2 text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg px-2.5 py-1.5 leading-relaxed">
                {analyzeError}
              </p>
            )}
          </div>

          {/* Quick Stats on Knowledge Profile */}
          <div className="eduverse-glass p-4 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Chỉ Số Hồ Sơ Kiến Thức:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-base font-black text-cyan-400">
                  {knowledgeProfile.formulas.length}
                </span>
                <p className="text-[10px] text-slate-400 uppercase">Công Thức</p>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-base font-black text-emerald-400">
                  {knowledgeProfile.concepts.length}
                </span>
                <p className="text-[10px] text-slate-400 uppercase">Khái Niệm</p>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-base font-black text-amber-400">
                  {knowledgeProfile.problemSolvingProcess.length}
                </span>
                <p className="text-[10px] text-slate-400 uppercase">Bước Quy Trình</p>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-base font-black text-purple-400">
                  {knowledgeProfile.commonMisconceptions.length}
                </span>
                <p className="text-[10px] text-slate-400 uppercase">Cảnh Báo Lỗi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Editable "HỒ SƠ KIẾN THỨC BÀI HỌC" */}
        <div className="lg:col-span-2 space-y-4">
          <div className="eduverse-glass p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    HỒ SƠ KIẾN THỨC BÀI HỌC
                  </h3>
                  <p className="text-xs text-slate-400">
                    Giáo viên có thể chỉnh sửa trực tiếp các trường bên dưới
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn GDPT 2018
                </span>
              </div>
            </div>

            {/* General Info Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Môn Học
                </label>
                <input
                  type="text"
                  value={knowledgeProfile.subject}
                  onChange={(e) =>
                    onUpdateKnowledgeProfile({ ...knowledgeProfile, subject: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/60"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Khối Lớp
                </label>
                <input
                  type="text"
                  value={knowledgeProfile.grade}
                  onChange={(e) =>
                    onUpdateKnowledgeProfile({ ...knowledgeProfile, grade: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/60"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Chương
                </label>
                <input
                  type="text"
                  value={knowledgeProfile.chapter}
                  onChange={(e) =>
                    onUpdateKnowledgeProfile({ ...knowledgeProfile, chapter: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/60"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Tên Bài Học
              </label>
              <input
                type="text"
                value={knowledgeProfile.lessonTitle}
                onChange={(e) =>
                  onUpdateKnowledgeProfile({ ...knowledgeProfile, lessonTitle: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            {/* Objectives */}
            <div className="mt-5 space-y-2">
              <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> 1. Mục Tiêu Bài Học (Năng Lực & Phẩm Chất):
              </label>
              {knowledgeProfile.objectives.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 text-xs flex items-center justify-center shrink-0 font-bold">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => {
                      const next = [...knowledgeProfile.objectives];
                      next[idx] = e.target.value;
                      onUpdateKnowledgeProfile({ ...knowledgeProfile, objectives: next });
                    }}
                    className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
              ))}
            </div>

            {/* Core Knowledge */}
            <div className="mt-5 space-y-2">
              <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> 2. Kiến Thức Trọng Tâm (Bất Biến):
              </label>
              {knowledgeProfile.coreKnowledge.map((item, idx) => (
                <textarea
                  key={idx}
                  rows={2}
                  value={item}
                  onChange={(e) => {
                    const next = [...knowledgeProfile.coreKnowledge];
                    next[idx] = e.target.value;
                    onUpdateKnowledgeProfile({ ...knowledgeProfile, coreKnowledge: next });
                  }}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 resize-none leading-relaxed"
                />
              ))}
            </div>

            {/* Formulas & LaTeX */}
            <div className="mt-5 space-y-2">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 3. Công Thức & Ký Hiệu Toán Học / Khoa Học (LaTeX):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {knowledgeProfile.formulas.map((formula, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-mono">Công thức #{idx + 1}</span>
                    <input
                      type="text"
                      value={formula}
                      onChange={(e) => {
                        const next = [...knowledgeProfile.formulas];
                        next[idx] = e.target.value;
                        onUpdateKnowledgeProfile({ ...knowledgeProfile, formulas: next });
                      }}
                      className="w-full mt-1 bg-slate-950 font-mono text-xs text-amber-200 px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Problem Solving Steps */}
            <div className="mt-5 space-y-2">
              <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5" /> 4. Quy Trình Giải Quyết Vấn Đề (Các Bước Thực Hành):
              </label>
              {knowledgeProfile.problemSolvingProcess.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black flex items-center justify-center shrink-0">
                    B{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => {
                      const next = [...knowledgeProfile.problemSolvingProcess];
                      next[idx] = e.target.value;
                      onUpdateKnowledgeProfile({ ...knowledgeProfile, problemSolvingProcess: next });
                    }}
                    className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
              ))}
            </div>

            {/* Common Misconceptions Warning */}
            <div className="mt-5 p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2">
              <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> 5. Những Lỗi Học Sinh Thường Nhầm Lẫn (Cần Đưa Vào Kịch Bản Để Khắc Phục):
              </label>
              {knowledgeProfile.commonMisconceptions.map((misc, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 mt-1">•</span>
                  <p className="text-xs text-rose-200 leading-relaxed font-medium">
                    {misc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button: Proceed to Step 2 */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onNextStep}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-cyan-900/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Xác Nhận Hồ Sơ & Sang Bước 2: Hạt Nhân Câu Chuyện</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};