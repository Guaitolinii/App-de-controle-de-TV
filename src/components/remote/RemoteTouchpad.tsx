import React, { useRef, useState, useEffect } from 'react';
import { MousePointer, RotateCcw, ArrowUpDown, CornerDownLeft, Sparkles } from 'lucide-react';
import { feedback } from '../../services/feedback';

interface RemoteTouchpadProps {
  onMovePointer: (dx: number, dy: number) => void;
  onClickPointer: () => void;
  onBack: () => void;
  onScroll: (delta: number) => void;
  onResetPointer: () => void;
}

export const RemoteTouchpad: React.FC<RemoteTouchpadProps> = ({
  onMovePointer,
  onClickPointer,
  onBack,
  onScroll,
  onResetPointer,
}) => {
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastTouchRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastTouchRef.current) return;
    const dx = e.clientX - lastTouchRef.current.x;
    const dy = e.clientY - lastTouchRef.current.y;
    lastTouchRef.current = { x: e.clientX, y: e.clientY };
    onMovePointer(dx * 0.4, dy * 0.4);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    lastTouchRef.current = null;
  };

  // Touch Handlers for mobile screens
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      // Double tap detector
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        feedback.playClick('standard');
        onBack();
      }
      lastTapRef.current = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !lastTouchRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const dx = touch.clientX - lastTouchRef.current.x;
    const dy = touch.clientY - lastTouchRef.current.y;
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    onMovePointer(dx * 0.4, dy * 0.4);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchRef.current = null;
  };

  return (
    <div className="flex flex-col items-center w-full px-5 py-2">
      {/* Top Touchpad Header */}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-semibold">
          <MousePointer className="w-3.5 h-3.5 text-pink-400" />
          <span>Magic Mouse Touchpad</span>
        </div>
        <button
          onClick={() => {
            feedback.playClick('standard');
            onResetPointer();
          }}
          className="text-[10px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800/80 hover:bg-neutral-700/80"
        >
          Centralizar Ponteiro
        </button>
      </div>

      {/* Main Touch Area */}
      <div className="relative w-full flex gap-2">
        {/* Trackpad Surface */}
        <div
          ref={padRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative flex-1 h-56 rounded-2xl bg-gradient-to-b from-neutral-800/90 to-neutral-900 border transition-all duration-150 select-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center p-4 overflow-hidden ${
            isDragging
              ? 'border-pink-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-pink-500/30'
              : 'border-white/10 shadow-inner hover:border-white/20'
          }`}
        >
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.04),transparent_60%)] pointer-events-none" />

          {/* Trackpad guides */}
          <div className="flex flex-col items-center text-center space-y-1 pointer-events-none opacity-60">
            <div className="w-10 h-10 rounded-full border border-dashed border-pink-400/40 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-pink-400" />
            </div>
            <p className="text-xs font-medium text-neutral-300">Deslize para mover o ponteiro</p>
            <p className="text-[10px] text-neutral-500">Toque rápido = Clique • 2 toques = Voltar</p>
          </div>
        </div>

        {/* Vertical Scroll Strip */}
        <div className="w-11 h-56 rounded-2xl bg-neutral-800/80 border border-white/10 p-1 flex flex-col justify-between items-center shadow-md">
          <button
            onClick={() => {
              feedback.playClick('nav');
              onScroll(-50);
            }}
            className="w-8 h-10 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 active:scale-90"
            title="Rolar para Cima"
          >
            ▲
          </button>
          <div className="text-[8px] font-bold text-neutral-500 rotate-90 tracking-widest uppercase">
            SCROLL
          </div>
          <button
            onClick={() => {
              feedback.playClick('nav');
              onScroll(50);
            }}
            className="w-8 h-10 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 active:scale-90"
            title="Rolar para Baixo"
          >
            ▼
          </button>
        </div>
      </div>

      {/* Bottom Mouse Action Buttons */}
      <div className="grid grid-cols-2 gap-2 w-full mt-3">
        <button
          onClick={() => {
            feedback.playClick('standard');
            onClickPointer();
          }}
          className="py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
          <span>Clique do Mouse</span>
        </button>

        <button
          onClick={() => {
            feedback.playClick('standard');
            onBack();
          }}
          className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs border border-white/5 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Voltar (Back)</span>
        </button>
      </div>
    </div>
  );
};
