import React from 'react';
import { Plus, Minus, Volume2, VolumeX, ChevronUp, ChevronDown, Radio, Info } from 'lucide-react';
import { feedback } from '../../services/feedback';

interface RemoteVolumeChannelsProps {
  volume: number;
  isMuted: boolean;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onToggleMute: () => void;
  onChannelUp: () => void;
  onChannelDown: () => void;
  onShowInfo: () => void;
}

export const RemoteVolumeChannels: React.FC<RemoteVolumeChannelsProps> = ({
  volume,
  isMuted,
  onVolumeUp,
  onVolumeDown,
  onToggleMute,
  onChannelUp,
  onChannelDown,
  onShowInfo,
}) => {
  return (
    <div className="flex items-center justify-between w-full px-6 py-2">
      {/* Left Column: Volume Rocker Column */}
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center bg-gradient-to-b from-neutral-800 to-neutral-900 border border-white/10 rounded-2xl p-1 shadow-lg w-13">
          {/* Vol + */}
          <button
            onClick={() => {
              feedback.playClick('standard');
              onVolumeUp();
            }}
            className="w-11 h-11 flex items-center justify-center text-neutral-300 hover:text-white active:scale-90 transition-all rounded-xl hover:bg-white/5"
            title="Volume Aumentar (+)"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Volume Indicator Label */}
          <div className="py-1 text-[10px] font-bold text-neutral-400 tracking-wider">
            VOL
          </div>

          {/* Vol - */}
          <button
            onClick={() => {
              feedback.playClick('standard');
              onVolumeDown();
            }}
            className="w-11 h-11 flex items-center justify-center text-neutral-300 hover:text-white active:scale-90 transition-all rounded-xl hover:bg-white/5"
            title="Volume Diminuir (-)"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Column: Mute & Info Buttons */}
      <div className="flex flex-col items-center gap-3">
        {/* Mute Button */}
        <button
          onClick={() => {
            feedback.playClick('standard');
            onToggleMute();
          }}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl border transition-all active:scale-90 shadow-md ${
            isMuted
              ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-red-500/20'
              : 'bg-neutral-800/80 border-white/5 text-neutral-300 hover:text-white hover:bg-neutral-700/80'
          }`}
          title="Mudo (Mute)"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          <span className="text-[9px] font-medium mt-0.5">{isMuted ? 'Mudo' : 'Som'}</span>
        </button>

        {/* Info / Quick Access */}
        <button
          onClick={() => {
            feedback.playClick('standard');
            onShowInfo();
          }}
          className="flex flex-col items-center justify-center w-12 h-10 rounded-xl bg-neutral-800/80 border border-white/5 text-neutral-400 hover:text-neutral-200 active:scale-90 transition-all hover:bg-neutral-700/80"
          title="Informações da TV / Programa"
        >
          <Info className="w-4 h-4" />
          <span className="text-[8px] font-medium mt-0.5">Info</span>
        </button>
      </div>

      {/* Right Column: Channel Rocker Column */}
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center bg-gradient-to-b from-neutral-800 to-neutral-900 border border-white/10 rounded-2xl p-1 shadow-lg w-13">
          {/* CH + */}
          <button
            onClick={() => {
              feedback.playClick('standard');
              onChannelUp();
            }}
            className="w-11 h-11 flex items-center justify-center text-neutral-300 hover:text-white active:scale-90 transition-all rounded-xl hover:bg-white/5"
            title="Próximo Canal (CH+)"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* Channel Label */}
          <div className="py-1 text-[10px] font-bold text-neutral-400 tracking-wider">
            CH
          </div>

          {/* CH - */}
          <button
            onClick={() => {
              feedback.playClick('standard');
              onChannelDown();
            }}
            className="w-11 h-11 flex items-center justify-center text-neutral-300 hover:text-white active:scale-90 transition-all rounded-xl hover:bg-white/5"
            title="Canal Anterior (CH-)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
