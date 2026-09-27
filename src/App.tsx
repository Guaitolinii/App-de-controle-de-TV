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
  AlertCircle,
  Key,
  Plus
} from 'lucide-react';
import { ChannelInfo, ConnectionStatus, InputSource, PowerState, SSAPMessage, TVDevice } from './types/tv';
import { TVStorage } from './services/storage';
import { DEFAULT_CHANNELS, SSAP_ENDPOINTS } from './services/ssap';
import { tvConnection } from './services/tvConnection';
import { isNativeApp } from './services/nativeBridge';
import { feedback } from './services/feedback';
import { RemoteBody } from './components/remote/RemoteBody';
import { InputsModal } from './components/modals/InputsModal';
import { DeviceManagerModal } from './components/modals/DeviceManagerModal';
import { ProtocolInspectorModal } from './components/modals/ProtocolInspectorModal';
import { SetupGuideModal } from './components/modals/SetupGuideModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { MobileExportModal } from './components/modals/MobileExportModal';
import { WifiPairingModal } from './components/modals/WifiPairingModal';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  // Device & Storage State (Zero fake devices by default)
  const [devices, setDevices] = useState<TVDevice[]>(() => TVStorage.getDevices());
  const [activeDeviceId, setActiveDeviceId] = useState<string>(() => TVStorage.getActiveDeviceId());
  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0] || null;

  // Real TV Connection & Hardware State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string>('Desconectado');
  const [volume, setVolume] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentChannel, setCurrentChannel] = useState<ChannelInfo>(DEFAULT_CHANNELS[0]);
  const [availableInputs, setAvailableInputs] = useState<InputSource[]>([]);
  const [currentInput, setCurrentInput] = useState<InputSource | null>(null);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);
  const [homeMenuOpen, setHomeMenuOpen] = useState<boolean>(false);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  // Real Protocol Logs from tvConnection
  const [logs, setLogs] = useState<SSAPMessage[]>([]);

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
  const [isWifiPairingOpen, setIsWifiPairingOpen] = useState(false);

  // PWA in-app install prompt hook
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Initialize feedback settings
  useEffect(() => {
    setSoundEnabled(feedback.isSoundEnabled());
    setHapticsEnabled(feedback.isHapticsEnabled());
  }, []);

  // Subscribe to real tvConnection events
  useEffect(() => {
    const unsubStatus = tvConnection.onStatusChange(({ status, message }) => {
      setConnectionStatus(status);
      if (message) {
        setStatusMessage(message);
        setLastActionStatus(message);
      }
    });

    // Chave de pareamento recebida da TV: salva no aparelho que estava conectando
    const unsubKey = tvConnection.onClientKey(({ deviceId, clientKey }) => {
      TVStorage.updateClientKey(deviceId, clientKey);
      setDevices(TVStorage.getDevices());
      setLastActionStatus('Pareamento salvo. Não será preciso permitir de novo.');
    });

    // Modelo, versão do webOS, porta que funcionou e MACs (usados para ligar a TV)
    const unsubInfo = tvConnection.onDeviceInfo((info) => {
      const saved = TVStorage.getDevices().find((d) => d.id === info.deviceId);
      if (!saved) return;
      const changes: Partial<TVDevice> = { isOnline: true, lastConnected: Date.now() };
      if (info.port) changes.port = info.port;
      if (info.pairingManifest) changes.pairingManifest = info.pairingManifest;
      if (info.modelName) changes.modelName = info.modelName;
      if (info.webosVersion) changes.webosVersion = info.webosVersion;
      if (info.macs?.length) {
        changes.macs = info.macs;
        changes.mac = info.macs[0];
      }
      // Nome automático: troca "LG TV (IP)" pelo modelo real
      if (info.modelName && /^LG (Smart )?TV( \(|$)/.test(saved.name)) {
        changes.name = `LG ${info.modelName}`;
      }
      TVStorage.updateDevice(info.deviceId, changes);
      setDevices(TVStorage.getDevices());
    });

    const unsubVol = tvConnection.onVolume(({ volume: vol, muted }) => {
      setVolume(vol);
      setIsMuted(muted);
      setLastActionStatus(muted ? 'MUDO Ativado na TV' : `Volume: ${vol}`);
    });

    const unsubApp = tvConnection.onForegroundApp((appId) => {
      setCurrentAppId(appId);
      if (appId) {
        setLastActionStatus(`App ativo na TV: ${appId}`);
      }
    });

    const unsubInputs = tvConnection.onInputs((inputs) => {
      if (inputs.length > 0) {
        setAvailableInputs(inputs);
      }
    });

    const unsubLogs = tvConnection.onRawLog((log) => {
      setLogs((prev) => [log, ...prev.slice(0, 59)]);
    });

    return () => {
      unsubStatus();
      unsubKey();
      unsubInfo();
      unsubVol();
      unsubApp();
      unsubInputs();
      unsubLogs();
    };
  }, []);

  // Ao voltar do segundo plano o iOS derruba as conexões: reconecta
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') tvConnection.reconnectIfNeeded();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, []);

  // Connect automatically to active device when selected
  useEffect(() => {
    if (activeDevice && activeDevice.ip) {
      tvConnection.connect(activeDevice);
    } else {
      tvConnection.disconnect();
    }
  }, [activeDeviceId, activeDevice?.ip]);

  // Helper to show visual feedback message
  const showFeedback = (message: string) => {
    setLastActionStatus(message);
  };

  // Power Handler (Wake-on-LAN real UDP / Turn Off real SSAP)
  const handleTogglePower = async () => {
    feedback.playClick('power');

    if (!activeDevice) {
      setIsDeviceManagerOpen(true);
      return;
    }

    if (connectionStatus === 'connected') {
      // TV está conectada: enviar comando real de desligar (turnOff)
      showFeedback('Desligando TV LG...');
      try {
        await tvConnection.sendRequest(SSAP_ENDPOINTS.TURN_OFF);
        showFeedback('Comando de desligar enviado');
      } catch (err: any) {
        showFeedback(`Erro ao desligar: ${err.message}`);
      }
    } else {
      // TV desligada/em standby: Wake-on-LAN (IP da TV + broadcast) e reconexão
      showFeedback('Enviando sinal para ligar a TV...');
      const result = await tvConnection.wake(activeDevice);
      showFeedback(result.message);
      if (result.sent === 0 && result.supported && !activeDevice.mac && !activeDevice.macs?.length) {
        setIsDeviceManagerOpen(true);
      }
    }
  };

  // Generic Button Command - Envia via Socket de Botões (getPointerInputSocket)
  const handleCommand = (cmd: string, label: string) => {
    feedback.playClick('nav');
    showFeedback(`Comando: ${label}`);

    // Lista de botões físicos que vão via pointerInputSocket:
    // UP, DOWN, LEFT, RIGHT, ENTER, BACK, HOME, MENU, GUIDE, QMENU, RED, GREEN, YELLOW, BLUE, 0-9
    const isPointerButton = [
      'UP', 'DOWN', 'LEFT', 'RIGHT', 'ENTER', 'BACK', 'HOME', 'MENU', 
      'GUIDE', 'QMENU', 'RED', 'GREEN', 'YELLOW', 'BLUE',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
    ].includes(cmd);

    if (isPointerButton) {
      if (!tvConnection.sendButton(cmd)) showFeedback('TV não conectada');
      return;
    }

    // Comandos de mídia via SSAP
    if (cmd === 'PLAY') {
      tvConnection.sendRequest('ssap://media.controls/play').catch(() => {});
    } else if (cmd === 'PAUSE') {
      tvConnection.sendRequest('ssap://media.controls/pause').catch(() => {});
    } else if (cmd === 'STOP') {
      tvConnection.sendRequest('ssap://media.controls/stop').catch(() => {});
    } else if (cmd === 'REWIND') {
      tvConnection.sendRequest('ssap://media.controls/rewind').catch(() => {});
    } else if (cmd === 'FASTFORWARD') {
      tvConnection.sendRequest('ssap://media.controls/fastForward').catch(() => {});
    }
  };

  // Volume Controls - Envia comandos reais para a TV
  const handleVolumeUp = () => {
    feedback.playClick('standard');
    showFeedback('Volume +');
    tvConnection.sendRequest(SSAP_ENDPOINTS.VOLUME_UP).catch((err) => {
      showFeedback(`Falha ao alterar volume: ${err.message}`);
    });
  };

  const handleVolumeDown = () => {
    feedback.playClick('standard');
    showFeedback('Volume -');
    tvConnection.sendRequest(SSAP_ENDPOINTS.VOLUME_DOWN).catch((err) => {
      showFeedback(`Falha ao alterar volume: ${err.message}`);
    });
  };

  const handleToggleMute = () => {
    feedback.playClick('standard');
    const nextMute = !isMuted;
    showFeedback(nextMute ? 'Ativando Mudo...' : 'Desativando Mudo...');
    tvConnection.sendRequest(SSAP_ENDPOINTS.SET_MUTE, { mute: nextMute }).catch((err) => {
      showFeedback(`Falha ao alterar mudo: ${err.message}`);
    });
  };

  // Channel Controls
  const handleChannelUp = () => {
    feedback.playClick('standard');
    showFeedback('Canal +');
    tvConnection.sendRequest(SSAP_ENDPOINTS.CHANNEL_UP).catch((err) => {
      showFeedback(`Erro Canal: ${err.message}`);
    });
  };

  const handleChannelDown = () => {
    feedback.playClick('standard');
    showFeedback('Canal -');
    tvConnection.sendRequest(SSAP_ENDPOINTS.CHANNEL_DOWN).catch((err) => {
      showFeedback(`Erro Canal: ${err.message}`);
    });
  };

  const handleSendChannelNumber = (channelNum: string) => {
    feedback.playClick('standard');
    showFeedback(`Abrindo canal ${channelNum}...`);
    tvConnection.sendRequest(SSAP_ENDPOINTS.OPEN_CHANNEL, { channelNumber: channelNum }).catch((err) => {
      // Fallback: digita os números um por um no socket de botões
      for (const char of channelNum) {
        tvConnection.sendButton(char);
      }
    });
  };

  // App Launcher Real
  const handleLaunchApp = (appId: string, appName?: string) => {
    feedback.playClick('app');
    showFeedback(`Abrindo ${appName || appId}...`);
    tvConnection.launchApp(appId, appName).catch((err) => {
      showFeedback(`Não foi possível abrir ${appName || appId}: ${err.message}`);
    });
  };

  // Touchpad Mouse Pointer Real
  const handleMovePointer = (dx: number, dy: number) => {
    tvConnection.sendPointerMove(dx, dy);
  };

  const handleClickPointer = () => {
    feedback.playClick('standard');
    tvConnection.sendPointerClick();
    showFeedback('Clique do Mouse');
  };

  const handleResetPointer = () => {
    feedback.playClick('standard');
    showFeedback('Touchpad ativo');
  };

  // Text Direct Input Real
  const handleSendText = (text: string) => {
    feedback.playClick('standard');
    showFeedback(`Enviando texto: "${text}"`);
    tvConnection.sendRequest(SSAP_ENDPOINTS.INPUT_INSERT_TEXT, { text }).catch((err) => {
      showFeedback(`Erro ao enviar texto: ${err.message}`);
    });
  };

  const handleSendEnter = () => {
    feedback.playClick('standard');
    tvConnection.sendRequest(SSAP_ENDPOINTS.INPUT_ENTER).catch(() => {
      tvConnection.sendButton('ENTER');
    });
  };

  const handleSendBackspace = () => {
    feedback.playClick('standard');
    tvConnection.sendRequest(SSAP_ENDPOINTS.INPUT_DELETE, { count: 1 }).catch(() => {
      tvConnection.sendButton('BACK');
    });
  };

  const handleColorButton = (color: string) => {
    feedback.playClick('standard');
    showFeedback(`Botão ${color}`);
    tvConnection.sendButton(color);
  };

  // Teste de Wake-on-LAN pelo gerenciador de TVs
  const handleSendWol = async (mac: string) => {
    const device = devices.find((d) => d.mac === mac || d.macs?.includes(mac)) || activeDevice;
    if (!device) return;
    const result = await tvConnection.wake({ ...device, mac });
    showFeedback(result.message);
  };

  const isPaired = !!activeDevice?.clientKey;
  const isConnected = connectionStatus === 'connected';

  return (
    <div className="min-h-[100dvh] bg-[#07070b] text-white flex flex-col items-center justify-between selection:bg-red-600 selection:text-white px-3 sm:px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-[max(env(safe-area-inset-bottom),1rem)]">
      {/* Top Mobile Bar */}
      <header className="w-full max-w-[420px] mx-auto flex items-center justify-between pb-2 pt-1 border-b border-white/5 [@media(max-height:700px)]:hidden">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="w-7 h-7 rounded-lg shadow-md shadow-red-500/30" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-white">LG Smart Remote</span>
              <span className="text-[9px] bg-red-600/30 text-red-400 border border-red-500/30 px-1 rounded font-bold">
                webOS
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Mobile Install APK / IPA (só no navegador; no app instalado não faz sentido) */}
        {!isNativeApp() && (
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
        )}
      </header>

      {/* PAIRING PROMPT BANNER (Quando a TV mostra "Permitir" na tela) */}
      {connectionStatus === 'prompt_showing' && (
        <div className="w-full max-w-[390px] mx-auto my-2 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs flex items-center gap-3 animate-pulse shadow-lg">
          <Key className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-bold text-white">Confirmação necessária na TV</p>
            <p className="text-[11px] text-amber-200">
              Pressione <strong className="text-white font-bold">"Permitir"</strong> no controle físico da TV para salvar a chave de pareamento.
            </p>
          </div>
        </div>
      )}

      {/* Floating Status Ticker (Real-Time Hardware Feedback) */}
      <div className="w-full max-w-[390px] mx-auto my-1.5 flex items-center justify-between px-3 py-1 rounded-full bg-neutral-900/90 border border-white/5 text-[11px] shadow-sm">
        <div className="flex items-center gap-1.5 truncate">
          <span 
            className={`w-2 h-2 rounded-full shrink-0 ${
              isConnected
                ? 'bg-emerald-400 animate-pulse'
                : connectionStatus === 'connecting'
                ? 'bg-amber-400 animate-ping'
                : connectionStatus === 'prompt_showing'
                ? 'bg-amber-400'
                : 'bg-red-500'
            }`} 
          />
          <span className="text-neutral-300 truncate font-medium">
            {lastActionStatus || (activeDevice ? `${activeDevice.name} • ${statusMessage}` : 'Cadastre sua TV LG')}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono shrink-0 pl-2">
          <span>{isConnected ? `Vol: ${isMuted ? 'Mudo' : volume}` : activeDevice?.ip || 'Sem TV'}</span>
        </div>
      </div>

      {/* Main Remote Control Container (O Modelo SÓ CONTROLE) */}
      <main className="w-full flex-1 flex flex-col items-center justify-center my-auto py-1">
        {activeDevice ? (
          <RemoteBody
            device={activeDevice}
            powerState={isConnected ? 'on' : 'standby'}
            volume={volume}
            isMuted={isMuted}
            activeAppId={currentAppId}
            onTogglePower={handleTogglePower}
            onOpenDeviceManager={() => setIsDeviceManagerOpen(true)}
            onOpenInspector={() => setIsInspectorOpen(true)}
            onOpenGuide={() => setIsGuideOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenMobileExport={() => setIsMobileExportOpen(true)}
            onOpenWifiPairing={() => setIsWifiPairingOpen(true)}
            onOpenInputs={() => {
              tvConnection.fetchInputs();
              setIsInputsOpen(true);
            }}
            onToggleHome={() => {
              tvConnection.sendButton('HOME');
              showFeedback('Home webOS');
            }}
            onCommand={handleCommand}
            onVolumeUp={handleVolumeUp}
            onVolumeDown={handleVolumeDown}
            onToggleMute={handleToggleMute}
            onChannelUp={handleChannelUp}
            onChannelDown={handleChannelDown}
            onShowInfo={() => {
              tvConnection.sendButton('INFO');
              showFeedback('Informações na TV');
            }}
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
        ) : (
          /* Empty State: Cadastrar IP da TV */
          <div className="w-full max-w-[390px] mx-auto rounded-[38px] bg-neutral-900 border border-neutral-800 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto shadow-lg">
              <Tv className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nenhuma TV Conectada</h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Conecte seu celular e a TV LG na mesma rede Wi-Fi para parear e controlar.
              </p>
            </div>
            <button
              onClick={() => setIsWifiPairingOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Wifi className="w-4 h-4" />
              <span>Conectar à TV</span>
            </button>
          </div>
        )}
      </main>

      {/* Bottom Bar: Direct PWA Install prompt if on mobile browser */}
      {isInstallable && !isInstalled && !isNativeApp() && (
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
        availableInputs={availableInputs}
        onRefreshInputs={() => tvConnection.fetchInputs()}
        onSelectInput={(inp) => {
          setCurrentInput(inp);
          showFeedback(`Alternando para ${inp.label}...`);
          tvConnection.sendRequest(SSAP_ENDPOINTS.SWITCH_INPUT, { inputId: inp.id }).catch((err) => {
            showFeedback(`Não foi possível trocar a entrada: ${err.message}`);
          });
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
          showFeedback(`Conectando a ${dev.name}...`);
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
        device={activeDevice || {
          id: 'none',
          name: 'Sem TV',
          ip: '0.0.0.0',
          mac: '',
          port: 3001,
          clientKey: '',
          modelName: '',
          webosVersion: '',
          isOnline: false,
          powerState: 'standby',
        }}
        onSendCustomSSAP={(uri, payload) => {
          tvConnection.sendRequest(uri, payload).catch((err) => {
            showFeedback(`Erro SSAP: ${err.message}`);
          });
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

      <WifiPairingModal
        isOpen={isWifiPairingOpen}
        onClose={() => setIsWifiPairingOpen(false)}
        activeDevice={activeDevice}
        connectionStatus={connectionStatus}
        statusMessage={statusMessage}
        onPairSuccess={(dev) => {
          // A tela de pareamento continua aberta mostrando o andamento (aviso na TV, erro ou sucesso)
          TVStorage.upsertDevice(dev);
          setDevices(TVStorage.getDevices());
          setActiveDeviceId(dev.id);
        }}
      />

      <MobileExportModal
        isOpen={isMobileExportOpen}
        onClose={() => setIsMobileExportOpen(false)}
      />
    </div>
  );
}
