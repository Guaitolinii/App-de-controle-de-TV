import React, { useState } from 'react';
import { Delete, CornerDownLeft, Radio, List } from 'lucide-react';
import { feedback } from '../../services/feedback';

interface RemoteNumpadProps {
  onSendNumber: (num: string) => void;
  onSendChannel: (channel: string) => void;
}

export const RemoteNumpad: React.FC<RemoteNumpadProps> = ({
  onSendNumber,
  onSendChannel,
}) => {
  const [typedChannel, setTypedChannel] = useState('');

  const handleDigit = (digit: string) => {
    feedback.playClick('standard');
    const updated = typedChannel + digit;
    setTypedChannel(updated);
    onSendNumber(digit);
  };

  const handleDelete = () => {
    feedback.playClick('standard');
    setTypedChannel((prev) => prev.slice(0, -1));
  };

  const handleConfirmChannel = () => {
    if (!typedChannel) return;
    feedback.playClick('standard');
    onSendChannel(typedChannel);
    setTypedChannel('');
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className="flex flex-col items-center w-full px-6 py-2">
      {/* Current typed buffer display */}
      <div className="flex items-center justify-between w-full bg-neutral-900/90 border border-white/10 rounded-xl px-4 py-2.5 mb-3 shadow-inner">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Canal:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-mono font-black text-white tracking-widest min-w-[3rem] text-right">
            {typedChannel || '— —'}
          </span>
          {typedChannel && (
            <button
              onClick={handleConfirmChannel}
              className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-500 active:scale-95"
            >
              OK
            </button>
          )}
        </div>
      </div>

      {/* Numeric Grid */}
      <div className="grid grid-cols-3 gap-2.5 w-full">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => handleDigit(k)}
            className="h-12 rounded-xl bg-neutral-800/90 hover:bg-neutral-700/90 active:scale-95 text-white font-mono text-lg font-bold border border-white/5 transition-all shadow-md flex items-center justify-center hover:border-white/20"
          >
            {k}
          </button>
        ))}

        {/* Delete key */}
        <button
          onClick={handleDelete}
          className="h-12 rounded-xl bg-neutral-800/90 hover:bg-red-500/20 hover:text-red-400 active:scale-95 text-neutral-400 font-bold border border-white/5 transition-all shadow-md flex items-center justify-center"
          title="Apagar dígito"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Brazilian Channels shortcuts */}
      <div className="w-full mt-3 pt-2 border-t border-white/5">
        <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block mb-1.5">
          Canais Frequentes
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { num: '5.1', label: 'Globo' },
            { num: '4.1', label: 'SBT' },
            { num: '7.1', label: 'Record' },
            { num: '13.1', label: 'Band' },
            { num: '577', label: 'CNN' },
            { num: '539', label: 'SporTV' },
          ].map((ch) => (
            <button
              key={ch.num}
              onClick={() => {
                feedback.playClick('standard');
                onSendChannel(ch.num);
              }}
              className="px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white border border-white/5 whitespace-nowrap active:scale-95"
            >
              <span className="text-red-400 font-mono mr-1">{ch.num}</span>
              {ch.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
