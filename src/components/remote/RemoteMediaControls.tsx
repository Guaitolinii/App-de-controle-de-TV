import React from 'react';
import { Play, Pause, Square, Rewind, FastForward } from 'lucide-react';
import { feedback } from '../../services/feedback';

interface RemoteMediaControlsProps {
  onMediaCommand: (command: string, label: string) => void;
  onColorButton: (color: string) => void;
}

export const RemoteMediaControls: React.FC<RemoteMediaControlsProps> = ({
  onMediaCommand,
  onColorButton,
}) => {
  const handleMedia = (cmd: string, label: string) => {
    feedback.playClick('standard');
    onMediaCommand(cmd, label);
  };

  const handleColor = (color: string) => {
    feedback.playClick('standard');
    onColorButton(color);
  };

  return (
    <div className="flex flex-col items-center w-full px-5 py-2">
      {/* 4 Colored Buttons (Teletext / Smart function buttons) */}
      <div className="grid grid-cols-4 gap-2 w-full mb-3">
        <button
          onClick={() => handleColor('RED')}
          className="h-7 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 shadow-md flex items-center justify-center transition-all group"
          title="Botão Vermelho (Red)"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/40 group-hover:bg-white" />
        </button>
        <button
          onClick={() => handleColor('GREEN')}
          className="h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-md flex items-center justify-center transition-all group"
          title="Botão Verde (Green)"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/40 group-hover:bg-white" />
        </button>
        <button
          onClick={() => handleColor('YELLOW')}
          className="h-7 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 shadow-md flex items-center justify-center transition-all group"
          title="Botão Amarelo (Yellow)"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/40 group-hover:bg-white" />
        </button>
        <button
          onClick={() => handleColor('BLUE')}
          className="h-7 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-md flex items-center justify-center transition-all group"
          title="Botão Azul (Blue)"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/40 group-hover:bg-white" />
        </button>
      </div>

      {/* Media Playback Controls */}
      <div className="flex items-center justify-between w-full bg-neutral-900/60 border border-white/5 rounded-2xl p-2 shadow-inner">
        {/* Rewind */}
        <button
          onClick={() => handleMedia('REWIND', 'Voltar (Rewind)')}
          className="w-10 h-10 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300 hover:text-white flex items-center justify-center active:scale-90 transition-all"
          title="Retroceder"
        >
          <Rewind className="w-4 h-4" />
        </button>

        {/* Play */}
        <button
          onClick={() => handleMedia('PLAY', 'Reproduzir (Play)')}
          className="w-11 h-11 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 active:scale-90 transition-all"
          title="Play"
        >
          <Play className="w-5 h-5 fill-white ml-0.5" />
        </button>

        {/* Pause */}
        <button
          onClick={() => handleMedia('PAUSE', 'Pausar (Pause)')}
          className="w-11 h-11 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all shadow-md"
          title="Pause"
        >
          <Pause className="w-5 h-5" />
        </button>

        {/* Fast Forward */}
        <button
          onClick={() => handleMedia('FASTFORWARD', 'Avançar (Fast Forward)')}
          className="w-10 h-10 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300 hover:text-white flex items-center justify-center active:scale-90 transition-all"
          title="Avançar"
        >
          <FastForward className="w-4 h-4" />
        </button>

        {/* Stop */}
        <button
          onClick={() => handleMedia('STOP', 'Parar (Stop)')}
          className="w-10 h-10 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300 hover:text-white flex items-center justify-center active:scale-90 transition-all"
          title="Parar"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
