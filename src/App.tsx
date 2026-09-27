import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Wifi, 
  Power, 
  HelpCircle, 
  Terminal, 
  Sliders, 
  Smartphone, 
  Zap, 
  Volume2, 
  VolumeX, 
  Radio, 
  ShieldCheck,
  Download,
  Share2,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { ChannelInfo, InputSource, PowerState, SSAPMessage, TVDevice } from './types/tv';
import { TVStorage, DEFAULT_SAMPLE_TV } from './services/storage';
import { DEFAULT_CHANNELS, DEFAULT_INPUTS, SSAP_ENDPOINTS } from './services/ssap';
import { feedback } from './services/feedback';
import { RemoteBody } from './components/remote/RemoteBody';
import { InputsModal } from './components/modals/InputsModal';
import { DeviceManagerModal } from './components/modals/DeviceManagerModal';
import { ProtocolInspectorModal } from './components/modals/ProtocolInspectorModal';
import { SetupGuideModal } from './components/modals/SetupGuideModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { MobileExportModal } from './components/modals/MobileExportModal';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  // Device & Storage State
  const [devices, setDevices] = useState<TVDevice[]>(() => TVStorage.getDevices());
  const [activeDeviceId, setActiveDeviceId] = useState<string>(() => TVStorage.getActiveDeviceId());
  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0] || DEFAULT_SAMPLE_TV;

  // TV Runtime State
  const [powerState, setPowerState] = useState<PowerState>(activeDevice.powerState || 'on');
  const [volume, setVolume] = useState<number>(24);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentChannel, setCurrentChannel] = useState<ChannelInfo>(DEFAULT_CHANNELS[0]);
  const [currentInput, setCurrentInput] = useState<InputSource>(DEFAULT_INPUTS[0]);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);
  const [homeMenuOpen, setHomeMenuOpen] = useState<boolean>(false);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>('Conectado à TV • Pronto');
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 50,
    y: 50,
    visible: false,
  });

  // Protocol Logs
  const [logs, setLogs] = useState<SSAPMessage[]>([]);
  const [msgCounter, setMsgCounter] = useState(0);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Modals
  const [isInputsOpen, setIsInputsOpen] = useState(false);
  const [isDeviceManagerOpen, setIsDeviceManagerOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileExportOpen, setIsMobileExportOpen] = useState(false);

  // PWA in-app install prompt hook
  const { isInstallable, isInstalled, install, isIOS, isAndroid } = usePWAInstall();

  // Initialize feedback settings
  useEffect(() => {
    setSoundEnabled(feedback.isSoundEnabled());
    setHapticsEnabled(feedback.isHapticsEnabled());
  }, []);

  // Helper to log SSAP Messages
  const logSSAP = (
    type: 'request' | 'register' | 'response' | 'wol',
    uri?: string,
    payload?: any,
    direction: 'outgoing' | 'incoming' | 'system' = 'outgoing'
  ) => {
    const newId = `msg_${Date.now()}_${msgCounter}`;
    setMsgCounter((prev) => prev + 1);

    const newLog: SSAPMessage = {
      id: newId,
      timestamp: Date.now(),
      direction,
      type,
      uri,
      payload: payload || {},
      status: 'ok',
      latencyMs: Math.floor(Math.random() * 8) + 6,
    };

    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Status feedback toast on remote
  const showFeedback = (message: string) => {
    setLastActionStatus(message);
  };

  // Power Handler (Wake-on-LAN or Turn Off)
  const handleTogglePower = () => {
    feedback.playClick('power');
    if (powerState === 'standby') {
      // Send Wake-on-LAN Magic Packet
      setPowerState('turning_on');
      showFeedback(`Ligando ${activeDevice.name} via Wake-on-LAN...`);
      logSSAP('wol', 'udp://255.255.255.255:9', {
        action: 'WakeOnLanMagicPacket',
        targetMac: activeDevice.mac,
        status: 'Sent 102 bytes to broadcast port 9',
      }, 'system');

      setTimeout(() => {
        setPowerState('on');
        logSSAP('register', 'wss://' + activeDevice.ip + ':3001', {
          clientKey: activeDevice.clientKey,
          pairingType: 'PROMPT',
          status: 'Connection Established',
        }, 'incoming');
        showFeedback(`TV Ligada via WiFi • ${activeDevice.name}`);
      }, 1800);
    } else {
      // Turn Off
      logSSAP('request', SSAP_ENDPOINTS.TURN_OFF, {});
      setPowerState('standby');
      setCurrentAppId(null);
      setHomeMenuOpen(false);
      showFeedback('TV em Standby (Pronta para WoL)');
    }
  };

  // Generic Button Command
  const handleCommand = (cmd: string, label: string) => {
    if (powerState !== 'on') {
      handleTogglePower();
      return;
    }

    logSSAP('request', `pointer.input/${cmd}`, { button: cmd });
    showFeedback(`Comando: ${label}`);

    // Handle standard keys
    if (cmd === 'BACK') {
      if (currentAppId) {
        setCurrentAppId(null);
        showFeedback('Fechou App • Retornou');
      } else if (homeMenuOpen) {
        setHomeMenuOpen(false);
        showFeedback('Fechou Menu Home');
      }
    } else if (cmd === 'ENTER') {
      showFeedback('Confirmar (OK)');
    }
  };

  // Volume Controls
  const handleVolumeUp = () => {
    if (powerState !== 'on') return;
    setIsMuted(false);
    setVolume((prev) => {
      const next = Math.min(100, prev + 1);
      logSSAP('request', SSAP_ENDPOINTS.VOLUME_UP, { volume: next });
      showFeedback(`Volume: ${next}`);
      return next;
    });
  };

  const handleVolumeDown = () => {
    if (powerState !== 'on') return;
    setIsMuted(false);
    setVolume((prev) => {
      const next = Math.max(0, prev - 1);
      logSSAP('request', SSAP_ENDPOINTS.VOLUME_DOWN, { volume: next });
      showFeedback(`Volume: ${next}`);
      return next;
    });
  };

  const handleToggleMute = () => {
    if (powerState !== 'on') return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    logSSAP('request', SSAP_ENDPOINTS.SET_MUTE, { mute: nextMute });
    showFeedback(nextMute ? 'MUDO Ativado' : `Volume: ${volume}`);
  };

  // Channel Controls
  const handleChannelUp = () => {
    if (powerState !== 'on') return;
    const currentIndex = DEFAULT_CHANNELS.findIndex((c) => c.number === currentChannel.number);
    const nextIndex = (currentIndex + 1) % DEFAULT_CHANNELS.length;
    const nextCh = DEFAULT_CHANNELS[nextIndex];
    setCurrentChannel(nextCh);
    setCurrentAppId(null);
    logSSAP('request', SSAP_ENDPOINTS.CHANNEL_UP, { channel: nextCh.number, name: nextCh.name });
    showFeedback(`Canal ${nextCh.number} • ${nextCh.name}`);
  };

  const handleChannelDown = () => {
    if (powerState !== 'on') return;
    const currentIndex = DEFAULT_CHANNELS.findIndex((c) => c.number === currentChannel.number);
    const prevIndex = (currentIndex - 1 + DEFAULT_CHANNELS.length) % DEFAULT_CHANNELS.length;
    const prevCh = DEFAULT_CHANNELS[prevIndex];
    setCurrentChannel(prevCh);
    setCurrentAppId(null);
    logSSAP('request', SSAP_ENDPOINTS.CHANNEL_DOWN, { channel: prevCh.number, name: prevCh.name });
    showFeedback(`Canal ${prevCh.number} • ${prevCh.name}`);
  };

  const handleSendChannelNumber = (channelNum: string) => {
    if (powerState !== 'on') return;
    const match = DEFAULT_CHANNELS.find((c) => c.number === channelNum);
    if (match) {
      setCurrentChannel(match);
      showFeedback(`Sintonizado: ${match.number} • ${match.name}`);
    } else {
      setCurrentChannel({
        number: channelNum,
        name: `Canal ${channelNum}`,
        category: 'Digital',
        programTitle: 'Transmissão Ao Vivo',
        programDescription: `Sinal recebido pela antena no canal ${channelNum}.`,
      });
      showFeedback(`Sintonizado: Canal ${channelNum}`);
    }
    setCurrentAppId(null);
    logSSAP('request', SSAP_ENDPOINTS.OPEN_CHANNEL, { channelNumber: channelNum });
  };

  // App Launcher
  const handleLaunchApp = (appId: string, appName?: string) => {
    if (powerState !== 'on') {
      setPowerState('on');
    }
    setCurrentAppId(appId);
    setHomeMenuOpen(false);
    logSSAP('request', SSAP_ENDPOINTS.LAUNCH, { id: appId });
    showFeedback(`Abrindo ${appName || appId} na TV...`);
  };

  // Touchpad Mouse Pointer
  const handleMovePointer = (dx: number, dy: number) => {
    if (powerState !== 'on') return;
    setPointerPos((prev) => ({
      x: Math.max(5, Math.min(95, prev.x + dx)),
      y: Math.max(5, Math.min(95, prev.y + dy)),
      visible: true,
    }));
  };

  const handleClickPointer = () => {
    if (powerState !== 'on') return;
    logSSAP('request', 'pointer.input/click', { x: pointerPos.x, y: pointerPos.y });
    showFeedback('Clique do Mouse Executado');
  };

  const handleResetPointer = () => {
    setPointerPos({ x: 50, y: 50, visible: true });
    showFeedback('Ponteiro centralizado');
  };

  // Text Direct Input
  const handleSendText = (text: string) => {
    if (powerState !== 'on') return;
    logSSAP('request', SSAP_ENDPOINTS.INPUT_INSERT_TEXT, { text });
    showFeedback(`Texto enviado: "${text}"`);
  };

  const handleSendEnter = () => {
    if (powerState !== 'on') return;
    logSSAP('request', SSAP_ENDPOINTS.INPUT_ENTER, {});
    showFeedback('Tecla ENTER enviada');
  };

  const handleSendBackspace = () => {
    if (powerState !== 'on') return;
    logSSAP('request', SSAP_ENDPOINTS.INPUT_DELETE, { count: 1 });
    showFeedback('Apagou caractere');
  };

  // Color Buttons
  const handleColorButton = (color: string) => {
    if (powerState !== 'on') return;
    logSSAP('request', `pointer.input/${color}`, { color });
    showFeedback(`Botão ${color} pressionado`);
  };

  // Wake-on-LAN Direct Test from Device Manager
  const handleSendWol = (mac: string) => {
    logSSAP('wol', 'udp://255.255.255.255:9', {
      action: 'DirectWakeOnLanTest',
      mac,
      packetSize: 102 as const,
      repetitions: 16,
    }, 'system');
    showFeedback(`WoL Magic Packet enviado para ${mac}`);
  };

  return (
    <div className="min-h-screen bg-[#07070b] text-white flex flex-col items-center justify-between selection:bg-red-600 selection:text-white pb-6 pt-2 px-3 sm:px-4">
      {/* Top Mobile Bar */}
      <header className="w-full max-w-[420px] mx-auto flex items-center justify-between pb-2 pt-1 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-md shadow-red-500/30">
            <Tv className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-white">LG Smart Remote</span>
              <span className="text-[9px] bg-red-600/30 text-red-400 border border-red-500/30 px-1 rounded font-bold">
                webOS
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Mobile Install APK / IPA */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              feedback.playClick('standard');
              setIsMobileExportOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-[11px] font-bold shadow-md shadow-red-600/20 active:scale-95 transition-all"
            title="Instalar ou gerar APK para Android e IPA para iPhone"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Testar no Celular (APK/IPA)</span>
          </button>
        </div>
      </header>

      {/* Floating Status Ticker (Real-Time Feedback) */}
      <div className="w-full max-w-[390px] mx-auto my-1.5 flex items-center justify-between px-3 py-1 rounded-full bg-neutral-900/90 border border-white/5 text-[11px] shadow-sm">
        <div className="flex items-center gap-1.5 truncate">
          <span className={`w-2 h-2 rounded-full shrink-0 ${powerState === 'on' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-neutral-300 truncate font-medium">
            {lastActionStatus || `${activeDevice.name} • Pronto`}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono shrink-0 pl-2">
          <span>Vol: {isMuted ? 'Mudo' : volume}</span>
        </div>
      </div>

      {/* Main Remote Control Container (O Modelo SÓ CONTROLE) */}
      <main className="w-full flex-1 flex flex-col items-center justify-center my-auto py-1">
        <RemoteBody
          device={activeDevice}
          powerState={powerState}
          volume={volume}
          isMuted={isMuted}
          activeAppId={currentAppId}
          onTogglePower={handleTogglePower}
          onOpenDeviceManager={() => setIsDeviceManagerOpen(true)}
          onOpenInspector={() => setIsInspectorOpen(true)}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMobileExport={() => setIsMobileExportOpen(true)}
          onOpenInputs={() => setIsInputsOpen(true)}
          onToggleHome={() => {
            setHomeMenuOpen(!homeMenuOpen);
            showFeedback('Menu Home webOS acionado');
          }}
          onCommand={handleCommand}
          onVolumeUp={handleVolumeUp}
          onVolumeDown={handleVolumeDown}
          onToggleMute={handleToggleMute}
          onChannelUp={handleChannelUp}
          onChannelDown={handleChannelDown}
          onShowInfo={() => showFeedback(`${currentChannel.number} • ${currentChannel.name}`)}
          onLaunchApp={handleLaunchApp}
          onMovePointer={handleMovePointer}
          onClickPointer={handleClickPointer}
          onResetPointer={handleResetPointer}
          onSendNumber={(num) => handleCommand(num, `Dígito ${num}`)}
          onSendChannel={handleSendChannelNumber}
          onSendText={handleSendText}
          onSendEnter={handleSendEnter}
          onSendBackspace={handleSendBackspace}
          onColorButton={handleColorButton}
        />
      </main>

      {/* Bottom Bar: Direct PWA Install prompt if on mobile browser */}
      {isInstallable && !isInstalled && (
        <div className="w-full max-w-[390px] mx-auto mt-2">
          <button
            onClick={install}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Instalar App no seu Celular (1 Clique)</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <InputsModal
        isOpen={isInputsOpen}
        onClose={() => setIsInputsOpen(false)}
        currentInput={currentInput}
        onSelectInput={(inp) => {
          setCurrentInput(inp);
          setCurrentAppId(null);
          showFeedback(`Entrada alterada: ${inp.label}`);
          logSSAP('request', SSAP_ENDPOINTS.SWITCH_INPUT, { inputId: inp.id });
        }}
      />

      <DeviceManagerModal
        isOpen={isDeviceManagerOpen}
        onClose={() => setIsDeviceManagerOpen(false)}
        devices={devices}
        activeDeviceId={activeDeviceId}
        onSelectDevice={(dev) => {
          setActiveDeviceId(dev.id);
          TVStorage.setActiveDeviceId(dev.id);
          showFeedback(`Conectado a ${dev.name}`);
        }}
        onAddDevice={(dev) => {
          TVStorage.upsertDevice(dev);
          setDevices(TVStorage.getDevices());
        }}
        onRemoveDevice={(id) => {
          TVStorage.removeDevice(id);
          const updated = TVStorage.getDevices();
          setDevices(updated);
          if (activeDeviceId === id && updated.length > 0) {
            setActiveDeviceId(updated[0].id);
          }
        }}
        onSendWol={handleSendWol}
      />

      <ProtocolInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        logs={logs}
        onClearLogs={() => setLogs([])}
        device={activeDevice}
        onSendCustomSSAP={(uri, payload) => {
          logSSAP('request', uri, payload);
          showFeedback(`SSAP: ${uri}`);
        }}
      />

      <SetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        viewMode="remote"
        onSetViewMode={() => {}}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          feedback.setSoundEnabled(next);
        }}
        hapticsEnabled={hapticsEnabled}
        onToggleHaptics={() => {
          const next = !hapticsEnabled;
          setHapticsEnabled(next);
          feedback.setHapticsEnabled(next);
        }}
      />

      <MobileExportModal
        isOpen={isMobileExportOpen}
        onClose={() => setIsMobileExportOpen(false)}
      />
    </div>
  );
}
