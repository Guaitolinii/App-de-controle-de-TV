import React, { useState } from 'react';
import { 
  Tv, 
  Gamepad2, 
  MousePointer, 
  Hash, 
  Keyboard, 
  PlaySquare, 
  Sparkles,
  Sliders,
  Radio
} from 'lucide-react';
import { ActiveTab, ChannelInfo, InputSource, PowerState, TVDevice } from '../../types/tv';
import { RemoteHeader } from './RemoteHeader';
import { RemoteDPad } from './RemoteDPad';
import { RemoteVolumeChannels } from './RemoteVolumeChannels';
import { RemoteAppShortcuts } from './RemoteAppShortcuts';
import { RemoteTouchpad } from './RemoteTouchpad';
import { RemoteNumpad } from './RemoteNumpad';
import { RemoteMediaControls } from './RemoteMediaControls';
import { RemoteTextInput } from './RemoteTextInput';
import { feedback } from '../../services/feedback';

interface RemoteBodyProps {
  device: TVDevice;
  powerState: PowerState;
  volume: number;
  isMuted: boolean;
  activeAppId: string | null;
  onTogglePower: () => void;
  onOpenDeviceManager: () => void;
  onOpenInspector: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  onOpenMobileExport: () => void;
  onOpenInputs: () => void;
  onToggleHome: () => void;
  onCommand: (command: string, label: string) => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onToggleMute: () => void;
  onChannelUp: () => void;
  onChannelDown: () => void;
  onShowInfo: () => void;
  onLaunchApp: (appId: string, appName: string) => void;
  onMovePointer: (dx: number, dy: number) => void;
  onClickPointer: () => void;
  onResetPointer: () => void;
  onSendNumber: (num: string) => void;
  onSendChannel: (channel: string) => void;
  onSendText: (text: string) => void;
  onSendEnter: () => void;
  onSendBackspace: () => void;
  onColorButton: (color: string) => void;
}

export const RemoteBody: React.FC<RemoteBodyProps> = ({
  device,
  powerState,
  volume,
  isMuted,
  activeAppId,
  onTogglePower,
  onOpenDeviceManager,
  onOpenInspector,
  onOpenGuide,
  onOpenSettings,
  onOpenMobileExport,
  onOpenInputs,
  onToggleHome,
  onCommand,
  onVolumeUp,
  onVolumeDown,
  onToggleMute,
  onChannelUp,
  onChannelDown,
  onShowInfo,
  onLaunchApp,
  onMovePointer,
  onClickPointer,
  onResetPointer,
  onSendNumber,
  onSendChannel,
  onSendText,
  onSendEnter,
  onSendBackspace,
  onColorButton,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('remote');

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'remote', label: 'Controle', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { id: 'touchpad', label: 'Mouse', icon: <MousePointer className="w-3.5 h-3.5" /> },
    { id: 'numpad', label: '123', icon: <Hash className="w-3.5 h-3.5" /> },
    { id: 'keyboard', label: 'Texto', icon: <Keyboard className="w-3.5 h-3.5" /> },
    { id: 'apps', label: 'Mídia', icon: <PlaySquare className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="relative w-full max-w-[390px] mx-auto rounded-[38px] bg-gradient-to-b from-[#1a1a24] via-[#12121a] to-[#0a0a0f] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8),_inset_0_1px_2px_rgba(255,255,255,0.15)] border border-neutral-700/60 ring-1 ring-white/10 select-none">
      
      {/* Remote Top Sensor Emitter (Simulated IR / BT / WiFi transmitter) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-neutral-900 border border-neutral-700/50 flex items-center justify-center">
        <div className="w-3 h-0.5 rounded-full bg-red-600/80" />
      </div>

      <div className="pt-3 pb-1">
        {/* Remote Header (Power, Device, Quick Actions) */}
        <RemoteHeader
          device={device}
          powerState={powerState}
          onTogglePower={onTogglePower}
          onOpenDeviceManager={onOpenDeviceManager}
          onOpenInspector={onOpenInspector}
          onOpenGuide={onOpenGuide}
          onOpenSettings={onOpenSettings}
          onOpenMobileExport={onOpenMobileExport}
        />

        {/* Tab Switcher */}
        <div className="flex items-center justify-between p-1 bg-neutral-900/90 rounded-2xl border border-white/5 my-3 shadow-inner">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  feedback.playClick('standard');
                  setActiveTab(tab.id);
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span className="text-[11px]">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Body */}
        {activeTab === 'remote' && (
          <div className="space-y-1">
            {/* D-Pad Circular Housing & Navigation */}
            <RemoteDPad
              onCommand={onCommand}
              onOpenInputs={onOpenInputs}
              onToggleHome={onToggleHome}
            />

            {/* Volume & Channels Rockers */}
            <RemoteVolumeChannels
              volume={volume}
              isMuted={isMuted}
              onVolumeUp={onVolumeUp}
              onVolumeDown={onVolumeDown}
              onToggleMute={onToggleMute}
              onChannelUp={onChannelUp}
              onChannelDown={onChannelDown}
              onShowInfo={onShowInfo}
            />

            {/* Streaming App Shortcuts */}
            <RemoteAppShortcuts
              onLaunchApp={onLaunchApp}
              activeAppId={activeAppId}
            />
          </div>
        )}

        {activeTab === 'touchpad' && (
          <RemoteTouchpad
            onMovePointer={onMovePointer}
            onClickPointer={onClickPointer}
            onBack={() => onCommand('BACK', 'Voltar')}
            onScroll={(delta) => onCommand(delta > 0 ? 'DOWN' : 'UP', 'Rolar')}
            onResetPointer={onResetPointer}
          />
        )}

        {activeTab === 'numpad' && (
          <RemoteNumpad
            onSendNumber={onSendNumber}
            onSendChannel={onSendChannel}
          />
        )}

        {activeTab === 'keyboard' && (
          <RemoteTextInput
            onSendText={onSendText}
            onSendEnter={onSendEnter}
            onSendBackspace={onSendBackspace}
          />
        )}

        {activeTab === 'apps' && (
          <div className="space-y-2">
            <RemoteMediaControls
              onMediaCommand={onCommand}
              onColorButton={onColorButton}
            />
            <RemoteAppShortcuts
              onLaunchApp={onLaunchApp}
              activeAppId={activeAppId}
            />
          </div>
        )}

        {/* Remote Bottom Logo */}
        <div className="pt-2 text-center">
          <span className="text-[9px] font-black tracking-widest text-neutral-600 uppercase">
            LG Magic Remote • webOS
          </span>
        </div>
      </div>
    </div>
  );
};
