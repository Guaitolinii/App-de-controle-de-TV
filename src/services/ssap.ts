import { SSAPMessage } from '../types/tv';

export const SSAP_PERMISSIONS = [
  'LAUNCH',
  'LAUNCH_WEBAPP',
  'APP_TO_APP',
  'CONTROL_AUDIO',
  'CONTROL_DISPLAY',
  'CONTROL_INPUT_JOYSTICK',
  'CONTROL_INPUT_MEDIA_RECORDING',
  'CONTROL_INPUT_MEDIA_PLAYBACK',
  'CONTROL_INPUT_TV',
  'CONTROL_POWER',
  'READ_APP_STATUS',
  'READ_CURRENT_CHANNEL',
  'READ_INPUT_DEVICE_LIST',
  'READ_NETWORK_STATE',
  'READ_TV_CHANNEL_LIST',
  'WRITE_NOTIFICATION_TOAST',
  'CONTROL_INPUT_TEXT',
  'READ_INSTALLED_APPS',
  'READ_LGE_TV_INPUT_EVENTS',
  'READ_TV_CURRENT_TIME',
  'READ_RUNNING_APPS',
];

export const SSAP_ENDPOINTS = {
  // Audio
  VOLUME_UP: 'ssap://audio/volumeUp',
  VOLUME_DOWN: 'ssap://audio/volumeDown',
  SET_VOLUME: 'ssap://audio/setVolume',
  GET_VOLUME: 'ssap://audio/getVolume',
  SET_MUTE: 'ssap://audio/setMute',
  GET_MUTE: 'ssap://audio/getMute',

  // TV / Channels
  CHANNEL_UP: 'ssap://tv/channelUp',
  CHANNEL_DOWN: 'ssap://tv/channelDown',
  GET_CURRENT_CHANNEL: 'ssap://tv/getCurrentChannel',
  GET_CHANNEL_LIST: 'ssap://tv/getChannelList',
  OPEN_CHANNEL: 'ssap://tv/openChannel',

  // Input & Pointer Socket
  SWITCH_INPUT: 'ssap://tv/switchInput',
  GET_INPUT_LIST: 'ssap://tv/getExternalInputList',
  GET_INPUT_SOCKET: 'ssap://com.webos.service.networkinput/getPointerInputSocket',

  // Launcher & Apps
  LAUNCH: 'ssap://system.launcher/launch',
  CLOSE: 'ssap://system.launcher/close',
  LIST_APPS: 'ssap://com.webos.applicationManager/listApps',
  GET_FOREGROUND_APP: 'ssap://com.webos.applicationManager/getForegroundAppInfo',
  GET_APP_STATE: 'ssap://system.launcher/getAppState',

  // System & Notifications
  CREATE_TOAST: 'ssap://system.notifications/createToast',
  TURN_OFF: 'ssap://system/turnOff',
  GET_SYSTEM_INFO: 'ssap://system/getSystemInfo',
  GET_SERVICES: 'ssap://api/getServiceList',
  INPUT_INSERT_TEXT: 'ssap://com.webos.service.ime/insertText',
  INPUT_ENTER: 'ssap://com.webos.service.ime/sendEnterKey',
  INPUT_DELETE: 'ssap://com.webos.service.ime/deleteCharacters',
};

export interface AppShortcut {
  id: string;
  appId: string;
  name: string;
  category: string;
  color: string;
  textColor: string;
  badge?: string;
  iconName: string;
}

export const POPULAR_APPS: AppShortcut[] = [
  {
    id: 'netflix',
    appId: 'netflix',
    name: 'Netflix',
    category: 'Filmes & Séries',
    color: '#E50914',
    textColor: '#ffffff',
    badge: '4K HDR',
    iconName: 'Film',
  },
  {
    id: 'youtube',
    appId: 'youtube.leanback.v4',
    name: 'YouTube',
    category: 'Vídeos',
    color: '#FF0000',
    textColor: '#ffffff',
    badge: 'Popular',
    iconName: 'Tv',
  },
  {
    id: 'prime',
    appId: 'amazon',
    name: 'Prime Video',
    category: 'Filmes & Séries',
    color: '#00A8E1',
    textColor: '#ffffff',
    badge: 'Prime',
    iconName: 'Clapperboard',
  },
  {
    id: 'disney',
    appId: 'com.disney.disneyplus-prod',
    name: 'Disney+',
    category: 'Entretenimento',
    color: '#113CCF',
    textColor: '#ffffff',
    badge: 'IMAX',
    iconName: 'Sparkles',
  },
  {
    id: 'max',
    appId: 'com.hbo.hbomax',
    name: 'Max',
    category: 'Filmes & HBO',
    color: '#002BE7',
    textColor: '#ffffff',
    badge: 'HBO',
    iconName: 'Flame',
  },
  {
    id: 'spotify',
    appId: 'spotify-beehive',
    name: 'Spotify',
    category: 'Músicas & Podcasts',
    color: '#1DB954',
    textColor: '#ffffff',
    badge: 'Música',
    iconName: 'Headphones',
  },
  {
    id: 'globoplay',
    appId: 'globoplay',
    name: 'Globoplay',
    category: 'Nacional & Novelas',
    color: '#FB0036',
    textColor: '#ffffff',
    badge: 'Brasil',
    iconName: 'Radio',
  },
  {
    id: 'appletv',
    appId: 'com.apple.appletv',
    name: 'Apple TV+',
    category: 'Apple Originals',
    color: '#27272A',
    textColor: '#ffffff',
    badge: 'Originals',
    iconName: 'MonitorPlay',
  },
  {
    id: 'browser',
    appId: 'com.webos.app.browser',
    name: 'Navegador Web',
    category: 'Internet webOS',
    color: '#3B82F6',
    textColor: '#ffffff',
    badge: 'Web',
    iconName: 'Globe',
  },
  {
    id: 'settings',
    appId: 'com.webos.app.settings',
    name: 'Configurações',
    category: 'Sistema webOS',
    color: '#4B5563',
    textColor: '#ffffff',
    iconName: 'Settings',
  },
];

export const DEFAULT_CHANNELS = [
  {
    number: '5.1',
    name: 'TV Globo HD',
    category: 'Aberta',
    programTitle: 'Jornal Nacional',
    programDescription: 'As principais notícias do Brasil e do mundo com William Bonner e Renata Vasconcellos.',
  },
  {
    number: '4.1',
    name: 'SBT HD',
    category: 'Aberta',
    programTitle: 'Programa Silvio Santos',
    programDescription: 'Gincanas, atrações musicais e as clássicas câmeras escondidas.',
  },
  {
    number: '7.1',
    name: 'Record TV HD',
    category: 'Aberta',
    programTitle: 'Domingo Espetacular',
    programDescription: 'Reportagens investigativas, tecnologia e os maiores destaques da semana.',
  },
  {
    number: '13.1',
    name: 'Band HD',
    category: 'Aberta',
    programTitle: 'Jornal da Band',
    programDescription: 'Análise aprofundada dos acontecimentos nacionais e internacionais.',
  },
  {
    number: '577',
    name: 'CNN Brasil',
    category: 'Notícias',
    programTitle: 'CNN 360°',
    programDescription: 'Debates e apurações exclusivas dos bastidores de Brasília.',
  },
  {
    number: '539',
    name: 'SporTV HD',
    category: 'Esportes',
    programTitle: 'Troca de Passes',
    programDescription: 'A rodada do futebol com análises táticas e lances polêmicos.',
  },
  {
    number: '550',
    name: 'Discovery Channel',
    category: 'Documentários',
    programTitle: 'Pesca Mortal',
    programDescription: 'A dramática rotina dos pescadores de caranguejos no mar de Bering.',
  },
];

export const DEFAULT_INPUTS = [
  {
    id: 'HDMI_1',
    label: 'HDMI 1',
    type: 'hdmi' as const,
    connectedDevice: 'PlayStation 5 (4K 120Hz VRR)',
    icon: 'Gamepad2',
  },
  {
    id: 'HDMI_2',
    label: 'HDMI 2 (eARC)',
    type: 'hdmi' as const,
    connectedDevice: 'Apple TV 4K / Soundbar Dolby Atmos',
    icon: 'Tv',
  },
  {
    id: 'HDMI_3',
    label: 'HDMI 3',
    type: 'hdmi' as const,
    connectedDevice: 'Nintendo Switch OLED',
    icon: 'Gamepad',
  },
  {
    id: 'HDMI_4',
    label: 'HDMI 4',
    type: 'hdmi' as const,
    connectedDevice: 'PC Gamer (RTX 4090 HDR)',
    icon: 'Monitor',
  },
  {
    id: 'ANTENNA',
    label: 'Antena Digital / Live TV',
    type: 'antenna' as const,
    connectedDevice: 'Sinal Digital ISDB-Tb',
    icon: 'Radio',
  },
  {
    id: 'AV',
    label: 'Entrada AV Composta',
    type: 'av' as const,
    connectedDevice: 'Dispositivo Legado',
    icon: 'Cable',
  },
];
