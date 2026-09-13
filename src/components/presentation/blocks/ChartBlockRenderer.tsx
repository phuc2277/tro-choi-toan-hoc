import React from 'react';
import { ChartBlock } from '../../../types/contentBlock';
import { BarChart3 } from 'lucide-react';

interface ChartBlockRendererProps {
  block: ChartBlock;
  isEditor?: boolean;
  onUpdate?: (updatedContent: ChartBlock['content']) => void;
}

export const ChartBlockRenderer: React.FC<ChartBlockRendererProps> = ({
  block,
  isEditor = false,
  onUpdate,
}) => {
  const { content } = block;
  const data = content.data || [
    { label: 'Tổ 1', value: 8 },
    { label: 'Tổ 2', value: 12 },
    { label: 'Tổ 3', value: 9 },
    { label: 'Tổ 4', value: 15 },
  ];

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full h-full p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>{content.title || 'Biểu đồ Thống kê / Dữ liệu'}</span>
        </div>
        {isEditor && (
          <select
            value={content.chartType}
            onChange={(e) => onUpdate?.({ ...content, chartType: e.target.value as any })}
            className="text-[11px] px-2 py-0.5 border border-slate-200 rounded-lg bg-slate-50 font-bold"
          >
            <option value="bar">Biểu đồ Cột</option>
            <option value="line">Biểu đồ Đoạn thẳng</option>
          </select>
        )}
      </div>

      {/* Chart visualization */}
      <div className="flex-1 flex items-end justify-around gap-2 px-4 py-3 min-h-[120px]">
        {data.map((item, idx) => {
          const heightPercent = Math.max(10, Math.round((item.value / maxValue) * 100));
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[11px] font-bold text-indigo-600">{item.value}</span>
              <div
                style={{ height: `${heightPercent}%` }}
                className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-indigo-600 to-teal-400 transition-all duration-500 shadow-sm"
              />
              <span className="text-[10px] font-bold text-slate-600 truncate max-w-[60px] text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-slate-500 text-center pt-1 border-t border-slate-100">
        {content.xAxisLabel || 'Trục hoành: Đối tượng'} • {content.yAxisLabel || 'Trục tung: Tần số'}
      </div>
    </div>
  );
};
