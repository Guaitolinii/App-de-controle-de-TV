import { ConnectionStatus, InputSource, SSAPMessage, TVDevice } from '../types/tv';
import { SSAP_ENDPOINTS, SSAP_PERMISSIONS } from './ssap';

type EventListener<T> = (data: T) => void;

export class TVConnection {
  private static instance: TVConnection;
  private ws: WebSocket | null = null;
  private pointerWs: WebSocket | null = null;
  private currentDevice: TVDevice | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reqCounter = 0;
  private pendingRequests = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void; timeout: ReturnType<typeof setTimeout> }>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionalDisconnect = false;
  private fallbackAttempted = false;

  // Event Subscriptions
  private statusListeners = new Set<EventListener<{ status: ConnectionStatus; message?: string }>>();
  private clientKeyListeners = new Set<EventListener<string>>();
  private volumeListeners = new Set<EventListener<{ volume: number; muted: boolean }>>();
  private appListeners = new Set<EventListener<string | null>>();
  private inputsListeners = new Set<EventListener<InputSource[]>>();
  private rawLogListeners = new Set<EventListener<SSAPMessage>>();

  private constructor() {}

  static getInstance(): TVConnection {
    if (!TVConnection.instance) {
      TVConnection.instance = new TVConnection();
    }
    return TVConnection.instance;
  }

  // Event Subscription Helpers
  onStatusChange(listener: EventListener<{ status: ConnectionStatus; message?: string }>) {
    this.statusListeners.add(listener);
    listener({ status: this.status });
    return () => this.statusListeners.delete(listener);
  }

  onClientKey(listener: EventListener<string>) {
    this.clientKeyListeners.add(listener);
    return () => this.clientKeyListeners.delete(listener);
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

  onRawLog(listener: EventListener<SSAPMessage>) {
    this.rawLogListeners.add(listener);
    return () => this.rawLogListeners.delete(listener);
  }

  private setStatus(status: ConnectionStatus, message?: string) {
    this.status = status;
    this.statusListeners.forEach((l) => l({ status, message }));
  }

  private logRaw(direction: 'outgoing' | 'incoming' | 'system', type: any, payload: any, uri?: string, latencyMs?: number) {
    const log: SSAPMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      direction,
      type,
      uri,
      payload,
      status: 'ok',
      latencyMs,
    };
    this.rawLogListeners.forEach((l) => l(log));
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getCurrentDevice(): TVDevice | null {
    return this.currentDevice;
  }

  /**
   * Conecta à TV LG via WebSocket:
   * Tenta porta 3001 (WSS - webOS 2022 em diante)
   * Se recusada por certificado ou TV antiga, tenta porta 3000 (WS)
   */
  async connect(device: TVDevice): Promise<void> {
    this.currentDevice = device;
    this.isIntentionalDisconnect = false;
    this.fallbackAttempted = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.closeSockets();

    const cleanIp = device.ip.trim();
    if (!cleanIp) {
      this.setStatus('error', 'Endereço IP não informado');
      return;
    }

    const port = device.port || 3001;
    const protocol = port === 3001 ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${cleanIp}:${port}`;

    this.setStatus('connecting', `Conectando a ${wsUrl}...`);
    this.logRaw('system', 'request', { url: wsUrl }, wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.logRaw('incoming', 'response', { status: 'Socket aberto com sucesso' }, wsUrl);
        this.sendHandshakeRegister();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (err) => {
        console.warn('Erro no WebSocket da TV:', err);
        // Fallback automático de porta 3001 (WSS) para 3000 (WS) para TVs anteriores a 2022
        if (port === 3001 && !this.fallbackAttempted) {
          this.fallbackAttempted = true;
          this.logRaw('system', 'error', { 
            message: 'Porta 3001 (WSS) falhou. Tentando porta 3000 (WS legado)...' 
          });
          this.connect({ ...device, port: 3000 });
          return;
        }
        this.setStatus('error', 'Falha ao conectar. Verifique IP e se a TV está ligada na mesma rede.');
      };

      this.ws.onclose = (event) => {
        this.closePointerSocket();
        if (!this.isIntentionalDisconnect) {
          this.setStatus('disconnected', 'Conexão encerrada');
          this.scheduleReconnect();
        }
      };
    } catch (e: any) {
      this.setStatus('error', e.message || 'Erro ao inicializar WebSocket');
    }
  }

  private closeSockets() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.closePointerSocket();
  }

  private closePointerSocket() {
    if (this.pointerWs) {
      this.pointerWs.onclose = null;
      this.pointerWs.onerror = null;
      this.pointerWs.close();
      this.pointerWs = null;
    }
  }

  public disconnect() {
    this.isIntentionalDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.closeSockets();
    this.setStatus('disconnected', 'Desconectado manualmente');
  }

  private scheduleReconnect() {
    if (this.isIntentionalDisconnect || !this.currentDevice) return;
    this.reconnectTimer = setTimeout(() => {
      if (this.currentDevice && !this.isIntentionalDisconnect) {
        this.connect(this.currentDevice);
      }
    }, 4000);
  }

  /**
   * Envia o pedido oficial de registro/pareamento SSAP.
   * Se já possuir client-key, a conexão é aceita imediatamente.
   * Se não possuir, a TV exibirá na tela o aviso "Permitir?".
   */
  private sendHandshakeRegister() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const savedKey = this.currentDevice?.clientKey?.trim();
    const registerId = `register_${++this.reqCounter}`;

    const payload = {
      type: 'register',
      id: registerId,
      payload: {
        forcePairing: false,
        pairingType: 'PROMPT',
        'client-key': savedKey || undefined,
        manifest: {
          appVersion: '1.0.0',
          manifestVersion: 1,
          permissions: SSAP_PERMISSIONS,
          signatures: [
            {
              signatureVersion: 1,
              signature: 'eyJhbGdvcm...',
            },
          ],
        },
      },
    };

    this.logRaw('outgoing', 'register', payload);
    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Trata as respostas SSAP vindas da TV
   */
  private handleMessage(raw: string) {
    try {
      const data = JSON.parse(raw);
      this.logRaw('incoming', data.type || 'response', data, data.uri);

      // Tratamento de Pareamento
      if (data.type === 'response' && data.payload?.pairingType === 'PROMPT') {
        this.setStatus('prompt_showing', 'Confirme "Permitir" na tela da sua TV LG!');
      }

      if (data.type === 'registered') {
        const returnedKey = data.payload?.['client-key'];
        if (returnedKey) {
          if (this.currentDevice) {
            this.currentDevice.clientKey = returnedKey;
          }
          this.clientKeyListeners.forEach((l) => l(returnedKey));
        }

        this.setStatus('connected', 'Conectado à TV LG webOS');

        // Inicializar assinaturas em tempo real e socket de botões
        this.setupPointerSocket();
        this.subscribeVolume();
        this.subscribeForegroundApp();
        this.fetchInputs();
      }

      // Trata respostas com ID correlacionado a Promises pendentes
      if (data.id && this.pendingRequests.has(data.id)) {
        const pending = this.pendingRequests.get(data.id)!;
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(data.id);
        if (data.error) {
          pending.reject(new Error(data.error));
        } else {
          pending.resolve(data.payload);
        }
      }

      // Trata atualizações de volume emitidas pela TV
      if (data.uri === 'ssap://audio/getVolume' || data.payload?.volume !== undefined) {
        const vol = typeof data.payload?.volume === 'number' ? data.payload.volume : 0;
        const muted = !!data.payload?.muted;
        this.volumeListeners.forEach((l) => l({ volume: vol, muted }));
      }

      // Trata atualizações do app em primeiro plano
      if (data.uri === 'ssap://com.webos.applicationManager/getForegroundAppInfo' || data.payload?.appId) {
        const appId = data.payload?.appId || null;
        this.appListeners.forEach((l) => l(appId));
      }
    } catch (e) {
      console.error('Erro ao interpretar pacote SSAP:', e, raw);
    }
  }

  /**
   * Canal Secundário: getPointerInputSocket
   * Obrigatório para navegação: Setas, OK, Voltar, Home, Números, Cores e Touchpad
   */
  private async setupPointerSocket() {
    try {
      const res = await this.sendRequest(SSAP_ENDPOINTS.GET_INPUT_SOCKET);
      const socketPath = res?.socketPath;
      if (!socketPath) {
        console.warn('TV não retornou socketPath para botões.');
        return;
      }

      this.closePointerSocket();
      this.pointerWs = new WebSocket(socketPath);

      this.pointerWs.onopen = () => {
        this.logRaw('incoming', 'response', { status: 'Socket de botões e touchpad pronto' }, socketPath);
      };

      this.pointerWs.onerror = (e) => {
        console.warn('Erro no socket de botões:', e);
      };
    } catch (err) {
      console.warn('Não foi possível obter pointer input socket:', err);
    }
  }

  /**
   * Envia comando de botão via socket de entrada da TV
   * Ex: UP, DOWN, LEFT, RIGHT, ENTER, BACK, HOME, MENU, RED, GREEN, YELLOW, BLUE, 0-9
   */
  sendButton(buttonName: string): boolean {
    if (!this.pointerWs || this.pointerWs.readyState !== WebSocket.OPEN) {
      // Fallback para envio padrão se pointer ainda não estiver aberto
      this.sendRequest(`ssap://com.webos.service.networkinput/sendButton`, { name: buttonName }).catch(() => {});
      return false;
    }

    const payload = `type:button\nname:${buttonName}\n\n`;
    this.pointerWs.send(payload);
    this.logRaw('outgoing', 'request', { button: buttonName }, 'pointer.input/button');
    return true;
  }

  /**
   * Envia movimento do touchpad (mouse da TV)
   */
  sendPointerMove(dx: number, dy: number): void {
    if (!this.pointerWs || this.pointerWs.readyState !== WebSocket.OPEN) return;
    const payload = `type:move\ndx:${Math.round(dx)}\ndy:${Math.round(dy)}\ndown:0\n\n`;
    this.pointerWs.send(payload);
  }

  /**
   * Envia clique do mouse na TV
   */
  sendPointerClick(): void {
    if (!this.pointerWs || this.pointerWs.readyState !== WebSocket.OPEN) return;
    const payload = `type:click\n\n`;
    this.pointerWs.send(payload);
    this.logRaw('outgoing', 'request', { action: 'click' }, 'pointer.input/click');
  }

  /**
   * Envia rolagem vertical (Scroll Wheel)
   */
  sendPointerScroll(dy: number): void {
    if (!this.pointerWs || this.pointerWs.readyState !== WebSocket.OPEN) return;
    const payload = `type:scroll\ndx:0\ndy:${Math.round(dy)}\n\n`;
    this.pointerWs.send(payload);
  }

  /**
   * Envia requisição genérica SSAP com resposta esperada (Promise)
   */
  sendRequest(uri: string, payload: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('TV não está conectada via WebSocket'));
        return;
      }

      const id = `req_${++this.reqCounter}`;
      const message = {
        type: 'request',
        id,
        uri,
        payload,
      };

      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Tempo esgotado para o comando: ${uri}`));
        }
      }, 7000);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      this.logRaw('outgoing', 'request', payload, uri);
      this.ws.send(JSON.stringify(message));
    });
  }

  /**
   * Assina atualizações em tempo real de Volume
   */
  private subscribeVolume() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const subMsg = {
      type: 'subscribe',
      id: `sub_vol_${++this.reqCounter}`,
      uri: SSAP_ENDPOINTS.GET_VOLUME,
    };
    this.ws.send(JSON.stringify(subMsg));
  }

  /**
   * Assina aplicativo ativo na TV
   */
  private subscribeForegroundApp() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const subMsg = {
      type: 'subscribe',
      id: `sub_app_${++this.reqCounter}`,
      uri: SSAP_ENDPOINTS.GET_FOREGROUND_APP,
    };
    this.ws.send(JSON.stringify(subMsg));
  }

  /**
   * Consulta a lista real de entradas físicas (HDMI 1, 2, 3, Antena)
   */
  async fetchInputs(): Promise<InputSource[]> {
    try {
      const res = await this.sendRequest(SSAP_ENDPOINTS.GET_INPUT_LIST);
      if (res?.devices && Array.isArray(res.devices)) {
        const mapped: InputSource[] = res.devices.map((d: any) => ({
          id: d.id,
          label: d.label || d.id,
          type: d.id.toLowerCase().includes('hdmi') ? 'hdmi' : d.id.toLowerCase().includes('av') ? 'av' : 'antenna',
          connectedDevice: d.connected ? (d.subType || 'Dispositivo conectado') : 'Desconectado',
          icon: d.id.toLowerCase().includes('hdmi') ? 'Tv' : 'Radio',
        }));
        this.inputsListeners.forEach((l) => l(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn('Não foi possível obter lista de entradas da TV:', e);
    }
    return [];
  }

  /**
   * Consulta aplicativos instalados na TV
   */
  async fetchInstalledApps(): Promise<any[]> {
    try {
      const res = await this.sendRequest(SSAP_ENDPOINTS.LIST_APPS);
      return res?.apps || [];
    } catch (e) {
      console.warn('Não foi possível obter apps instalados:', e);
      return [];
    }
  }
}

export const tvConnection = TVConnection.getInstance();
