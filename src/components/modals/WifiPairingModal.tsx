import React, { useEffect, useRef, useState } from 'react';
import { X, Wifi, Tv, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, Loader2, Keyboard } from 'lucide-react';
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

/**
 * Tela de conexão com a TV, em 3 passos:
 * 1) busca automática no Wi-Fi  2) toque na TV encontrada  3) "Permitir" na tela da TV.
 * Digitar o IP fica como alternativa escondida.
 */
export const WifiPairingModal: React.FC<WifiPairingModalProps> = ({
  isOpen,
  onClose,
  connectionStatus,
  statusMessage,
  onPairSuccess,
}) => {
  const canAutoScan = WifiDiscoveryService.canAutoDetectSubnet();
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [found, setFound] = useState<DiscoveredTV[]>([]);
  const [scanDone, setScanDone] = useState(false);
  const [showManual, setShowManual] = useState(!canAutoScan);
  const [manualIp, setManualIp] = useState('');
  const [pairing, setPairing] = useState<{ ip: string; port: number } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const scanCount = useRef(0);

  // Ao abrir: volta ao início e (no app) já começa a procurar
  useEffect(() => {
    if (!isOpen) return;
    setPairing(null);
    setShowDetails(false);
    setFound([]);
    setScanDone(false);
    setShowManual(!canAutoScan);
    if (canAutoScan) startScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  /** Procura TVs LG na rede do celular */
  async function startScan() {
    setIsScanning(true);
    setScanDone(false);
    setFound([]);
    setProgress(0);
    scanCount.current++;
    try {
      // Na primeira vez o iOS mostra o pedido de acesso à Rede Local
      await WifiDiscoveryService.requestLocalNetworkPermission();
      const base = subnetPrefix(manualIp) || '192.168.1';
      const result = await WifiDiscoveryService.scan(base, (scanned, total, list) => {
        setProgress(total ? scanned / total : 0);
        setFound(list);
      });
      setFound(result.found);
    } catch (e) {
      console.error('Falha na busca de TVs:', e);
    } finally {
      setIsScanning(false);
      setScanDone(true);
    }
  }

  /** Cadastra (ou reaproveita) a TV e inicia o pareamento */
  function startPairing(ip: string, port = 3001) {
    const cleanIp = ip.trim();
    if (!cleanIp) return;
    feedback.playClick('standard');

    // Mesmo IP já cadastrado: reaproveita a chave (não pede "Permitir" de novo)
    const existing = TVStorage.findByIp(cleanIp);
    const device: TVDevice = {
      id: existing?.id || `tv_${Date.now()}`,
      name: existing?.name || `LG TV (${cleanIp})`,
      ip: cleanIp,
      mac: existing?.mac || '',
      macs: existing?.macs,
      port: existing?.port || port,
      pairingManifest: existing?.pairingManifest,
      clientKey: existing?.clientKey || '',
      modelName: existing?.modelName || 'webOS Smart TV',
      webosVersion: existing?.webosVersion || 'webOS',
      isOnline: false,
      powerState: 'standby',
      lastConnected: Date.now(),
    };

    setPairing({ ip: cleanIp, port: device.port });
    setShowDetails(false);
    onPairSuccess(device);
    tvConnection.connect(device);
  }

  // Separa a mensagem de erro em texto principal e detalhe técnico
  const [errorMain, errorDetail] = (() => {
    const marker = statusMessage.match(/(Resposta da TV:|Detalhe:)/);
    if (!marker || marker.index === undefined) return [statusMessage, ''];
    return [statusMessage.slice(0, marker.index).trim(), statusMessage.slice(marker.index + marker[0].length).trim()];
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="" className="w-9 h-9 rounded-xl" />
            <div>
              <h3 className="text-base font-bold text-white">Conectar à TV</h3>
              <p className="text-[11px] text-neutral-400">TV ligada e no mesmo Wi-Fi do celular</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {pairing ? (
          /* ---------- PAREANDO ---------- */
          <div className="space-y-3">
            {connectionStatus === 'prompt_showing' && (
              <div className="p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-center space-y-2">
                <Tv className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-lg font-extrabold text-white">Olhe para a TV</h4>
                <p className="text-sm text-amber-100 leading-relaxed">
                  Apareceu um aviso pedindo permissão. Com o controle da TV, escolha <strong className="text-white">Permitir</strong>.
                </p>
              </div>
            )}

            {connectionStatus === 'connected' && (
              <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/50 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-extrabold text-white">Conectado!</h4>
                <p className="text-sm text-neutral-300">Da próxima vez o app conecta sozinho.</p>
                <button
                  onClick={onClose}
                  className="mt-2 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm active:scale-95 transition-all"
                >
                  Usar o controle
                </button>
              </div>
            )}

            {(connectionStatus === 'connecting' || connectionStatus === 'disconnected') && (
              <div className="p-5 rounded-2xl bg-neutral-950/70 border border-white/5 text-center space-y-2">
                <Loader2 className="w-9 h-9 text-red-500 mx-auto animate-spin" />
                <h4 className="text-base font-bold text-white">Conectando à TV...</h4>
                <p className="text-xs text-neutral-400 font-mono">{pairing.ip}</p>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-100 leading-relaxed">{errorMain}</p>
                </div>
                {errorDetail && (
                  <div>
                    <button onClick={() => setShowDetails(!showDetails)} className="text-[11px] text-red-300 underline">
                      {showDetails ? 'Esconder detalhes' : 'Ver detalhes técnicos'}
                    </button>
                    {showDetails && (
                      <p className="mt-1.5 p-2 rounded-lg bg-black/40 text-[10px] text-neutral-300 font-mono break-all select-text">
                        {errorDetail}
                      </p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPairing(null)}
                    className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => startPairing(pairing.ip, pairing.port)}
                    className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Tentar de novo
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ---------- BUSCA ---------- */
          <div className="space-y-3">
            {canAutoScan && (
              <div className="space-y-2">
                {isScanning && (
                  <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white font-semibold">
                      <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                      Procurando TVs no seu Wi-Fi...
                    </div>
                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 transition-all duration-150" style={{ width: `${Math.round(progress * 100)}%` }} />
                    </div>
                  </div>
                )}

                {found.map((tv) => {
                  const saved = TVStorage.findByIp(tv.ip);
                  return (
                    <button
                      key={tv.ip}
                      onClick={() => startPairing(tv.ip, tv.port)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-950 border border-emerald-500/40 hover:border-emerald-500 text-left active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                          <Tv className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{saved?.name || 'TV LG encontrada'}</div>
                          <div className="text-[11px] text-neutral-400 font-mono">{tv.ip}</div>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5">
                        Conectar <ChevronRight className="w-4 h-4" />
                      </span>
                    </button>
                  );
                })}

                {scanDone && !isScanning && found.length === 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <p className="text-sm text-amber-100 font-semibold">Nenhuma TV encontrada</p>
                    <ul className="text-xs text-amber-200/90 space-y-1 list-disc pl-4">
                      <li>A TV está ligada e no mesmo Wi-Fi?</li>
                      <li>
                        {scanCount.current <= 1
                          ? 'Se o iPhone pediu acesso à Rede Local, toque em Permitir e busque de novo.'
                          : 'Confira em Ajustes → Privacidade e Segurança → Rede Local se o app está permitido.'}
                      </li>
                    </ul>
                  </div>
                )}

                {!isScanning && (
                  <button
                    onClick={startScan}
                    className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Wifi className="w-4 h-4" />
                    {scanDone ? 'Buscar de novo' : 'Buscar TVs'}
                  </button>
                )}
              </div>
            )}

            {/* Alternativa: digitar o IP */}
            {showManual ? (
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/5 space-y-2">
                <label className="text-xs font-bold text-neutral-300 block">IP da TV</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={manualIp}
                    onChange={(e) => setManualIp(e.target.value)}
                    placeholder="192.168.1.100"
                    className="flex-1 min-w-0 bg-neutral-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-600 font-mono focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => startPairing(manualIp)}
                    disabled={!manualIp.trim()}
                    className="px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-sm"
                  >
                    Conectar
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Na TV: Configurações → Rede → Wi-Fi → Configurações avançadas → Endereço IP.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowManual(true)}
                className="w-full text-xs text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 py-1"
              >
                <Keyboard className="w-3.5 h-3.5" /> Digitar o IP da TV
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
