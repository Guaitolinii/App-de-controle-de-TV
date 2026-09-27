import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wifi, 
  Tv, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  ChevronRight, 
  HelpCircle, 
  ShieldCheck, 
  Smartphone,
  Sparkles
} from 'lucide-react';
import { ConnectionStatus, TVDevice } from '../../types/tv';
import { tvConnection } from '../../services/tvConnection';
import { WifiDiscoveryService, DiscoveredTV } from '../../services/wifiDiscovery';
import { TVStorage } from '../../services/storage';
import { subnetPrefix } from '../../services/network';
import { feedback } from '../../services/feedback';

interface WifiPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDevice: TVDevice | null;
  connectionStatus: ConnectionStatus;
  statusMessage: string;
  onPairSuccess: (device: TVDevice) => void;
}

export const WifiPairingModal: React.FC<WifiPairingModalProps> = ({
  isOpen,
  onClose,
  activeDevice,
  connectionStatus,
  statusMessage,
  onPairSuccess,
}) => {
  const [ip, setIp] = useState(activeDevice?.ip || '');
  const [port, setPort] = useState<number>(activeDevice?.port || 3001);
  const [tvName, setTvName] = useState(activeDevice?.name || 'LG Smart TV');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ scanned: 0, total: 0 });
  const [discoveredTvs, setDiscoveredTvs] = useState<DiscoveredTV[]>([]);
  const [subnetBase, setSubnetBase] = useState('192.168.1');
  const [subnetLabel, setSubnetLabel] = useState('');
  const [scanDone, setScanDone] = useState(false);
  const [showIpHelp, setShowIpHelp] = useState(false);

  // No app nativo: descobre a faixa do Wi-Fi e já provoca o pedido de "Rede Local" do iOS
  useEffect(() => {
    if (!isOpen || !WifiDiscoveryService.canAutoDetectSubnet()) return;
    WifiDiscoveryService.getLocalNetwork().then((net) => {
      if (net) {
        const prefix = subnetPrefix(net.ip);
        if (prefix) {
          setSubnetBase(prefix);
          setSubnetLabel(`${prefix}.x`);
        }
      }
    });
    WifiDiscoveryService.requestLocalNetworkPermission();
  }, [isOpen]);

  useEffect(() => {
    if (activeDevice) {
      setIp(activeDevice.ip);
      setPort(activeDevice.port || 3001);
      setTvName(activeDevice.name);
    }
  }, [activeDevice]);

  if (!isOpen) return null;

  const handleStartPairing = (targetIp?: string, targetPort?: number) => {
    const finalIp = (targetIp || ip).trim();
    if (!finalIp) return;

    feedback.playClick('standard');
    const finalPort = targetPort || port;

    // Mesmo IP já cadastrado: reaproveita o cadastro e a chave (não pede "Permitir" de novo).
    // IP novo: cria outro aparelho, sem sobrescrever a TV ativa.
    const existing = TVStorage.findByIp(finalIp);
    const typedName = tvName.trim();
    const deviceToPair: TVDevice = {
      id: existing?.id || `tv_${Date.now()}`,
      name: typedName && typedName !== 'LG Smart TV' ? typedName : existing?.name || `LG TV (${finalIp})`,
      ip: finalIp,
      mac: existing?.mac || '',
      macs: existing?.macs,
      port: finalPort,
      clientKey: existing?.clientKey || '',
      modelName: existing?.modelName || 'webOS Smart TV',
      webosVersion: existing?.webosVersion || 'webOS',
      isOnline: false,
      powerState: 'standby',
      lastConnected: Date.now(),
    };

    onPairSuccess(deviceToPair);
    tvConnection.connect(deviceToPair);
  };

  const handleScanWifi = async () => {
    feedback.playClick('standard');
    setIsScanning(true);
    setScanDone(false);
    setDiscoveredTvs([]);

    try {
      // No navegador usa a faixa do IP digitado (se houver)
      const base = subnetPrefix(ip) || subnetBase;
      const { found: results, subnetLabel: label } = await WifiDiscoveryService.scan(base, (scanned, total, found) => {
        setScanProgress({ scanned, total });
        setDiscoveredTvs([...found]);
      });
      setSubnetLabel(label);
      setDiscoveredTvs(results);
      if (results.length > 0) {
        setIp(results[0].ip);
        setPort(results[0].port);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
      setScanDone(true);
    }
  };

  const isConnected = connectionStatus === 'connected';
  const isPromptShowing = connectionStatus === 'prompt_showing';
  const isConnecting = connectionStatus === 'connecting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Parear TV via Wi-Fi</h3>
              <p className="text-[11px] text-neutral-400">Conexão WebSocket direta pela mesma rede</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ACTIVE STATUS DISPLAY */}
        {isPromptShowing ? (
          /* TELA 1: AVISO NA TELA DA TV */
          <div className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-500 text-white space-y-3 animate-pulse shadow-xl">
            <div className="flex items-center gap-2.5">
              <Tv className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-extrabold text-amber-300">OLHE PARA A TELA DA SUA TV AGORA!</h4>
                <p className="text-xs text-amber-100">A TV LG está solicitando confirmação de acesso.</p>
              </div>
            </div>

            {/* Simulated TV Dialog Box */}
            <div className="p-3 rounded-xl bg-black/90 border border-white/10 text-center space-y-2">
              <p className="text-xs text-neutral-300">Mensagem que apareceu na TV:</p>
              <p className="text-sm font-bold text-white">
                "O aplicativo LG Smart Remote deseja se conectar à sua TV."
              </p>
              <div className="flex items-center justify-center gap-3 pt-1">
                <span className="px-3 py-1 rounded bg-neutral-800 text-neutral-400 text-xs">Recusar</span>
                <span className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs shadow-md border-2 border-white ring-2 ring-red-500">
                  ▶ [ PERMITIR ] ◀
                </span>
              </div>
            </div>

            <p className="text-xs text-amber-200 text-center font-medium">
              Pressione <strong>"OK / Confirmar"</strong> no controle físico ou painel da TV para liberar o acesso.
            </p>
          </div>
        ) : isConnected ? (
          /* TELA 2: SUCESSO DE PAREAMENTO */
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-white space-y-2 text-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-emerald-300">TV Pareada com Sucesso via Wi-Fi!</h4>
            <p className="text-xs text-neutral-300">
              A chave de segurança foi salva. Agora seu celular está conectado permanentemente a <strong className="text-white">{activeDevice?.name || ip}</strong>.
            </p>
            {activeDevice?.clientKey && (
              <p className="text-[10px] text-neutral-400 font-mono">
                Chave autorizada: {activeDevice.clientKey.substring(0, 12)}...
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              Usar Controle Remoto Agora
            </button>
          </div>
        ) : (
          /* TELA 3: FORMULÁRIO DE PAREAMENTO */
          <div className="space-y-4">
            {/* Step 1 Check */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-white/5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-300 leading-relaxed">
                <span className="font-bold text-white block mb-0.5">Requisito Básico do Wi-Fi:</span>
                Seu smartphone e a TV LG devem estar conectados ao <strong>mesmo roteador Wi-Fi</strong>.
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-neutral-300">Endereço IP da TV LG *</label>
                  <button
                    onClick={() => setShowIpHelp(!showIpHelp)}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                  >
                    <HelpCircle className="w-3 h-3" /> Como achar o IP na TV?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    placeholder="Ex: 192.168.1.100"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40"
                  />
                  {ip && (
                    <button
                      onClick={() => setIp('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Subnet Quick Fill Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-neutral-500">Atalhos:</span>
                  {['192.168.1.', '192.168.0.', '192.168.15.', '10.0.0.'].map((prefix) => (
                    <button
                      key={prefix}
                      onClick={() => setIp(prefix)}
                      className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white px-2 py-0.5 rounded-lg font-mono transition-colors"
                    >
                      {prefix}
                    </button>
                  ))}
                </div>
              </div>

              {/* IP Help Box */}
              {showIpHelp && (
                <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1 text-xs text-neutral-300 font-mono animate-in fade-in">
                  <p className="font-bold text-white mb-1">Como ver o IP na sua TV LG:</p>
                  <p>1. Pressione <strong className="text-red-400">Configurações (⚙️)</strong> no controle.</p>
                  <p>2. Vá em <strong className="text-white">Rede → Conexão Wi-Fi</strong>.</p>
                  <p>3. Clique em <strong className="text-white">Configurações Avançadas de Wi-Fi</strong>.</p>
                  <p>4. Copie o número do <strong className="text-emerald-400">Endereço IP</strong> (ex: 192.168.1.50).</p>
                </div>
              )}

              {/* Port Selector */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">Porta webOS</label>
                  <select
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value={3001}>3001 (WSS - 2022 em diante)</option>
                    <option value={3000}>3000 (WS - Anteriores a 2022)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">Nome para o Controle</label>
                  <input
                    type="text"
                    value={tvName}
                    onChange={(e) => setTvName(e.target.value)}
                    placeholder="Ex: TV Sala"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Scan Local Wi-Fi Subnet Section */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Não sabe o IP exato?</span>
                  <span className="text-[10px] text-neutral-400">Escanear faixa Wi-Fi local ({subnetLabel || `${subnetPrefix(ip) || subnetBase}.x`})</span>
                </div>
                <button
                  onClick={handleScanWifi}
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white border border-white/5 disabled:opacity-50 transition-all active:scale-95"
                >
                  <Search className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Escaneando...' : 'Buscar na Rede'}</span>
                </button>
              </div>

              {isScanning && (
                <div className="space-y-1">
                  <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 transition-all duration-150"
                      style={{ width: `${(scanProgress.scanned / (scanProgress.total || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>Verificando portas 3001/3000...</span>
                    <span>{scanProgress.scanned}/{scanProgress.total}</span>
                  </div>
                </div>
              )}

              {/* Nenhuma TV encontrada */}
              {scanDone && !isScanning && discoveredTvs.length === 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 leading-relaxed">
                  Nenhuma TV encontrada. Confira se a TV está ligada, no mesmo Wi-Fi, e se o iPhone tem
                  permissão de <strong>Rede Local</strong> (Ajustes → Privacidade e Segurança → Rede Local). Depois busque de novo
                  ou digite o IP.
                </div>
              )}

              {/* Found TVs */}
              {discoveredTvs.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-emerald-400 font-bold block">TVs LG detectadas:</span>
                  {discoveredTvs.map((dev, i) => (
                    <button
                      key={i}
                      onClick={() => handleStartPairing(dev.ip, dev.port)}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-neutral-900 border border-emerald-500/30 text-left hover:border-emerald-500 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white font-mono">{dev.ip}:{dev.port}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        Parear <ChevronRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Action Button */}
            <button
              onClick={() => handleStartPairing()}
              disabled={!ip.trim() || isConnecting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Conectando ao Wi-Fi da TV...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Iniciar Pareamento Wi-Fi com a TV</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
