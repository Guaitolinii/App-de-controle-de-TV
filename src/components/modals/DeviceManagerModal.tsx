import React, { useState } from 'react';
import { X, Plus, Tv, Wifi, Zap, Trash2, Check, Radio, Shield, Info, Key, AlertTriangle } from 'lucide-react';
import { TVDevice } from '../../types/tv';
import { WakeOnLanService } from '../../services/wol';
import { feedback } from '../../services/feedback';

interface DeviceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: TVDevice[];
  activeDeviceId: string;
  onSelectDevice: (device: TVDevice) => void;
  onAddDevice: (device: TVDevice) => void;
  onRemoveDevice: (id: string) => void;
  onSendWol: (mac: string) => void;
}

export const DeviceManagerModal: React.FC<DeviceManagerModalProps> = ({
  isOpen,
  onClose,
  devices,
  activeDeviceId,
  onSelectDevice,
  onAddDevice,
  onRemoveDevice,
  onSendWol,
}) => {
  const [isAdding, setIsAdding] = useState(devices.length === 0);
  const [newName, setNewName] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newPort, setNewPort] = useState<number>(3001);
  const [newMac, setNewMac] = useState('');
  const [wolStatus, setWolStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveNewDevice = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIp = newIp.trim();
    if (!cleanIp) return;

    feedback.playClick('standard');
    const formattedMac = newMac ? WakeOnLanService.formatMac(newMac) : '';

    // A chave começa VAZIA para que a TV faça o pareamento REAL na primeira conexão!
    const newDev: TVDevice = {
      id: `tv_${Date.now()}`,
      name: newName.trim() || `LG TV (${cleanIp})`,
      ip: cleanIp,
      mac: formattedMac,
      port: newPort,
      clientKey: '', // Real: preenchida após o usuário clicar 'Permitir' na TV
      modelName: newPort === 3001 ? 'webOS 2022+ (wss://3001)' : 'webOS Legado (ws://3000)',
      webosVersion: newPort === 3001 ? 'webOS 2022+' : 'webOS antigo',
      isOnline: false,
      powerState: 'standby',
      lastConnected: Date.now(),
    };

    onAddDevice(newDev);
    onSelectDevice(newDev);
    setIsAdding(false);
    setNewName('');
    setNewIp('');
    setNewMac('');
  };

  const handleTestWol = (mac: string) => {
    if (!mac) {
      alert('Cadastre o MAC Address da TV para usar o Wake-on-LAN.');
      return;
    }
    feedback.playClick('power');
    onSendWol(mac);
    setWolStatus(`Magic Packet UDP enviado para ${mac} (porta 9)!`);
    setTimeout(() => setWolStatus(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-base font-bold text-white">Gerenciador de Smart TVs LG</h3>
              <p className="text-[11px] text-neutral-400">Conexão WebSocket direta por IP na rede local</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* WoL feedback alert */}
        {wolStatus && (
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Zap className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{wolStatus}</span>
          </div>
        )}

        {/* Informative Note about Manual IP & iOS Multicast */}
        <div className="p-3 rounded-2xl bg-neutral-950/80 border border-white/5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>Cadastro Manual do IP Local</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Na sua TV LG, veja o IP em: <span className="text-white font-mono">Configurações → Rede → Conexão Wi-Fi → Configurações Avançadas</span>.
          </p>
        </div>

        {/* Devices List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-medium px-1">
            <span>TVs Cadastradas ({devices.length})</span>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Outra TV
              </button>
            )}
          </div>

          {devices.length === 0 && !isAdding && (
            <div className="text-center py-6 p-4 rounded-2xl bg-neutral-950/60 border border-dashed border-neutral-700 space-y-2">
              <Tv className="w-8 h-8 text-neutral-500 mx-auto" />
              <p className="text-xs text-neutral-300 font-bold">Nenhuma TV LG cadastrada ainda</p>
              <p className="text-[11px] text-neutral-500">Cadastre o IP da sua TV LG para conectar imediatamente.</p>
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Cadastrar TV Agora
              </button>
            </div>
          )}

          {devices.map((dev) => {
            const isActive = dev.id === activeDeviceId;
            const isPaired = !!dev.clientKey;

            return (
              <div
                key={dev.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-neutral-800/90 border-red-500 shadow-md ring-1 ring-red-500/30'
                    : 'bg-neutral-950/60 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div 
                    onClick={() => {
                      feedback.playClick('standard');
                      onSelectDevice(dev);
                    }}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{dev.name}</span>
                      {isActive && (
                        <span className="text-[9px] bg-red-600/30 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold">
                          Ativa
                        </span>
                      )}
                      {isPaired ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Pareada
                        </span>
                      ) : (
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                          <Key className="w-2.5 h-2.5" /> Aguardando Pareamento
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1 font-mono">
                      <span>IP: {dev.ip}:{dev.port}</span>
                      {dev.mac && (
                        <>
                          <span>•</span>
                          <span>MAC: {dev.mac}</span>
                        </>
                      )}
                    </div>

                    {isPaired ? (
                      <p className="text-[10px] text-neutral-500 font-mono mt-1 truncate max-w-xs">
                        client-key: {dev.clientKey.substring(0, 10)}... (autenticada)
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-300/80 mt-1">
                        Ao conectar, confirme "Permitir" no aviso que surgirá na tela da sua TV.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 ml-2">
                    {dev.mac && (
                      <button
                        onClick={() => handleTestWol(dev.mac)}
                        title="Testar Ligar TV (Wake-on-LAN)"
                        className="p-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onRemoveDevice(dev.id)}
                      title="Remover TV"
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Device Form */}
        {isAdding && (
          <form onSubmit={handleSaveNewDevice} className="p-4 rounded-2xl bg-neutral-950 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Cadastrar TV LG Local
              </h4>
              {devices.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Nome para Identificação</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: LG OLED Sala, TV Quarto"
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[11px] text-neutral-400 block mb-1">Endereço IP na Rede Local *</label>
                <input
                  type="text"
                  required
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="Ex: 192.168.1.150"
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Porta webOS</label>
                <select
                  value={newPort}
                  onChange={(e) => setNewPort(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                >
                  <option value={3001}>3001 (2022+)</option>
                  <option value={3000}>3000 (Antiga)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">
                MAC Address (Opcional - necessário apenas para Wake-on-LAN)
              </label>
              <input
                type="text"
                value={newMac}
                onChange={(e) => setNewMac(e.target.value)}
                placeholder="Ex: A4:5E:60:11:22:33"
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-red-500"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Veja o MAC na TV em: Configurações → Geral → Sobre esta TV → Informações da TV.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {devices.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold"
                >
                  Voltar
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Conectar e Parear com a TV
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
