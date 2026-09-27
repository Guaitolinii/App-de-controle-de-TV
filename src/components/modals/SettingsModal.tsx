import React from 'react';
import { X, Volume2, Vibrate, Layout, Sparkles, Check, Crown, Smartphone, Tv } from 'lucide-react';
import { feedback } from '../../services/feedback';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: 'split' | 'remote' | 'tv';
  onSetViewMode: (mode: 'split' | 'remote' | 'tv') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  viewMode,
  onSetViewMode,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-white">Preferências & Visualização</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
            Modo de Visualização na Tela
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onSetViewMode('split')}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                viewMode === 'split'
                  ? 'bg-neutral-800 border-red-500 text-white shadow-md ring-1 ring-red-500/40'
                  : 'bg-neutral-950/60 border-white/5 text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200'
              }`}
            >
              <Layout className="w-5 h-5 text-red-400" />
              <span className="text-xs font-bold">Lado a Lado</span>
              <span className="text-[9px] text-neutral-400">Controle + TV</span>
            </button>

            <button
              onClick={() => onSetViewMode('remote')}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                viewMode === 'remote'
                  ? 'bg-neutral-800 border-red-500 text-white shadow-md ring-1 ring-red-500/40'
                  : 'bg-neutral-950/60 border-white/5 text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200'
              }`}
            >
              <Smartphone className="w-5 h-5 text-red-400" />
              <span className="text-xs font-bold">Só Controle</span>
              <span className="text-[9px] text-neutral-400">Foco Remoto</span>
            </button>

            <button
              onClick={() => onSetViewMode('tv')}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                viewMode === 'tv'
                  ? 'bg-neutral-800 border-red-500 text-white shadow-md ring-1 ring-red-500/40'
                  : 'bg-neutral-950/60 border-white/5 text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200'
              }`}
            >
              <Tv className="w-5 h-5 text-red-400" />
              <span className="text-xs font-bold">Só TV</span>
              <span className="text-[9px] text-neutral-400">Tela webOS</span>
            </button>
          </div>
        </div>

        {/* Feedback Preferences */}
        <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-white/5 space-y-3">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
            Feedback Tátil e Sonoro
          </label>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
                <Volume2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Som de Clique Mecânico</p>
                <p className="text-[10px] text-neutral-400">Síntese suave via Web Audio API</p>
              </div>
            </div>
            <button
              onClick={onToggleSound}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                soundEnabled ? 'bg-red-600' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
                <Vibrate className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Vibração Háptica</p>
                <p className="text-[10px] text-neutral-400">Dispositivos móveis suportados</p>
              </div>
            </div>
            <button
              onClick={onToggleHaptics}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                hapticsEnabled ? 'bg-red-600' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  hapticsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Superpowers Premium Badge Info */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-red-950/40 via-neutral-900 to-black border border-red-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">Edição Completa Liberada</span>
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Todos os recursos do Plano Mestre ativos: Wake-on-LAN ilimitado, Touchpad Magic Mouse, Teclado de texto, Atalhos de streaming e Inspetor SSAP em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
};
