import React, { useState } from 'react';
import { Keyboard, Send, CornerDownLeft, Delete, Sparkles, History } from 'lucide-react';
import { feedback } from '../../services/feedback';

interface RemoteTextInputProps {
  onSendText: (text: string) => void;
  onSendEnter: () => void;
  onSendBackspace: () => void;
}

export const RemoteTextInput: React.FC<RemoteTextInputProps> = ({
  onSendText,
  onSendEnter,
  onSendBackspace,
}) => {
  const [text, setText] = useState('');
  const [history, setHistory] = useState<string[]>([
    'Trailer GTA 6 4K',
    'Filmes de Ficção Científica',
    'Lo-fi Hip Hop Brasil',
    'OLED Gaming 120Hz',
  ]);

  const handleSend = () => {
    if (!text.trim()) return;
    feedback.playClick('standard');
    onSendText(text);
    if (!history.includes(text)) {
      setHistory([text, ...history.slice(0, 4)]);
    }
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
      onSendEnter();
    }
  };

  return (
    <div className="flex flex-col items-center w-full px-5 py-2">
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-semibold">
          <Keyboard className="w-3.5 h-3.5 text-blue-400" />
          <span>Digitação Direta na TV</span>
        </div>
        <span className="text-[10px] text-neutral-400">Envia para campos de busca</span>
      </div>

      {/* Input Field & Submit Button */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite para buscar na TV..."
            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
          />
          {text && (
            <button
              onClick={() => setText('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold transition-all shadow-md active:scale-95 flex items-center justify-center"
          title="Enviar texto para a TV"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Additional Key Controls */}
      <div className="grid grid-cols-2 gap-2 w-full mt-2">
        <button
          onClick={() => {
            feedback.playClick('standard');
            onSendEnter();
          }}
          className="py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-white/5 active:scale-95 flex items-center justify-center gap-1.5"
        >
          <CornerDownLeft className="w-3.5 h-3.5 text-blue-400" />
          <span>Enviar Tecla ENTER</span>
        </button>

        <button
          onClick={() => {
            feedback.playClick('standard');
            onSendBackspace();
          }}
          className="py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-white/5 active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Delete className="w-3.5 h-3.5 text-neutral-400" />
          <span>Apagar (Backspace)</span>
        </button>
      </div>

      {/* History Suggestions */}
      <div className="w-full mt-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-semibold mb-1.5">
          <History className="w-3 h-3 text-neutral-500" />
          <span>Sugestões Rápidas:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {history.map((term, i) => (
            <button
              key={i}
              onClick={() => {
                feedback.playClick('standard');
                onSendText(term);
                onSendEnter();
              }}
              className="text-[10px] bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white px-2.5 py-1 rounded-md border border-white/5 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
