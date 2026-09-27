import { LgTvBridge, isNativeBridgeAvailable } from './nativeBridge';

/**
 * Socket unificado para falar com a TV:
 * - No app iOS usa o plugin nativo (aceita o certificado autoassinado da porta 3001)
 * - No navegador usa o WebSocket padrão (útil para desenvolvimento com TVs na porta 3000)
 */
export interface TvSocket {
  readonly url: string;
  isOpen(): boolean;
  send(data: string): void;
  close(): void;
}

export interface TvSocketHandlers {
  onMessage?: (data: string) => void;
  onClose?: (reason: string) => void;
}

// ---------- Implementação nativa (plugin LgTvBridge) ----------

// Handlers de cada socket nativo aberto, indexados pelo id
const nativeHandlers = new Map<string, TvSocketHandlers>();
let nativeListenersReady: Promise<void> | null = null;
let nativeCounter = 0;

/** Registra uma única vez os listeners globais do plugin e distribui os eventos por id. */
function ensureNativeListeners(): Promise<void> {
  if (!nativeListenersReady) {
    nativeListenersReady = (async () => {
      await LgTvBridge.addListener('socketMessage', ({ id, data }) => {
        nativeHandlers.get(id)?.onMessage?.(data);
      });
      await LgTvBridge.addListener('socketClosed', ({ id, reason }) => {
        const handlers = nativeHandlers.get(id);
        nativeHandlers.delete(id);
        handlers?.onClose?.(reason || 'Conexão encerrada');
      });
    })();
  }
  return nativeListenersReady;
}

async function openNativeSocket(url: string, handlers: TvSocketHandlers, timeoutMs: number): Promise<TvSocket> {
  await ensureNativeListeners();
  const id = `sock_${Date.now()}_${++nativeCounter}`;
  let open = false;

  nativeHandlers.set(id, {
    onMessage: (data) => handlers.onMessage?.(data),
    onClose: (reason) => {
      open = false;
      handlers.onClose?.(reason);
    },
  });

  try {
    await LgTvBridge.openSocket({ id, url, timeoutMs });
  } catch (err: any) {
    nativeHandlers.delete(id);
    throw new Error(err?.message || `Falha ao abrir ${url}`);
  }
  open = true;

  return {
    url,
    isOpen: () => open,
    send: (data: string) => {
      if (!open) return;
      LgTvBridge.sendSocket({ id, data }).catch((err) => console.warn('Falha ao enviar pelo socket nativo:', err));
    },
    close: () => {
      if (!nativeHandlers.has(id) && !open) return;
      open = false;
      nativeHandlers.delete(id);
      LgTvBridge.closeSocket({ id }).catch(() => {});
    },
  };
}

// ---------- Implementação do navegador ----------

function openBrowserSocket(url: string, handlers: TvSocketHandlers, timeoutMs: number): Promise<TvSocket> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let ws: WebSocket;

    try {
      ws = new WebSocket(url);
    } catch (err: any) {
      reject(new Error(err?.message || `URL inválida: ${url}`));
      return;
    }

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { ws.close(); } catch {}
      reject(new Error(`Tempo esgotado ao conectar em ${url}`));
    }, timeoutMs);

    ws.onopen = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        url,
        isOpen: () => ws.readyState === WebSocket.OPEN,
        send: (data: string) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(data);
        },
        close: () => {
          ws.onclose = null;
          ws.onmessage = null;
          try { ws.close(); } catch {}
        },
      });
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') handlers.onMessage?.(event.data);
    };

    ws.onerror = () => {
      // O motivo real chega no onclose logo em seguida
    };

    ws.onclose = (event) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Conexão recusada em ${url} (código ${event.code})`));
        return;
      }
      handlers.onClose?.(event.reason || `Conexão encerrada (código ${event.code})`);
    };
  });
}

/**
 * Abre um socket com a TV. A Promise só resolve quando a conexão estiver aberta;
 * rejeita se a porta recusar, o certificado falhar ou o tempo esgotar.
 */
export function openTvSocket(url: string, handlers: TvSocketHandlers = {}, timeoutMs = 6000): Promise<TvSocket> {
  return isNativeBridgeAvailable()
    ? openNativeSocket(url, handlers, timeoutMs)
    : openBrowserSocket(url, handlers, timeoutMs);
}
