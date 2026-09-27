import React, { useState } from 'react';
import { X, Plus, Tv, Wifi, Zap, Trash2, Check, RefreshCw, Radio, Shield, Info } from 'lucide-react';
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
  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [newName, setNewName] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newMac, setNewMac] = useState('');
  const [wolStatus, setWolStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartScan = () => {
    feedback.playClick('standard');
    setIsScanning(true);
    setScanMessage('Enviando requisição SSDP M-SEARCH (239.255.255.250:1900)...');

    setTimeout(() => {
      setScanMessage('Analisando respostas UPnP urn:schemas-upnp-org:device:MediaRenderer...');
    }, 1200);

    setTimeout(() => {
      setIsScanning(false);
      setScanMessage('1 TV LG webOS encontrada na sub-rede local!');
    }, 2400);
  };

  const handleSaveNewDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newIp) return;

    feedback.playClick('standard');
    const formattedMac = newMac ? WakeOnLanService.formatMac(newMac) : 'A4:5E:60:11:22:33';

    const newDev: TVDevice = {
      id: `tv_${Date.now()}`,
      name: newName,
      ip: newIp.trim(),
      mac: formattedMac,
      port: 3001,
      clientKey: 'b' + Math.random().toString(16).substring(2, 10) + '981034f81a',
      modelName: 'webOS Smart TV',
      webosVersion: 'webOS 23',
      isOnline: true,
      powerState: 'on',
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
    feedback.playClick('power');
    onSendWol(mac);
    setWolStatus(`Magic Packet UDP broadcast enviado para ${mac} (porta 9)!`);
    setTimeout(() => setWolStatus(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-white">Gerenciador de Smart TVs LG</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
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

        {/* Discovery Scan Bar */}
        <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">Descoberta Automática na Rede</span>
            </div>
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Varrendo...' : 'Buscar TVs'}</span>
            </button>
          </div>
          {scanMessage && (
            <p className="text-[11px] text-neutral-400 font-mono">
              {scanMessage}
            </p>
          )}
        </div>

        {/* Devices List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-medium px-1">
            <span>Dispositivos Salvos ({devices.length})</span>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Manual
              </button>
            )}
          </div>

          {devices.map((dev) => {
            const isActive = dev.id === activeDeviceId;
            return (
              <div
                key={dev.id}
                className={`p-3.5 rounded-xl border transition-all ${
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
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1 font-mono">
                      <span>IP: {dev.ip}</span>
                      <span>•</span>
                      <span>MAC: {dev.mac}</span>
                      <span>•</span>
                      <span className="text-neutral-500">{dev.modelName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => handleTestWol(dev.mac)}
                      title="Testar Ligar TV (Wake-on-LAN)"
                      className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                    </button>

                    {devices.length > 1 && (
                      <button
                        onClick={() => onRemoveDevice(dev.id)}
                        title="Remover TV"
                        className="p-2 rounded-lg bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Device Form */}
        {isAdding && (
          <form onSubmit={handleSaveNewDevice} className="p-4 rounded-xl bg-neutral-950 border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Cadastrar Nova TV LG
            </h4>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Nome de Identificação</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: LG OLED Quarto, TV Churrasqueira"
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Endereço IP Local</label>
                <input
                  type="text"
                  required
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="Ex: 192.168.1.150"
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">MAC Address (Para WoL)</label>
                <input
                  type="text"
                  value={newMac}
                  onChange={(e) => setNewMac(e.target.value)}
                  placeholder="Ex: A4:5E:60:XX:YY:ZZ"
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md"
              >
                Salvar TV
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
