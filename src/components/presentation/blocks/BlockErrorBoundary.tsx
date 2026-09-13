import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  blockId?: string;
  blockType?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class BlockErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in block [${this.props.blockType} - ${this.props.blockId}]:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[90px] p-4 rounded-xl border border-red-200 bg-red-50/90 text-red-700 flex flex-col items-center justify-center text-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>Không thể tải khối nội dung ({this.props.blockType || 'Khối'})</span>
          </div>
          <p className="text-[11px] text-red-500 max-w-sm">
            {this.state.error?.message || 'Đã xảy ra lỗi khi hiển thị khối này.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold shadow-sm transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Thử lại</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
