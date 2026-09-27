import React from 'react';
import { Power, Wifi, ChevronDown, Terminal, HelpCircle, Sliders, ShieldCheck, Zap } from 'lucide-react';
import { PowerState, TVDevice } from '../../types/tv';

interface RemoteHeaderProps {
  device: TVDevice;
  powerState: PowerState;
  onTogglePower: () => void;
  onOpenDeviceManager: () => void;
  onOpenInspector: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  onOpenMobileExport: () => void;
}

export const RemoteHeader: React.FC<RemoteHeaderProps> = ({
  device,
  powerState,
  onTogglePower,
  onOpenDeviceManager,
  onOpenInspector,
  onOpenGuide,
  onOpenSettings,
  onOpenMobileExport,
}) => {
  const isOnline = powerState === 'on';

  return (
    <div className="flex items-center justify-between w-full pb-3 border-b border-white/5">
      {/* Power Button */}
      <button
        onClick={onTogglePower}
        title={powerState === 'on' ? 'Desligar TV' : 'Ligar TV (Wake-on-LAN)'}
        className={`relative group flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 shadow-lg active:scale-95 ${
          powerState === 'on'
            ? 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-red-500/30 hover:brightness-110'
            : 'bg-neutral-800/90 text-neutral-400 border border-neutral-700/80 hover:text-red-400 hover:border-red-500/40'
        }`}
      >
        <Power className="w-5 h-5 transition-transform group-hover:scale-105" />
        {/* Subtle indicator ring */}
        <span 
          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-neutral-900 ${
            powerState === 'on' ? 'bg-emerald-400' : 'bg-red-500'
          }`} 
        />
      </button>

      {/* Center Device Selector & Status */}
      <button
        onClick={onOpenDeviceManager}
        className="flex flex-col items-center px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all text-center group"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200 group-hover:text-white">
          <span className="truncate max-w-[130px] sm:max-w-[160px]">{device.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
          <span 
            className={`w-1.5 h-1.5 rounded-full ${
              powerState === 'on'
                ? 'bg-emerald-400 animate-pulse'
                : powerState === 'turning_on'
                ? 'bg-amber-400 animate-ping'
                : 'bg-neutral-500'
            }`} 
          />
          <span className={powerState === 'on' ? 'text-emerald-400 font-medium' : 'text-neutral-400'}>
            {powerState === 'on' ? 'WiFi Conectado' : powerState === 'turning_on' ? 'Iniciando...' : 'Standby (WoL)'}
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-500 font-mono text-[9px]">{device.ip}</span>
        </div>
      </button>

      {/* Quick Action Tools (Mobile APK/IPA, Diagnostics, Guide, Settings) */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenMobileExport}
          title="Instalar / Exportar APK e IPA para Celular"
          className="h-8 px-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 flex items-center gap-1 transition-colors text-xs font-bold"
        >
          <Zap className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[10px] hidden sm:inline">APK/IPA</span>
        </button>

        <button
          onClick={onOpenInspector}
          title="Console SSAP & Diagnóstico de Rede"
          className="w-8 h-8 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-400 hover:text-neutral-200 flex items-center justify-center transition-colors text-xs"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onOpenGuide}
          title="Guia de Conexão e TV"
          className="w-8 h-8 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-400 hover:text-neutral-200 flex items-center justify-center transition-colors text-xs"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onOpenSettings}
          title="Ajustes do Controle"
          className="w-8 h-8 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-400 hover:text-neutral-200 flex items-center justify-center transition-colors text-xs"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

