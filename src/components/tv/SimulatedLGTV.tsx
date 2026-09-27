import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Wifi, 
  Power, 
  Sparkles, 
  Play, 
  Pause, 
  Film, 
  Radio, 
  Gamepad2, 
  Headphones, 
  Globe, 
  Settings as SettingsIcon,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Info,
  Clock
} from 'lucide-react';
import { ChannelInfo, InputSource, PowerState } from '../../types/tv';
import { DEFAULT_CHANNELS, DEFAULT_INPUTS, POPULAR_APPS } from '../../services/ssap';

interface SimulatedLGTVProps {
  powerState: PowerState;
  volume: number;
  isMuted: boolean;
  currentChannel: ChannelInfo;
  currentInput: InputSource;
  currentAppId: string | null;
  homeMenuOpen: boolean;
  toastMessage: string | null;
  pointerPos: { x: number; y: number; visible: boolean };
  onLaunchApp: (appId: string) => void;
  onCloseApp: () => void;
  onSelectChannel: (channel: ChannelInfo) => void;
  onSelectInput: (input: InputSource) => void;
  onTogglePower: () => void;
}

export const SimulatedLGTV: React.FC<SimulatedLGTVProps> = ({
  powerState,
  volume,
  isMuted,
  currentChannel,
  currentInput,
  currentAppId,
  homeMenuOpen,
  toastMessage,
  pointerPos,
  onLaunchApp,
  onCloseApp,
  onSelectChannel,
  onSelectInput,
  onTogglePower,
}) => {
  const [showVolumeHud, setShowVolumeHud] = useState(false);
  const [showChannelBanner, setShowChannelBanner] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [isPlayingMedia, setIsPlayingMedia] = useState(true);

  // Update clock every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Show Volume HUD on changes
  useEffect(() => {
    if (powerState !== 'on') return;
    setShowVolumeHud(true);
    const timer = setTimeout(() => setShowVolumeHud(false), 2200);
    return () => clearTimeout(timer);
  }, [volume, isMuted]);

  // Show Channel Banner on changes
  useEffect(() => {
    if (powerState !== 'on') return;
    setShowChannelBanner(true);
    const timer = setTimeout(() => setShowChannelBanner(false), 3500);
    return () => clearTimeout(timer);
  }, [currentChannel]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* TV Screen Outer Chassis */}
      <div className="relative w-full rounded-2xl bg-neutral-950 p-2 sm:p-3 shadow-2xl border border-neutral-800/80 ring-1 ring-white/5">
        {/* TV Top Bezel Camera/Sensor dot */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-neutral-800" />

        {/* Display Panel */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black select-none shadow-inner">
          
          {/* STANDBY / POWER OFF SCREEN */}
          {powerState === 'standby' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-neutral-600">
              <div className="relative group cursor-pointer" onClick={onTogglePower}>
                <div className="w-16 h-16 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-red-500/50 group-hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]">
                  <Power className="w-7 h-7 text-neutral-500 group-hover:text-red-400 transition-colors" />
                </div>
              </div>
              <p className="mt-4 text-xs font-medium tracking-widest text-neutral-500 uppercase">
                LG webOS • Standby
              </p>
              <p className="mt-1 text-[11px] text-neutral-600">
                Pressione <span className="text-red-400 font-semibold">POWER</span> no controle ou <span className="text-amber-400 font-semibold">Ligue via WiFi</span>
              </p>
            </div>
          )}

          {/* TURNING ON / BOOT ANIMATION */}
          {powerState === 'turning_on' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-red-500 flex items-center justify-center font-bold text-red-500 text-sm">
                  LG
                </div>
                <span className="text-xl font-light tracking-wider text-white">webOS TV</span>
              </div>
              <div className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-neutral-800">
                <div className="h-full bg-red-600 rounded-full animate-indeterminate" />
              </div>
            </div>
          )}

          {/* ACTIVE TV SCREEN */}
          {powerState === 'on' && (
            <div className="relative w-full h-full bg-neutral-900">
              {/* CURRENT CONTENT DISPLAY */}
              {currentAppId === 'netflix' ? (
                // Netflix UI Simulator
                <div className="absolute inset-0 bg-neutral-950 text-white flex flex-col justify-between p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/30 via-neutral-950 to-black">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-red-600 tracking-tighter">NETFLIX</span>
                      <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-300">
                        <span className="font-semibold text-white">Início</span>
                        <span>Séries</span>
                        <span>Filmes</span>
                        <span>Bombando</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-red-600/30 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold">4K DOLBY VISION</span>
                      <button 
                        onClick={onCloseApp}
                        className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800/60"
                      >
                        Sair (Exit)
                      </button>
                    </div>
                  </div>

                  <div className="max-w-md space-y-2">
                    <span className="text-[10px] tracking-widest uppercase font-bold text-red-500">Série Original Netflix</span>
                    <h2 className="text-xl sm:text-3xl font-extrabold text-white">Stranger Things 5</h2>
                    <p className="text-xs text-neutral-300 line-clamp-2">
                      Na reta final em Hawkins, o grupo enfrenta a maior ameaça do Mundo Invertido em uma batalha épica.
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <button 
                        onClick={() => setIsPlayingMedia(!isPlayingMedia)} 
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
                      >
                        {isPlayingMedia ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                        {isPlayingMedia ? 'Pausar' : 'Assistir'}
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800/80 text-white text-xs hover:bg-neutral-700 transition-colors">
                        <Info className="w-3.5 h-3.5" /> Mais informações
                      </button>
                    </div>
                  </div>

                  {/* Movie Carousels */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {['Wandinha', 'Round 6', 'Black Mirror', 'The Witcher'].map((title, i) => (
                      <div key={i} className="aspect-[16/9] rounded bg-neutral-800/60 border border-white/5 p-2 flex flex-col justify-end text-[10px] font-medium text-neutral-200 hover:border-red-500/50 transition-colors">
                        <span className="font-semibold truncate">{title}</span>
                        <span className="text-[9px] text-red-400">Em Alta</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : currentAppId === 'youtube.leanback.v4' ? (
                // YouTube Simulator
                <div className="absolute inset-0 bg-[#0f0f0f] text-white flex flex-col justify-between p-4 sm:p-6">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-4 bg-red-600 rounded flex items-center justify-center">
                        <Play className="w-2.5 h-2.5 fill-white text-white ml-0.5" />
                      </div>
                      <span className="font-bold tracking-tight text-sm">YouTube TV</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span>Pesquisar</span>
                      <span className="text-white font-medium">Início</span>
                      <span>Música</span>
                      <button onClick={onCloseApp} className="text-xs bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                        Sair
                      </button>
                    </div>
                  </div>

                  {/* Video Player view */}
                  <div className="relative flex-1 my-2 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden flex flex-col justify-between p-4">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-neutral-900 to-black pointer-events-none" />
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">LG OLED G4 vs C3 • Comparativo Completo 4K HDR 120Hz</span>
                      <span className="text-[10px] bg-red-600 px-1.5 py-0.5 rounded font-bold">AO VIVO</span>
                    </div>

                    <div className="relative z-10 flex items-center justify-center">
                      <button 
                        onClick={() => setIsPlayingMedia(!isPlayingMedia)}
                        className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform hover:scale-110"
                      >
                        {isPlayingMedia ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5 fill-white" />}
                      </button>
                    </div>

                    <div className="relative z-10 space-y-1">
                      <div className="h-1 w-full bg-neutral-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 w-1/3 rounded-full" />
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-400">
                        <span>12:45 / 34:10</span>
                        <span>4K 60fps • HDR10</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentAppId === 'spotify-beehive' ? (
                // Spotify Simulator
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/60 via-neutral-950 to-black text-white flex flex-col justify-between p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Headphones className="w-5 h-5" />
                      <span className="font-bold text-sm tracking-tight text-white">Spotify on webOS</span>
                    </div>
                    <button onClick={onCloseApp} className="text-xs bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                      Sair
                    </button>
                  </div>

                  <div className="flex items-center gap-6 my-auto">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-neutral-800 shadow-2xl overflow-hidden border border-emerald-500/20 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-emerald-900/40">
                      <Radio className="w-12 h-12 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Tocando Agora</span>
                      <h3 className="text-lg sm:text-2xl font-bold">Get Lucky</h3>
                      <p className="text-xs text-neutral-400">Daft Punk • Random Access Memories</p>
                      <div className="flex items-center gap-2 pt-2">
                        {/* Animated Equalizer bars */}
                        <div className="flex items-end gap-1 h-5">
                          <span className="w-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s] h-4" />
                          <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.1s] h-5" />
                          <span className="w-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.4s] h-3" />
                          <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.2s] h-5" />
                        </div>
                        <span className="text-[10px] text-neutral-400">Hi-Fi Lossless • 320 kbps</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentInput.type === 'hdmi' ? (
                // HDMI Input Simulator (e.g. PS5 or Apple TV)
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-neutral-950 to-black text-white flex flex-col justify-between p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-indigo-400" />
                      <span className="font-bold text-sm tracking-wide text-white">{currentInput.label}</span>
                      <span className="text-xs text-neutral-400">({currentInput.connectedDevice})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
                        3840x2160 @ 120Hz VRR
                      </span>
                      <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-mono">
                        ALLM • HDR10
                      </span>
                    </div>
                  </div>

                  <div className="text-center space-y-2 my-auto">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                      <Gamepad2 className="w-10 h-10 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Sinal Ativo via {currentInput.label}</h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      Dispositivo conectado e transmitindo com latência ultrabaixa (Game Optimizer ativo).
                    </p>
                  </div>
                </div>
              ) : (
                // Live TV (Antenna / Broadcast Mode)
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-neutral-900 to-black text-white flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
                  {/* Subtle TV Broadcast ambient background */}
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_30%,_rgba(59,130,246,0.3),transparent_70%)]" />

                  {/* Top Broadcast details */}
                  <div className="relative z-10 flex items-center justify-between text-xs text-neutral-300">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">TV ABERTA HD</span>
                      <span className="font-semibold text-white">{currentChannel.number} • {currentChannel.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
                        1080i HD • 16:9 • Dolby D+
                      </span>
                      <div className="flex items-center gap-1 text-neutral-400 text-xs font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{currentTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center Live Simulation */}
                  <div className="relative z-10 my-auto text-center space-y-1">
                    <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-white mb-2">
                      Sinal Digital ISDB-Tb Sintonia Perfeita
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{currentChannel.programTitle}</h3>
                    <p className="text-xs text-neutral-300 max-w-md mx-auto line-clamp-2">
                      {currentChannel.programDescription}
                    </p>
                  </div>

                  {/* Bottom channel progress */}
                  <div className="relative z-10 space-y-1">
                    <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-2/3 rounded-full" />
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-400">
                      <span>Ao Vivo • {currentChannel.name}</span>
                      <span>Classificação: Livre</span>
                    </div>
                  </div>
                </div>
              )}

              {/* OVERLAY: VOLUME HUD (Shows on Volume Change) */}
              {showVolumeHud && (
                <div className="absolute top-4 right-4 z-40 flex items-center gap-3 bg-neutral-900/95 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}>
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-4">
                      <span className="font-semibold text-white">{isMuted ? 'MUDO' : 'Volume'}</span>
                      <span className="font-mono font-bold text-white">{isMuted ? '0' : volume}</span>
                    </div>
                    <div className="w-28 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-150 ${isMuted ? 'bg-red-500 w-0' : 'bg-red-500'}`}
                        style={{ width: isMuted ? '0%' : `${volume}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* OVERLAY: CHANNEL BANNER (Shows on CH+/CH- or Channel Selection) */}
              {showChannelBanner && (
                <div className="absolute top-4 left-4 z-40 bg-neutral-950/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="text-xl font-black text-red-500 font-mono tracking-tight">
                    {currentChannel.number}
                  </div>
                  <div className="border-l border-neutral-700 pl-3">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{currentChannel.name}</span>
                      <span className="text-[9px] bg-red-600/30 text-red-400 px-1 rounded">DTV</span>
                    </div>
                    <div className="text-[11px] text-neutral-300 truncate max-w-xs">
                      {currentChannel.programTitle}
                    </div>
                  </div>
                </div>
              )}

              {/* OVERLAY: TOAST NOTIFICATION (ssap://system.notifications/createToast) */}
              {toastMessage && (
                <div className="absolute top-4 right-4 z-50 flex items-center gap-3 bg-red-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-red-400/40 animate-in fade-in slide-in-from-top duration-300">
                  <Tv className="w-4 h-4 text-white shrink-0" />
                  <span className="text-xs font-medium">{toastMessage}</span>
                </div>
              )}

              {/* OVERLAY: HOME MENU (webOS Cards Launcher) */}
              {homeMenuOpen && (
                <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black via-neutral-950/95 to-transparent pt-12 pb-4 px-4 border-t border-white/10 animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>webOS Home Bar</span>
                    </div>
                    <span className="text-[11px] text-neutral-400">Selecione um app com o D-pad ou Touchpad</span>
                  </div>

                  {/* Horizontal App Cards Carousel */}
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                    {POPULAR_APPS.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => onLaunchApp(app.appId)}
                        className="group relative flex-shrink-0 w-24 h-16 rounded-xl p-2.5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:scale-105 shadow-lg border border-white/10 overflow-hidden"
                        style={{ backgroundColor: app.color }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-white/90">
                            {app.badge || 'App'}
                          </span>
                          <ChevronRight className="w-3 h-3 text-white/60 group-hover:text-white" />
                        </div>
                        <span className="text-xs font-extrabold text-white text-left tracking-tight">
                          {app.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* OVERLAY: MAGIC REMOTE POINTER CURSOR */}
              {pointerPos.visible && (
                <div 
                  className="pointer-events-none absolute z-50 transition-all duration-75 ease-out"
                  style={{
                    left: `${Math.max(5, Math.min(95, pointerPos.x))}%`,
                    top: `${Math.max(5, Math.min(95, pointerPos.y))}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="relative">
                    {/* Glowing Teardrop Pointer */}
                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.9)] border-2 border-white ring-2 ring-pink-500/50" />
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* TV Bottom Stand & Center LG Logo with Standby LED */}
        <div className="flex items-center justify-between px-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 font-mono">webOS 23 • 4K UHD</span>
          </div>

          {/* Center LG Brand & Power Status LED */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              {/* Standby LED */}
              <div 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  powerState === 'on' 
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                    : powerState === 'turning_on'
                    ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                }`} 
              />
              <span className="text-[11px] font-black tracking-widest text-neutral-400">LG</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] text-neutral-400">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>WiFi 5GHz</span>
            </div>
          </div>
        </div>
      </div>

      {/* TV Bottom Pedestal Stand */}
      <div className="w-36 h-2 rounded-b-md bg-gradient-to-b from-neutral-800 to-neutral-900 border-x border-b border-neutral-700/60 shadow-lg" />
    </div>
  );
};
