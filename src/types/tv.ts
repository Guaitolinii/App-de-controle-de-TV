export type PowerState = 'on' | 'standby' | 'turning_on';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'prompt_showing' | 'connected' | 'error';

export interface TVDevice {
  id: string;
  name: string;
  ip: string;
  mac: string;
  port: number;
  clientKey: string;
  modelName: string;
  webosVersion: string;
  isOnline: boolean;
  powerState: PowerState;
  lastConnected?: number;
}

export interface ChannelInfo {
  number: string;
  name: string;
  category: string;
  programTitle: string;
  programDescription: string;
  thumbnail?: string;
}

export interface InputSource {
  id: string;
  label: string;
  type: 'hdmi' | 'antenna' | 'av' | 'usb';
  connectedDevice?: string;
  icon: string;
}

export interface AppLauncherItem {
  id: string;
  title: string;
  iconBg: string;
  textColor: string;
  badge?: string;
  description: string;
  accentColor: string;
}

export interface SSAPMessage {
  id: string;
  timestamp: number;
  direction: 'outgoing' | 'incoming' | 'system';
  uri?: string;
  type: 'register' | 'request' | 'response' | 'registered' | 'error' | 'wol';
  payload: any;
  status: 'ok' | 'pending' | 'error';
  latencyMs?: number;
}

export type ActiveTab = 'remote' | 'touchpad' | 'numpad' | 'apps' | 'inputs' | 'keyboard';
