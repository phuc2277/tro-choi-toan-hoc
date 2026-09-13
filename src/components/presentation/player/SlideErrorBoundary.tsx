import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface SlideErrorBoundaryProps {
  children: ReactNode;
  slideId?: string;
  slideOrder?: number;
}

export interface SlideErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SlideErrorBoundary extends Component<SlideErrorBoundaryProps, SlideErrorBoundaryState> {
  constructor(props: SlideErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): SlideErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Slide Render Error in Slide #' + this.props.slideOrder, error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-900 text-white rounded-3xl border border-rose-800/40">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/50">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-white mb-1">
            Không thể hiển thị slide #{this.props.slideOrder || '?'}
          </h3>
          <p className="text-xs text-rose-300/90 max-w-md text-center mb-4">
            Đã xảy ra sự cố khi kết xuất nội dung của slide này. Các slide khác trong bài giảng vẫn hoạt động bình thường.
          </p>
          <div className="p-3 bg-black/40 rounded-xl font-mono text-[11px] text-slate-400 max-w-lg overflow-x-auto mb-6 border border-white/10">
            {this.state.error?.message || 'Lỗi dữ liệu slide không tương thích'}
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử tải lại slide</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
