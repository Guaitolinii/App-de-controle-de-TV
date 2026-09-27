import React, { useState } from 'react';
import { X, Terminal, Send, Trash2, ArrowUpRight, ArrowDownLeft, ShieldCheck, Zap, Copy, Check } from 'lucide-react';
import { SSAPMessage, TVDevice } from '../../types/tv';
import { WakeOnLanService } from '../../services/wol';
import { feedback } from '../../services/feedback';

interface ProtocolInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SSAPMessage[];
  onClearLogs: () => void;
  device: TVDevice;
  onSendCustomSSAP: (uri: string, payload: any) => void;
}

export const ProtocolInspectorModal: React.FC<ProtocolInspectorModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  device,
  onSendCustomSSAP,
}) => {
  const [customUri, setCustomUri] = useState('ssap://system.notifications/createToast');
  const [customPayload, setCustomPayload] = useState('{"message": "Olá da Rede Local! 🚀"}');
  const [copiedMac, setCopiedMac] = useState(false);

  if (!isOpen) return null;

  const wolInfo = WakeOnLanService.inspectPacket(device.mac);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    feedback.playClick('standard');
    try {
      const parsed = JSON.parse(customPayload);
      onSendCustomSSAP(customUri, parsed);
    } catch (err) {
      alert('JSON inválido no payload.');
    }
  };

  const handleCopyHex = () => {
    navigator.clipboard.writeText(wolInfo.hexDump);
    setCopiedMac(true);
    setTimeout(() => setCopiedMac(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Console SSAP & Inspetor de Rede</h3>
              <p className="text-[11px] text-neutral-400">
                WebSocket: <span className="font-mono text-emerald-400">wss://{device.ip}:{device.port}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearLogs}
              title="Limpar Histórico"
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Logs Stream */}
        <div className="flex-1 min-h-[180px] max-h-72 overflow-y-auto bg-black/80 rounded-xl p-3 border border-white/5 font-mono text-[11px] space-y-2 select-text">
          {logs.length === 0 ? (
            <div className="text-neutral-500 text-center py-8">
              Nenhuma mensagem SSAP registrada ainda. Pressione botões no controle para ver os pacotes em tempo real.
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id} 
                className={`p-2 rounded border ${
                  log.direction === 'outgoing'
                    ? 'bg-neutral-900/90 border-blue-500/20 text-blue-200'
                    : log.direction === 'incoming'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-neutral-950 border-white/5 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                  <div className="flex items-center gap-1.5">
                    {log.direction === 'outgoing' ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className="font-bold uppercase tracking-wider">{log.type}</span>
                    {log.uri && <span className="text-neutral-300">{log.uri}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {log.latencyMs !== undefined && (
                      <span className="text-neutral-500 font-mono">{log.latencyMs}ms</span>
                    )}
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap break-all text-neutral-300">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>

        {/* Wake-on-LAN Magic Packet Inspector Box */}
        <div className="p-3 rounded-xl bg-neutral-950/70 border border-white/5 shrink-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span>Wake-on-LAN Magic Packet (IEEE 802.3)</span>
            </div>
            <button
              onClick={handleCopyHex}
              className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded"
            >
              {copiedMac ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedMac ? 'Copiado!' : 'Copiar Hex'}</span>
            </button>
          </div>
          <p className="text-[10px] text-neutral-400">
            Tamanho: <span className="text-white font-mono">{wolInfo.packetLength} bytes</span> (6x 0xFF Sync + 16x MAC de <span className="text-amber-300 font-mono">{device.mac}</span>)
          </p>
          <div className="bg-black/90 p-2 rounded border border-white/5 font-mono text-[9px] text-neutral-400 overflow-x-auto select-all">
            {wolInfo.hexDump.substring(0, 100)}...
          </div>
        </div>

        {/* Send Custom SSAP Command */}
        <form onSubmit={handleSend} className="space-y-2 shrink-0 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>Testar Comando SSAP Customizado</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customUri}
              onChange={(e) => setCustomUri(e.target.value)}
              placeholder="URI SSAP (ex: ssap://audio/setVolume)"
              className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Enviar
            </button>
          </div>

          <input
            type="text"
            value={customPayload}
            onChange={(e) => setCustomPayload(e.target.value)}
            placeholder='Payload JSON (ex: {"volume": 35})'
            className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </form>
      </div>
    </div>
  );
};
