import React, { useEffect, useRef, useState, useCallback } from 'react';

export type TeachingTool = 'pointer' | 'laser' | 'pen' | 'highlighter' | 'eraser';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  tool: 'pen' | 'highlighter';
  color: string;
  width: number;
  points: StrokePoint[];
}

interface LiveTeachingCanvasProps {
  currentSlideId: string;
  tool: TeachingTool;
  penColor: string;
  penWidth: number;
  highlighterColor: string;
  highlighterWidth: number;
  strokesMap: Record<string, DrawingStroke[]>;
  onStrokesChange: (slideId: string, strokes: DrawingStroke[]) => void;
  laserPosition: { x: number; y: number } | null;
  onLaserMove: (pos: { x: number; y: number } | null) => void;
}

export const LiveTeachingCanvas: React.FC<LiveTeachingCanvasProps> = ({
  currentSlideId,
  tool,
  penColor,
  penWidth,
  highlighterColor,
  highlighterWidth,
  strokesMap,
  onStrokesChange,
  laserPosition,
  onLaserMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<StrokePoint[]>([]);

  // Current slide's strokes
  const currentStrokes = strokesMap[currentSlideId] || [];

  // Redraw all strokes on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved strokes
    currentStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.45;
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.stroke();
      ctx.restore();
    });

    // Draw active drawing in-progress
    if (isDrawingRef.current && currentPointsRef.current.length >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(currentPointsRef.current[0].x, currentPointsRef.current[0].y);
      for (let i = 1; i < currentPointsRef.current.length; i++) {
        ctx.lineTo(currentPointsRef.current[i].x, currentPointsRef.current[i].y);
      }

      const isHighlighter = tool === 'highlighter';
      ctx.strokeStyle = isHighlighter ? highlighterColor : penColor;
      ctx.lineWidth = isHighlighter ? highlighterWidth : penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (isHighlighter) {
        ctx.globalAlpha = 0.45;
      } else {
        ctx.globalAlpha = 1;
      }

      ctx.stroke();
      ctx.restore();
    }
  }, [currentStrokes, tool, penColor, penWidth, highlighterColor, highlighterWidth]);

  // Adjust canvas size to parent container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        redrawCanvas();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  // Redraw when strokes or slide changes
  useEffect(() => {
    redrawCanvas();
  }, [currentSlideId, currentStrokes, redrawCanvas]);

  // Pointer event handlers for drawing and laser
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'pointer') return;

    if (tool === 'laser') {
      const coords = getCanvasCoords(e);
      if (coords) onLaserMove(coords);
      return;
    }

    if (tool === 'eraser') {
      const coords = getCanvasCoords(e);
      if (!coords) return;
      // Erase stroke if point is near any stroke segment
      const eraserRadius = 24;
      const remaining = currentStrokes.filter((stroke) => {
        return !stroke.points.some(
          (pt) => Math.hypot(pt.x - coords.x, pt.y - coords.y) < eraserRadius
        );
      });
      if (remaining.length !== currentStrokes.length) {
        onStrokesChange(currentSlideId, remaining);
      }
      return;
    }

    if (tool === 'pen' || tool === 'highlighter') {
      const coords = getCanvasCoords(e);
      if (!coords) return;
      isDrawingRef.current = true;
      currentPointsRef.current = [coords];
      redrawCanvas();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'pointer') return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    if (tool === 'laser') {
      onLaserMove(coords);
      return;
    }

    if (tool === 'eraser' && (e.buttons === 1 || e.pressure > 0)) {
      const eraserRadius = 24;
      const remaining = currentStrokes.filter((stroke) => {
        return !stroke.points.some(
          (pt) => Math.hypot(pt.x - coords.x, pt.y - coords.y) < eraserRadius
        );
      });
      if (remaining.length !== currentStrokes.length) {
        onStrokesChange(currentSlideId, remaining);
      }
      return;
    }

    if ((tool === 'pen' || tool === 'highlighter') && isDrawingRef.current) {
      currentPointsRef.current.push(coords);
      redrawCanvas();
    }
  };

  const handlePointerUp = () => {
    if (tool === 'laser') {
      return;
    }

    if (isDrawingRef.current && (tool === 'pen' || tool === 'highlighter')) {
      if (currentPointsRef.current.length >= 2) {
        const newStroke: DrawingStroke = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tool,
          color: tool === 'highlighter' ? highlighterColor : penColor,
          width: tool === 'highlighter' ? highlighterWidth : penWidth,
          points: [...currentPointsRef.current],
        };
        onStrokesChange(currentSlideId, [...currentStrokes, newStroke]);
      }
    }

    isDrawingRef.current = false;
    currentPointsRef.current = [];
    redrawCanvas();
  };

  const handlePointerLeave = () => {
    if (tool === 'laser') {
      onLaserMove(null);
    }
    if (isDrawingRef.current) {
      handlePointerUp();
    }
  };

  const isInteractive = tool !== 'pointer';

  return (
    <div className={`absolute inset-0 z-30 ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="w-full h-full block"
        style={{
          cursor:
            tool === 'pointer'
              ? 'default'
              : tool === 'laser'
              ? 'none'
              : tool === 'pen'
              ? 'crosshair'
              : tool === 'highlighter'
              ? 'cell'
              : tool === 'eraser'
              ? 'pointer'
              : 'default',
        }}
      />

      {/* Laser Pointer Glow Effect Element */}
      {tool === 'laser' && laserPosition && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
          style={{
            left: `${laserPosition.x}px`,
            top: `${laserPosition.y}px`,
          }}
        >
          {/* Outer Pulsing Aura */}
          <div className="w-10 h-10 rounded-full bg-red-500/30 blur-sm animate-ping absolute -inset-1" />
          {/* Intense Neon Core */}
          <div className="w-6 h-6 rounded-full bg-red-500/60 blur-xs relative flex items-center justify-center shadow-[0_0_20px_#ef4444]">
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#fff]" />
          </div>
        </div>
      )}
    </div>
  );
};
