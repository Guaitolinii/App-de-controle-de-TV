import React from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  RotateCcw, 
  Menu, 
  Settings, 
  Tv, 
  Sparkles 
} from 'lucide-react';
import { feedback } from '../../services/feedback';

interface RemoteDPadProps {
  onCommand: (command: string, label: string) => void;
  onOpenInputs: () => void;
  onToggleHome: () => void;
}

export const RemoteDPad: React.FC<RemoteDPadProps> = ({
  onCommand,
  onOpenInputs,
  onToggleHome,
}) => {
  const handlePress = (cmd: string, label: string, type: 'nav' | 'standard' = 'nav') => {
    feedback.playClick(type);
    onCommand(cmd, label);
  };

  return (
    <div className="flex flex-col items-center w-full my-1">
      {/* Context Top Buttons: Settings & Inputs */}
      <div className="flex items-center justify-between w-full px-6 mb-2">
        <button
          onClick={() => handlePress('QMENU', 'Configurações Rápidas')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 active:scale-95 text-neutral-300 text-xs font-medium border border-white/5 transition-all shadow-sm"
        >
          <Settings className="w-3.5 h-3.5 text-neutral-400" />
          <span>Ajustes</span>
        </button>

        <button
          onClick={() => {
            feedback.playClick('standard');
            onOpenInputs();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 active:scale-95 text-neutral-300 text-xs font-medium border border-white/5 transition-all shadow-sm"
        >
          <Tv className="w-3.5 h-3.5 text-neutral-400" />
          <span>Entradas</span>
        </button>
      </div>

      {/* Main D-Pad Circular Housing */}
      <div className="relative w-[min(14rem,29svh)] h-[min(14rem,29svh)] rounded-full bg-gradient-to-b from-neutral-800/90 to-neutral-900/95 p-2 shadow-2xl border border-white/10 ring-1 ring-black/40 flex items-center justify-center">
        
        {/* Subtle radial inner glow */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03),transparent_70%)] pointer-events-none" />

        {/* Directional UP */}
        <button
          onClick={() => handlePress('UP', 'Cima')}
          className="absolute top-2 w-20 h-14 flex items-center justify-center text-neutral-300 hover:text-white active:scale-95 transition-all rounded-t-full group hover:bg-white/5"
          title="Navegar para Cima"
        >
          <ChevronUp className="w-7 h-7 transition-transform group-hover:-translate-y-0.5" />
        </button>

        {/* Directional DOWN */}
        <button
          onClick={() => handlePress('DOWN', 'Baixo')}
          className="absolute bottom-2 w-20 h-14 flex items-center justify-center text-neutral-300 hover:text-white active:scale-95 transition-all rounded-b-full group hover:bg-white/5"
          title="Navegar para Baixo"
        >
          <ChevronDown className="w-7 h-7 transition-transform group-hover:translate-y-0.5" />
        </button>

        {/* Directional LEFT */}
        <button
          onClick={() => handlePress('LEFT', 'Esquerda')}
          className="absolute left-2 w-14 h-20 flex items-center justify-center text-neutral-300 hover:text-white active:scale-95 transition-all rounded-l-full group hover:bg-white/5"
          title="Navegar para Esquerda"
        >
          <ChevronLeft className="w-7 h-7 transition-transform group-hover:-translate-x-0.5" />
        </button>

        {/* Directional RIGHT */}
        <button
          onClick={() => handlePress('RIGHT', 'Direita')}
          className="absolute right-2 w-14 h-20 flex items-center justify-center text-neutral-300 hover:text-white active:scale-95 transition-all rounded-r-full group hover:bg-white/5"
          title="Navegar para Direita"
        >
          <ChevronRight className="w-7 h-7 transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Center Metallic OK / Scroll Wheel Button */}
        <button
          onClick={() => handlePress('ENTER', 'OK / Confirmar', 'standard')}
          className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 border border-neutral-600/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),_0_6px_12px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-white active:scale-90 transition-all group hover:from-neutral-600"
          title="Confirmar / OK"
        >
          <div className="w-2 h-2 rounded-full bg-red-500/80 mb-1 group-hover:bg-red-400 group-hover:shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span className="text-xs font-black tracking-wider uppercase">OK</span>
        </button>
      </div>

      {/* Surrounding Navigation Buttons: Home, Back, Menu */}
      <div className="flex items-center justify-between w-full px-6 mt-2">
        {/* Home Button */}
        <button
          onClick={() => {
            feedback.playClick('app');
            onToggleHome();
          }}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-neutral-800/80 hover:bg-neutral-700/80 active:scale-95 text-neutral-300 hover:text-white border border-white/5 transition-all shadow-md group"
          title="Home webOS"
        >
          <Home className="w-5 h-5 transition-transform group-hover:scale-110 text-neutral-200" />
          <span className="text-[9px] font-medium mt-0.5 text-neutral-400">Home</span>
        </button>

        {/* Back Button */}
        <button
          onClick={() => handlePress('BACK', 'Voltar')}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-neutral-800/80 hover:bg-neutral-700/80 active:scale-95 text-neutral-300 hover:text-white border border-white/5 transition-all shadow-md group"
          title="Voltar"
        >
          <RotateCcw className="w-5 h-5 transition-transform group-hover:-rotate-45 text-neutral-200" />
          <span className="text-[9px] font-medium mt-0.5 text-neutral-400">Voltar</span>
        </button>

        {/* Menu / Guide Button */}
        <button
          onClick={() => handlePress('GUIDE', 'Guia de Programação (EPG)')}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-neutral-800/80 hover:bg-neutral-700/80 active:scale-95 text-neutral-300 hover:text-white border border-white/5 transition-all shadow-md group"
          title="Guia TV (EPG)"
        >
          <Menu className="w-5 h-5 transition-transform group-hover:scale-110 text-neutral-200" />
          <span className="text-[9px] font-medium mt-0.5 text-neutral-400">Guia</span>
        </button>
      </div>
    </div>
  );
};
