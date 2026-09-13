import React from 'react';
import { ContentBlock } from '../../../types/contentBlock';
import { BlockErrorBoundary } from './BlockErrorBoundary';
import { TextBlockRenderer } from './TextBlockRenderer';
import { HeadingBlockRenderer } from './HeadingBlockRenderer';
import { MathBlockRenderer } from './MathBlockRenderer';
import { ImageBlockRenderer } from './ImageBlockRenderer';
import { VideoBlockRenderer } from './VideoBlockRenderer';
import { AudioBlockRenderer } from './AudioBlockRenderer';
import { TableBlockRenderer } from './TableBlockRenderer';
import { ListBlockRenderer } from './ListBlockRenderer';
import { QuestionBlockRenderer } from './QuestionBlockRenderer';
import { GeometryBlockRenderer } from './GeometryBlockRenderer';
import { ChartBlockRenderer } from './ChartBlockRenderer';
import { Model3DBlockRenderer } from './Model3DBlockRenderer';
import { ExperimentBlockRenderer } from './ExperimentBlockRenderer';
import { GameBlockRenderer } from './GameBlockRenderer';

interface BlockRendererProps {
  block: ContentBlock;
  isEditor?: boolean;
  isDarkTheme?: boolean;
  onUpdate?: (updatedContent: any) => void;
  onOpenQuestionBankModal?: (blockId: string) => void;
  onOpenGameSelectModal?: (blockId: string) => void;
  onLaunchGame?: (gameType: string, questionSetId: string) => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  isEditor = false,
  isDarkTheme = !isEditor,
  onUpdate,
  onOpenQuestionBankModal,
  onOpenGameSelectModal,
  onLaunchGame,
}) => {
  // If hidden in presentation mode, do not render
  if (!block.visible && !isEditor) {
    return null;
  }

  const renderComponent = () => {
    switch (block.type) {
      case 'text':
        return <TextBlockRenderer block={block} isEditor={isEditor} isDarkTheme={isDarkTheme} onUpdate={onUpdate} />;
      case 'heading':
        return <HeadingBlockRenderer block={block} isEditor={isEditor} isDarkTheme={isDarkTheme} onUpdate={onUpdate} />;
      case 'math':
        return <MathBlockRenderer block={block} isEditor={isEditor} isDarkTheme={isDarkTheme} onUpdate={onUpdate} />;
      case 'image':
        return <ImageBlockRenderer block={block} isEditor={isEditor} onUpdate={onUpdate} />;
      case 'video':
        return <VideoBlockRenderer block={block} isEditor={isEditor} onUpdate={onUpdate} />;
      case 'audio':
        return <AudioBlockRenderer block={block} isEditor={isEditor} onUpdate={onUpdate} />;
      case 'table':
        return <TableBlockRenderer block={block} isEditor={isEditor} isDarkTheme={isDarkTheme} onUpdate={onUpdate} />;
      case 'list':
        return <ListBlockRenderer block={block} isEditor={isEditor} isDarkTheme={isDarkTheme} onUpdate={onUpdate} />;
      case 'question':
        return (
          <QuestionBlockRenderer
            block={block}
            isEditor={isEditor}
            onUpdate={onUpdate}
            onOpenQuestionBankModal={() => onOpenQuestionBankModal?.(block.id)}
          />
        );
      case 'geometry':
        return <GeometryBlockRenderer block={block} isEditor={isEditor} onUpdate={onUpdate} />;
      case 'chart':
        return <ChartBlockRenderer block={block} isEditor={isEditor} onUpdate={onUpdate} />;
      case 'model3d':
        return <Model3DBlockRenderer block={block} isEditor={isEditor} onUpdate={onUpdate} />;
      case 'experiment':
        return <ExperimentBlockRenderer block={block} isEditor={isEditor} onUpdate={onUpdate} />;
      case 'game':
        return (
          <GameBlockRenderer
            block={block}
            isEditor={isEditor}
            onUpdate={onUpdate}
            onOpenGameSelectModal={() => onOpenGameSelectModal?.(block.id)}
            onLaunchGame={onLaunchGame}
          />
        );
      default:
        return (
          <div className="p-3 text-xs text-slate-500 bg-slate-100 rounded-lg">
            Khối chưa xác định ({(block as any).type})
          </div>
        );
    }
  };

  return (
    <BlockErrorBoundary blockId={block.id} blockType={block.type}>
      <div
        className={`w-full h-full ${
          !block.visible && isEditor ? 'opacity-40 ring-1 ring-dashed ring-amber-400' : ''
        }`}
      >
        {renderComponent()}
      </div>
    </BlockErrorBoundary>
  );
};
