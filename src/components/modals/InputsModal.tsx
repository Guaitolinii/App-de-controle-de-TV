import React from 'react';
import { X, Tv, Gamepad2, Monitor, Radio, Cable, Check, RefreshCw } from 'lucide-react';
import { InputSource } from '../../types/tv';
import { feedback } from '../../services/feedback';

interface InputsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInput: InputSource | null;
  availableInputs?: InputSource[];
  onRefreshInputs?: () => void;
  onSelectInput: (input: InputSource) => void;
}

export const InputsModal: React.FC<InputsModalProps> = ({
  isOpen,
  onClose,
  currentInput,
  availableInputs,
  onRefreshInputs,
  onSelectInput,
}) => {
  if (!isOpen) return null;

  // Somente as entradas reais informadas pela TV
  const inputs = availableInputs || [];

  const getIcon = (type: string, id: string) => {
    if (id.includes('1')) return <Gamepad2 className="w-5 h-5 text-indigo-400" />;
    if (id.includes('2')) return <Tv className="w-5 h-5 text-purple-400" />;
    if (id.includes('3')) return <Gamepad2 className="w-5 h-5 text-rose-400" />;
    if (id.includes('4')) return <Monitor className="w-5 h-5 text-cyan-400" />;
    if (type === 'antenna') return <Radio className="w-5 h-5 text-emerald-400" />;
    return <Cable className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-base font-bold text-white">Selecionar Entrada (HDMI)</h3>
              <p className="text-[11px] text-neutral-400">Portas físicas detectadas na TV</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefreshInputs && (
              <button
                onClick={onRefreshInputs}
                title="Atualizar lista de entradas da TV"
                className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Inputs List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {inputs.length === 0 && (
            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 text-center text-xs text-neutral-400">
              Nenhuma entrada recebida da TV. Conecte-se à TV e toque em atualizar.
            </div>
          )}
          {inputs.map((inp) => {
            const isActive = currentInput?.id === inp.id;
            return (
              <button
                key={inp.id}
                onClick={() => {
                  feedback.playClick('standard');
                  onSelectInput(inp);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-98 ${
                  isActive
                    ? 'bg-neutral-800/90 border-red-500 shadow-md ring-1 ring-red-500/30'
                    : 'bg-neutral-950/60 border-white/5 hover:bg-neutral-800/50 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center border border-white/5">
                    {getIcon(inp.type, inp.id)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{inp.label}</span>
                      {isActive && (
                        <span className="text-[9px] bg-red-600/30 text-red-400 px-1.5 py-0.5 rounded font-semibold border border-red-500/30">
                          Sinal Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {inp.connectedDevice || inp.id}
                    </p>
                  </div>
                </div>

                {isActive && (
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
