import { ConnectionStatus, InputSource, SSAPMessage, TVDevice } from '../types/tv';
import { SSAP_ENDPOINTS } from './ssap';
import { TvSocket, openTvSocket } from './tvSocket';
import { WakeOnLanService } from './wol';

type EventListener<T> = (data: T) => void;

/** Informações lidas da TV depois do pareamento (salvas no cadastro do aparelho). */
export interface TVDeviceInfo {
  deviceId: string;
  port?: number;
  modelName?: string;
  webosVersion?: string;
  macs?: string[];
  pairingManifest?: ManifestKind;
}

/** App instalado na TV (lista de launch points). */
export interface TVLaunchPoint {
  id: string;
  title: string;
}

/** Formato do manifesto enviado no pareamento */
export type ManifestKind = 'signed' | 'unsigned';

/**
 * Manifesto assinado clássico (o mesmo do LGWebOSRemote / lgtv2), aceito pela maioria das TVs webOS.
 * A assinatura cobre o bloco "signed": não alterar nenhum campo.
 */
const SIGNED_MANIFEST = {
  appVersion: '1.1',
  manifestVersion: 1,
  permissions: [
    'LAUNCH', 'LAUNCH_WEBAPP', 'APP_TO_APP', 'CLOSE', 'TEST_OPEN', 'TEST_PROTECTED', 'CONTROL_AUDIO',
    'CONTROL_DISPLAY', 'CONTROL_INPUT_JOYSTICK', 'CONTROL_INPUT_MEDIA_RECORDING', 'CONTROL_INPUT_MEDIA_PLAYBACK',
    'CONTROL_INPUT_TV', 'CONTROL_POWER', 'READ_APP_STATUS', 'READ_CURRENT_CHANNEL', 'READ_INPUT_DEVICE_LIST',
    'READ_NETWORK_STATE', 'READ_RUNNING_APPS', 'READ_TV_CHANNEL_LIST', 'WRITE_NOTIFICATION_TOAST', 'READ_POWER_STATE',
    'READ_COUNTRY_INFO', 'READ_SETTINGS', 'CONTROL_TV_SCREEN', 'CONTROL_TV_STANBY', 'CONTROL_FAVORITE_GROUP',
    'CONTROL_USER_INFO', 'CHECK_BLUETOOTH_DEVICE', 'CONTROL_BLUETOOTH', 'CONTROL_TIMER_INFO', 'STB_INTERNAL_CONNECTION',
    'CONTROL_RECORDING', 'READ_RECORDING_STATE', 'WRITE_RECORDING_LIST', 'READ_RECORDING_LIST', 'READ_RECORDING_SCHEDULE',
    'WRITE_RECORDING_SCHEDULE', 'READ_STORAGE_DEVICE_LIST', 'READ_TV_PROGRAM_INFO', 'CONTROL_BOX_CHANNEL',
    'READ_TV_ACR_AUTH_TOKEN', 'READ_TV_CONTENT_STATE', 'READ_TV_CURRENT_TIME', 'ADD_LAUNCHER_CHANNEL', 'SET_CHANNEL_SKIP',
    'RELEASE_CHANNEL_SKIP', 'CONTROL_CHANNEL_BLOCK', 'DELETE_SELECT_CHANNEL', 'CONTROL_CHANNEL_GROUP', 'SCAN_TV_CHANNELS',
    'CONTROL_TV_POWER', 'CONTROL_WOL',
  ],
  signatures: [
    {
      signature:
        'eyJhbGdvcml0aG0iOiJSU0EtU0hBMjU2Iiwia2V5SWQiOiJ0ZXN0LXNpZ25pbmctY2VydCIsInNpZ25hdHVyZVZlcnNpb24iOjF9.hrVRgjCwXVvE2OOSpDZ58hR+59aFNwYDyjQgKk3auukd7pcegmE2CzPCa0bJ0ZsRAcKkCTJrWo5iDzNhMBWRyaMOv5zWSrthlf7G128qvIlpMT0YNY+n/FaOHE73uLrS/g7swl3/qH/BGFG2Hu4RlL48eb3lLKqTt2xKHdCs6Cd4RMfJPYnzgvI4BNrFUKsjkcu+WD4OO2A27Pq1n50cMchmcaXadJhGrOqH5YmHdOCj5NSHzJYrsW0HPlpuAx/ECMeIZYDh6RMqaFM2DXzdKX9NmmyqzJ3o/0lkk/N97gfVRLW5hA29yeAwaCViZNCP8iC9aO0q9fQojoa7NQnAtw==',
      signatureVersion: 1,
    },
  ],
  signed: {
    appId: 'com.lge.test',
    created: '20140509',
    localizedAppNames: {
      '': 'LG Remote App',
      'ko-KR': '\uB9AC\uBAA8\uCEE8 \uC571',
      'zxx-XX': '\u041B\u0413 R\u044D\u043Cot\u044D A\u041F\u041F',
    },
    localizedVendorNames: {
      '': 'LG Electronics',
    },
    permissions: [
      'TEST_SECURE', 'CONTROL_INPUT_TEXT', 'CONTROL_MOUSE_AND_KEYBOARD', 'READ_INSTALLED_APPS', 'READ_LGE_SDX',
      'READ_NOTIFICATIONS', 'SEARCH', 'WRITE_SETTINGS', 'WRITE_NOTIFICATION_ALERT', 'CONTROL_POWER',
      'READ_CURRENT_CHANNEL', 'READ_RUNNING_APPS', 'READ_UPDATE_INFO', 'UPDATE_FROM_REMOTE_APP',
      'READ_LGE_TV_INPUT_EVENTS', 'READ_TV_CURRENT_TIME',
    ],
    serial: '2f930e2d2cfe083771f68e4fe7bb07',
    vendorId: 'com.lge',
  },
};

/** Manifesto sem assinatura (formato do aiowebostv / Home Assistant), usado se o assinado for recusado */
const UNSIGNED_MANIFEST = {
  appVersion: '1.1',
  manifestVersion: 1,
  permissions: [
    'APP_TO_APP', 'CLOSE', 'CONTROL_AUDIO', 'CONTROL_DISPLAY', 'CONTROL_INPUT_JOYSTICK', 'CONTROL_INPUT_MEDIA_PLAYBACK',
    'CONTROL_INPUT_MEDIA_RECORDING', 'CONTROL_INPUT_TEXT', 'CONTROL_INPUT_TV', 'CONTROL_MOUSE_AND_KEYBOARD',
    'CONTROL_POWER', 'CONTROL_TV_SCREEN', 'LAUNCH', 'LAUNCH_WEBAPP', 'READ_APP_STATUS', 'READ_COUNTRY_INFO',
    'READ_CURRENT_CHANNEL', 'READ_INPUT_DEVICE_LIST', 'READ_INSTALLED_APPS', 'READ_LGE_SDX', 'READ_LGE_TV_INPUT_EVENTS',
    'READ_NETWORK_STATE', 'READ_NOTIFICATIONS', 'READ_POWER_STATE', 'READ_RUNNING_APPS', 'READ_SETTINGS',
    'READ_TV_CHANNEL_LIST', 'READ_TV_CURRENT_TIME', 'READ_UPDATE_INFO', 'SEARCH', 'TEST_OPEN', 'TEST_PROTECTED',
    'TEST_SECURE', 'UPDATE_FROM_REMOTE_APP', 'WRITE_NOTIFICATION_ALERT', 'WRITE_NOTIFICATION_TOAST', 'WRITE_SETTINGS',
  ],
};

/** Resultado de uma tentativa de pareamento */
type RegisterOutcome =
  | { type: 'registered'; clientKey?: string }
  | { type: 'rejected'; error: string }
  | { type: 'error'; error: string };

/** Monta a URL do socket principal conforme a porta */
function buildTvUrl(ip: string, port: number): string {
  return port === 3001 ? `wss://${ip}:3001` : `ws://${ip}:3000`;
}

/** Normaliza um MAC para AA:BB:CC:DD:EE:FF (ou retorna null se inválido) */
function normalizeMac(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const clean = value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  if (clean.length !== 12 || clean === '000000000000') return null;
  return clean.match(/.{2}/g)!.join(':');
}

export class TVConnection {
  private static instance: TVConnection;
  private ws: TvSocket | null = null;
  private pointerWs: TvSocket | null = null;
  private pointerOpening: Promise<TvSocket | null> | null = null;
  private currentDevice: TVDevice | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reqCounter = 0;
  private connectAttempt = 0;
  private pendingRequests = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void; timeout: ReturnType<typeof setTimeout> }>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelayMs = 3000;
  private isIntentionalDisconnect = false;
  // Tentativa de pareamento em andamento (aguardando resposta da TV)
  private registerWaiter: {
    id: string;
    socket: TvSocket;
    promptShown: boolean;
    arm: (ms: number) => void;
    finish: (outcome: RegisterOutcome) => void;
  } | null = null;
  private volumeSubId: string | null = null;
  private appSubId: string | null = null;
  private launchPoints: TVLaunchPoint[] = [];
  // Resto fracionário do movimento do touchpad (a TV só aceita inteiros)
  private pointerRemainder = { x: 0, y: 0 };

  // Assinaturas de eventos
  private statusListeners = new Set<EventListener<{ status: ConnectionStatus; message?: string }>>();
  private clientKeyListeners = new Set<EventListener<{ deviceId: string; clientKey: string }>>();
  private deviceInfoListeners = new Set<EventListener<TVDeviceInfo>>();
  private volumeListeners = new Set<EventListener<{ volume: number; muted: boolean }>>();
  private appListeners = new Set<EventListener<string | null>>();
  private inputsListeners = new Set<EventListener<InputSource[]>>();
  private launchPointListeners = new Set<EventListener<TVLaunchPoint[]>>();
  private rawLogListeners = new Set<EventListener<SSAPMessage>>();

  private constructor() {}

  static getInstance(): TVConnection {
    if (!TVConnection.instance) {
      TVConnection.instance = new TVConnection();
    }
    return TVConnection.instance;
  }

  // ---------- Assinaturas de eventos ----------

  onStatusChange(listener: EventListener<{ status: ConnectionStatus; message?: string }>) {
    this.statusListeners.add(listener);
    listener({ status: this.status });
    return () => this.statusListeners.delete(listener);
  }

  onClientKey(listener: EventListener<{ deviceId: string; clientKey: string }>) {
    this.clientKeyListeners.add(listener);
    return () => this.clientKeyListeners.delete(listener);
  }

  onDeviceInfo(listener: EventListener<TVDeviceInfo>) {
    this.deviceInfoListeners.add(listener);
    return () => this.deviceInfoListeners.delete(listener);
  }

  onVolume(listener: EventListener<{ volume: number; muted: boolean }>) {
    this.volumeListeners.add(listener);
    return () => this.volumeListeners.delete(listener);
  }

  onForegroundApp(listener: EventListener<string | null>) {
    this.appListeners.add(listener);
    return () => this.appListeners.delete(listener);
  }

  onInputs(listener: EventListener<InputSource[]>) {
    this.inputsListeners.add(listener);
    return () => this.inputsListeners.delete(listener);
  }

  onLaunchPoints(listener: EventListener<TVLaunchPoint[]>) {
    this.launchPointListeners.add(listener);
    return () => this.launchPointListeners.delete(listener);
  }

  onRawLog(listener: EventListener<SSAPMessage>) {
    this.rawLogListeners.add(listener);
    return () => this.rawLogListeners.delete(listener);
  }

  private setStatus(status: ConnectionStatus, message?: string) {
    this.status = status;
    this.statusListeners.forEach((l) => l({ status, message }));
  }

  private logRaw(
    direction: 'outgoing' | 'incoming' | 'system',
    type: SSAPMessage['type'],
    payload: any,
    uri?: string,
    status: SSAPMessage['status'] = 'ok'
  ) {
    const log: SSAPMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      direction,
      type,
      uri,
      payload,
      status,
    };
    this.rawLogListeners.forEach((l) => l(log));
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getCurrentDevice(): TVDevice | null {
    return this.currentDevice;
  }

  public isConnected(): boolean {
    return this.status === 'connected' && !!this.ws?.isOpen();
  }

  // ---------- Conexão ----------

  /**
   * Conecta e pareia com a TV LG. Tentativas, nesta ordem:
   * porta salva (ou 3001/WSS) e depois a outra (3000/WS); em cada porta, o manifesto assinado e o simples.
   * Se a TV recusar sem mostrar o aviso, passa para a próxima tentativa.
   * Se o usuário recusar na TV, para. Chamadas repetidas cancelam a tentativa anterior.
   */
  async connect(device: TVDevice): Promise<void> {
    this.currentDevice = { ...device };
    this.isIntentionalDisconnect = false;
    this.clearReconnectTimer();
    const attempt = ++this.connectAttempt;
    this.closeSockets();

    const ip = device.ip.trim();
    if (!ip) {
      this.setStatus('error', 'Endereço IP não informado');
      return;
    }

    const ports = device.port === 3000 ? [3000, 3001] : [3001, 3000];
    const manifests: ManifestKind[] = device.pairingManifest === 'unsigned' ? ['unsigned', 'signed'] : ['signed', 'unsigned'];
    const failures: string[] = [];
    let anySocketOpened = false;

    this.setStatus('connecting', `Conectando a ${device.name || ip}...`);

    for (const port of ports) {
      for (const kind of manifests) {
        if (attempt !== this.connectAttempt) return;
        const url = buildTvUrl(ip, port);
        this.logRaw('system', 'request', { action: 'connect', url, manifest: kind }, url);

        let socket: TvSocket;
        try {
          socket = await openTvSocket(
            url,
            {
              onMessage: (data) => {
                if (attempt === this.connectAttempt) this.handleMessage(data);
              },
              onClose: (reason) => this.handleSocketClose(attempt, socket, reason),
            },
            5000
          );
        } catch (err: any) {
          if (attempt !== this.connectAttempt) return;
          const message = err?.message || String(err);
          failures.push(`${url}: ${message}`);
          this.logRaw('system', 'error', { url, message }, url, 'error');
          // A porta nem abriu: não adianta tentar o outro manifesto nela
          break;
        }

        if (attempt !== this.connectAttempt) {
          socket.close();
          return;
        }
        anySocketOpened = true;
        this.ws = socket;
        this.logRaw('incoming', 'response', { status: 'Socket aberto', url }, url);

        const outcome = await this.register(socket, kind);
        if (attempt !== this.connectAttempt) return;

        if (outcome.type === 'registered') {
          this.currentDevice.port = port;
          this.currentDevice.pairingManifest = kind;
          this.handleRegistered(outcome.clientKey);
          return;
        }

        // Tentativa falhou: descarta este socket
        if (this.ws === socket) this.ws = null;
        socket.close();

        if (outcome.type === 'rejected') {
          this.isIntentionalDisconnect = true;
          this.setStatus('error', `A TV não autorizou o controle (${outcome.error}). Tente de novo e escolha "Permitir" na TV.`);
          return;
        }

        const label = kind === 'signed' ? 'manifesto assinado' : 'manifesto simples';
        failures.push(`${url} (${label}): ${outcome.error}`);
        this.logRaw('system', 'error', { url, manifest: kind, message: outcome.error }, url, 'error');
      }
    }

    if (attempt !== this.connectAttempt) return;

    if (!anySocketOpened) {
      this.setStatus(
        'error',
        `A TV não respondeu em ${ip}. Confira se ela está ligada e no mesmo Wi-Fi. Detalhe: ${failures.join(' | ')}`
      );
      this.scheduleReconnect();
      return;
    }

    // A TV respondeu, mas recusou todas as tentativas sem mostrar o aviso
    this.setStatus(
      'error',
      `A TV recusou a conexão sem mostrar o aviso. Na TV, ative "LG Connect Apps" (Configurações → Geral → Dispositivos → Configurações de dispositivo externo) e tente de novo. Resposta da TV: ${failures.join(' | ')}`
    );
  }

  /** Envia o pedido de registro e espera: pareado, recusado ou erro */
  private register(socket: TvSocket, kind: ManifestKind): Promise<RegisterOutcome> {
    return new Promise((resolve) => {
      const id = `register_${++this.reqCounter}`;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const finish = (outcome: RegisterOutcome) => {
        if (this.registerWaiter?.id !== id) return;
        if (timer) clearTimeout(timer);
        this.registerWaiter = null;
        resolve(outcome);
      };
      const arm = (ms: number) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          const waiter = this.registerWaiter;
          if (waiter?.id !== id) return;
          finish(
            waiter.promptShown
              ? { type: 'rejected', error: 'tempo esgotado esperando "Permitir"' }
              : { type: 'error', error: 'a TV não respondeu ao pedido de pareamento' }
          );
        }, ms);
      };

      this.registerWaiter = { id, socket, promptShown: false, arm, finish };
      arm(8000);

      const savedKey = this.currentDevice?.clientKey?.trim();
      const payload: Record<string, any> = {
        forcePairing: false,
        pairingType: 'PROMPT',
        manifest: kind === 'signed' ? SIGNED_MANIFEST : UNSIGNED_MANIFEST,
      };
      if (savedKey) payload['client-key'] = savedKey;

      this.logRaw('outgoing', 'register', { id, manifest: kind, 'client-key': savedKey ? '***' : '(nenhuma)' });
      socket.send(JSON.stringify({ type: 'register', id, payload }));
    });
  }

  /** Um socket fechou: durante o pareamento conta como falha; depois, reconecta */
  private handleSocketClose(attempt: number, socket: TvSocket, reason: string) {
    if (attempt !== this.connectAttempt) return;
    if (this.registerWaiter?.socket === socket) {
      this.registerWaiter.finish({ type: 'error', error: `a TV fechou a conexão (${reason})` });
      return;
    }
    if (this.ws !== socket) return;
    this.handleMainClose(reason);
  }

  /** Socket principal caiu (TV desligou, Wi-Fi caiu, app foi para segundo plano...) */
  private handleMainClose(reason: string) {
    this.ws = null;
    this.closePointerSocket();
    this.rejectAllPending('Conexão com a TV encerrada');
    this.logRaw('system', 'error', { message: reason }, undefined, 'error');
    if (!this.isIntentionalDisconnect) {
      this.setStatus('disconnected', 'Conexão com a TV encerrada. Reconectando...');
      this.scheduleReconnect();
    }
  }

  private closeSockets() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.closePointerSocket();
    this.rejectAllPending('Conexão reiniciada');
    this.registerWaiter?.finish({ type: 'error', error: 'cancelado' });
    this.registerWaiter = null;
    this.volumeSubId = null;
    this.appSubId = null;
  }

  private closePointerSocket() {
    if (this.pointerWs) {
      this.pointerWs.close();
      this.pointerWs = null;
    }
    this.pointerOpening = null;
  }

  private rejectAllPending(message: string) {
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error(message));
    });
    this.pendingRequests.clear();
  }

  public disconnect() {
    this.isIntentionalDisconnect = true;
    this.connectAttempt++;
    this.clearReconnectTimer();
    this.closeSockets();
    this.setStatus('disconnected', 'Desconectado');
  }

  /** Reconecta se a conexão não estiver ativa (ex.: app voltou do segundo plano) */
  public reconnectIfNeeded() {
    if (!this.currentDevice || this.isIntentionalDisconnect) return;
    if (this.status === 'connecting' || this.status === 'prompt_showing') return;
    if (!this.isConnected()) {
      this.reconnectDelayMs = 3000;
      this.connect(this.currentDevice);
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /** Nova tentativa com espera crescente (3 s até 20 s) */
  private scheduleReconnect() {
    if (this.isIntentionalDisconnect || !this.currentDevice) return;
    this.clearReconnectTimer();
    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 20000);
    this.reconnectTimer = setTimeout(() => {
      if (this.currentDevice && !this.isIntentionalDisconnect) {
        this.connect(this.currentDevice);
      }
    }, delay);
  }

  // ---------- Mensagens ----------

  /** Trata as mensagens SSAP recebidas da TV */
  private handleMessage(raw: string) {
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error('Pacote SSAP inválido:', raw);
      return;
    }

    this.logRaw('incoming', data.type === 'registered' ? 'registered' : data.type === 'error' ? 'error' : 'response', data, data.uri, data.type === 'error' ? 'error' : 'ok');

    // ----- Respostas do pareamento -----
    const waiter = this.registerWaiter;
    if (waiter && data.id === waiter.id) {
      if (data.type === 'response' && data.payload?.pairingType === 'PROMPT') {
        // A TV mostrou o aviso: espera até 2 minutos pelo "Permitir"
        waiter.promptShown = true;
        waiter.arm(120000);
        this.setStatus('prompt_showing', 'Olhe para a TV e escolha "Permitir"');
        return;
      }
      if (data.type === 'registered') {
        waiter.finish({ type: 'registered', clientKey: data.payload?.['client-key'] });
        return;
      }
      if (data.type === 'error') {
        const error = String(data.error || 'erro desconhecido');
        waiter.finish(waiter.promptShown ? { type: 'rejected', error } : { type: 'error', error });
        return;
      }
    }

    // ----- Assinatura de volume -----
    if (data.id && data.id === this.volumeSubId && data.payload) {
      const p = data.payload;
      const status = p.volumeStatus || {};
      const volume = typeof p.volume === 'number' ? p.volume : status.volume;
      const muted = typeof p.muted === 'boolean' ? p.muted : typeof p.mute === 'boolean' ? p.mute : status.muteStatus;
      if (typeof volume === 'number') {
        this.volumeListeners.forEach((l) => l({ volume, muted: !!muted }));
      }
    }

    // ----- Assinatura do app em primeiro plano -----
    if (data.id && data.id === this.appSubId && data.payload) {
      const appId = data.payload.appId || null;
      this.appListeners.forEach((l) => l(appId));
    }

    // ----- Respostas de requisições com Promise -----
    if (data.id && this.pendingRequests.has(data.id)) {
      const pending = this.pendingRequests.get(data.id)!;
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(data.id);
      if (data.type === 'error' || data.error || data.payload?.returnValue === false) {
        pending.reject(new Error(data.error || data.payload?.errorText || 'A TV recusou o comando'));
      } else {
        pending.resolve(data.payload);
      }
    }
  }

  /** Pareamento concluído: salva a chave e inicia as assinaturas */
  private handleRegistered(clientKey?: string) {
    this.reconnectDelayMs = 3000;
    const device = this.currentDevice;
    const isNewKey = !!clientKey && clientKey !== device?.clientKey;

    if (device && clientKey) {
      device.clientKey = clientKey;
      this.clientKeyListeners.forEach((l) => l({ deviceId: device.id, clientKey }));
    }

    this.setStatus('connected', `Conectado a ${device?.name || 'TV LG'}`);

    if (isNewKey) {
      this.sendRequest(SSAP_ENDPOINTS.CREATE_TOAST, { message: 'Controle remoto conectado' }).catch(() => {});
    }

    this.ensurePointerSocket();
    this.volumeSubId = this.subscribe(SSAP_ENDPOINTS.GET_VOLUME);
    this.appSubId = this.subscribe(SSAP_ENDPOINTS.GET_FOREGROUND_APP);
    this.fetchInputs();
    this.fetchLaunchPoints();
    this.fetchDeviceInfo();
  }

  /** Lê modelo, versão do webOS e MACs da TV (o MAC é usado para ligar via Wake-on-LAN) */
  private async fetchDeviceInfo() {
    const device = this.currentDevice;
    if (!device) return;
    const info: TVDeviceInfo = { deviceId: device.id, port: device.port, pairingManifest: device.pairingManifest };
    const macs: string[] = [];

    try {
      const sys = await this.sendRequest(SSAP_ENDPOINTS.GET_SYSTEM_INFO);
      if (sys?.modelName) info.modelName = String(sys.modelName);
    } catch {}

    try {
      const sw = await this.sendRequest(SSAP_ENDPOINTS.GET_SW_INFO);
      if (sw?.product_name) {
        info.webosVersion = [sw.product_name, sw.major_ver && `${sw.major_ver}.${sw.minor_ver ?? 0}`].filter(Boolean).join(' ');
      }
      const mac = normalizeMac(sw?.device_id);
      if (mac) macs.push(mac);
    } catch {}

    try {
      const net = await this.sendRequest(SSAP_ENDPOINTS.GET_NETWORK_INFO);
      for (const mac of [net?.wifiInfo?.macAddress, net?.wiredInfo?.macAddress].map(normalizeMac)) {
        if (mac && !macs.includes(mac)) macs.push(mac);
      }
    } catch {}

    if (macs.length > 0) info.macs = macs;
    if (this.currentDevice?.id !== info.deviceId) return;
    this.deviceInfoListeners.forEach((l) => l(info));
  }

  // ---------- Socket de botões (setas, OK, voltar, números, touchpad) ----------

  /** Abre (uma única vez) o socket de botões pedido via getPointerInputSocket */
  private ensurePointerSocket(): Promise<TvSocket | null> {
    if (this.pointerWs?.isOpen()) return Promise.resolve(this.pointerWs);
    if (this.pointerOpening) return this.pointerOpening;

    const attempt = this.connectAttempt;
    this.pointerOpening = (async () => {
      try {
        const res = await this.sendRequest(SSAP_ENDPOINTS.GET_INPUT_SOCKET);
        const socketPath: string | undefined = res?.socketPath;
        if (!socketPath) throw new Error('A TV não retornou o socketPath');

        const socket = await openTvSocket(socketPath, {
          onClose: () => {
            if (this.pointerWs === socket) this.pointerWs = null;
          },
        });
        if (attempt !== this.connectAttempt) {
          socket.close();
          return null;
        }
        this.pointerWs = socket;
        this.logRaw('incoming', 'response', { status: 'Socket de botões pronto' }, socketPath);
        return socket;
      } catch (err: any) {
        this.logRaw('system', 'error', { message: `Socket de botões: ${err?.message || err}` }, SSAP_ENDPOINTS.GET_INPUT_SOCKET, 'error');
        return null;
      } finally {
        this.pointerOpening = null;
      }
    })();
    return this.pointerOpening;
  }

  /** Envia uma mensagem pelo socket de botões, abrindo-o se preciso */
  private sendPointer(message: string, log?: { uri: string; payload: any }) {
    if (!this.isConnected()) return false;
    const deliver = (socket: TvSocket | null) => {
      if (!socket) return;
      socket.send(message);
      if (log) this.logRaw('outgoing', 'request', log.payload, log.uri);
    };
    if (this.pointerWs?.isOpen()) {
      deliver(this.pointerWs);
    } else {
      this.ensurePointerSocket().then(deliver);
    }
    return true;
  }

  /** Botão físico: UP, DOWN, LEFT, RIGHT, ENTER, BACK, HOME, MENU, INFO, RED, GREEN, 0-9... */
  sendButton(buttonName: string): boolean {
    return this.sendPointer(`type:button\nname:${buttonName}\n\n`, { uri: 'pointer/button', payload: { button: buttonName } });
  }

  /** Movimento do touchpad (acumula frações para não perder movimentos pequenos) */
  sendPointerMove(dx: number, dy: number): void {
    const totalX = dx + this.pointerRemainder.x;
    const totalY = dy + this.pointerRemainder.y;
    const moveX = Math.trunc(totalX);
    const moveY = Math.trunc(totalY);
    this.pointerRemainder = { x: totalX - moveX, y: totalY - moveY };
    if (moveX === 0 && moveY === 0) return;
    this.sendPointer(`type:move\ndx:${moveX}\ndy:${moveY}\ndown:0\n\n`);
  }

  sendPointerClick(): void {
    this.sendPointer(`type:click\n\n`, { uri: 'pointer/click', payload: { action: 'click' } });
  }

  sendPointerScroll(dy: number): void {
    this.sendPointer(`type:scroll\ndx:0\ndy:${Math.round(dy)}\n\n`);
  }

  // ---------- Requisições SSAP ----------

  /** Requisição SSAP com resposta (Promise) */
  sendRequest(uri: string, payload: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws?.isOpen()) {
        reject(new Error('TV não está conectada'));
        return;
      }

      const id = `req_${++this.reqCounter}`;
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Tempo esgotado: ${uri}`));
        }
      }, 7000);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      this.logRaw('outgoing', 'request', payload, uri);
      this.ws.send(JSON.stringify({ type: 'request', id, uri, payload }));
    });
  }

  /** Assinatura SSAP (a TV envia atualizações com o mesmo id) */
  private subscribe(uri: string): string | null {
    if (!this.ws?.isOpen()) return null;
    const id = `sub_${++this.reqCounter}`;
    this.ws.send(JSON.stringify({ type: 'subscribe', id, uri }));
    return id;
  }

  /** Lista real das entradas (HDMI, Antena, AV...) */
  async fetchInputs(): Promise<InputSource[]> {
    try {
      const res = await this.sendRequest(SSAP_ENDPOINTS.GET_INPUT_LIST);
      if (Array.isArray(res?.devices)) {
        const mapped: InputSource[] = res.devices.map((d: any) => {
          const id = String(d.id || '');
          const lower = id.toLowerCase();
          const type: InputSource['type'] = lower.includes('hdmi') ? 'hdmi' : lower.includes('av') || lower.includes('comp') ? 'av' : lower.includes('usb') ? 'usb' : 'antenna';
          return {
            id,
            label: d.label || id,
            type,
            connectedDevice: d.connected ? (d.subType || 'Dispositivo conectado') : 'Nada conectado',
            icon: type === 'hdmi' ? 'Tv' : 'Radio',
          };
        });
        this.inputsListeners.forEach((l) => l(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn('Não foi possível obter a lista de entradas:', e);
    }
    return [];
  }

  /** Apps instalados na TV (launch points) */
  async fetchLaunchPoints(): Promise<TVLaunchPoint[]> {
    try {
      const res = await this.sendRequest(SSAP_ENDPOINTS.LIST_LAUNCH_POINTS);
      if (Array.isArray(res?.launchPoints)) {
        this.launchPoints = res.launchPoints
          .filter((lp: any) => lp?.id)
          .map((lp: any) => ({ id: String(lp.id), title: String(lp.title || lp.id) }));
        this.launchPointListeners.forEach((l) => l(this.launchPoints));
      }
    } catch (e) {
      console.warn('Não foi possível obter os apps instalados:', e);
    }
    return this.launchPoints;
  }

  /** Compatibilidade com código antigo */
  async fetchInstalledApps(): Promise<TVLaunchPoint[]> {
    return this.fetchLaunchPoints();
  }

  /**
   * O id de um app muda por região/modelo (ex.: Prime Video, Max, Globoplay).
   * Se o id conhecido não estiver instalado, procura pelo nome na lista da TV.
   */
  resolveAppId(appId: string, appName?: string): string {
    if (this.launchPoints.length === 0) return appId;
    if (this.launchPoints.some((lp) => lp.id === appId)) return appId;

    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
    const wanted = [appName, appId].filter(Boolean).map((s) => normalize(s!));
    const match = this.launchPoints.find((lp) => {
      const title = normalize(lp.title);
      const id = normalize(lp.id);
      return wanted.some((w) => w.length >= 3 && (title.includes(w) || w.includes(title) || id.includes(w)));
    });
    return match?.id || appId;
  }

  /** Abre um app na TV */
  async launchApp(appId: string, appName?: string): Promise<any> {
    return this.sendRequest(SSAP_ENDPOINTS.LAUNCH, { id: this.resolveAppId(appId, appName) });
  }

  // ---------- Ligar a TV ----------

  /**
   * Envia o Wake-on-LAN e tenta reconectar em seguida.
   * No iOS sem entitlement de multicast só o envio direto ao IP da TV é garantido.
   */
  async wake(device: TVDevice): Promise<{ supported: boolean; sent: number; message: string }> {
    const result = await WakeOnLanService.wake(device);
    this.logRaw('system', 'wol', result, `udp://${device.ip}:9`, result.sent > 0 ? 'ok' : 'error');

    // Dá tempo para a TV iniciar a rede e tenta conectar
    this.currentDevice = { ...device };
    this.isIntentionalDisconnect = false;
    this.reconnectDelayMs = 3000;
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => this.connect(device), 2500);
    return result;
  }
}

export const tvConnection = TVConnection.getInstance();
