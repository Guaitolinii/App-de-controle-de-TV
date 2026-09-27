/**
 * Busca de TVs LG na rede Wi-Fi.
 * - App nativo: descobre a faixa do Wi-Fi do celular, testa as portas 3001/3000 de cada IP por TCP
 *   (sem multicast, então funciona no iOS sem entitlement) e confirma abrindo o WebSocket da TV.
 * - Navegador: testa por WebSocket numa faixa informada (limitado; útil só em desenvolvimento).
 */
import { LgTvBridge, isNativeBridgeAvailable } from './nativeBridge';
import { hostsToScan, isPrivateIp } from './network';
import { openTvSocket } from './tvSocket';

export interface DiscoveredTV {
  ip: string;
  port: number;
  responseTimeMs: number;
}

export interface ScanResult {
  found: DiscoveredTV[];
  /** Faixa escaneada, ex.: 192.168.1.x */
  subnetLabel: string;
}

type ProgressFn = (scanned: number, total: number, found: DiscoveredTV[]) => void;

/** Executa tarefas com limite de concorrência */
async function runPool<T>(items: T[], concurrency: number, task: (item: T) => Promise<void>) {
  let index = 0;
  const worker = async () => {
    while (index < items.length) {
      const item = items[index++];
      await task(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

export class WifiDiscoveryService {
  /** O app nativo consegue descobrir a faixa do Wi-Fi sozinho */
  static canAutoDetectSubnet(): boolean {
    return isNativeBridgeAvailable();
  }

  /** IP e máscara do Wi-Fi do celular (somente app nativo) */
  static async getLocalNetwork(): Promise<{ ip: string; netmask: string } | null> {
    if (!isNativeBridgeAvailable()) return null;
    try {
      const info = await LgTvBridge.getNetworkInfo();
      if (info.ip && isPrivateIp(info.ip)) {
        return { ip: info.ip, netmask: info.netmask || '255.255.255.0' };
      }
    } catch (e) {
      console.warn('Não foi possível ler a rede local:', e);
    }
    return null;
  }

  /**
   * Faz uma conexão rápida ao roteador para o iOS exibir, logo de início, o pedido
   * "Permitir acesso à rede local". Sem essa permissão a busca não encontra nada.
   */
  static async requestLocalNetworkPermission(): Promise<void> {
    const net = await this.getLocalNetwork();
    if (!net) return;
    const gateway = net.ip.split('.').slice(0, 3).join('.') + '.1';
    try {
      await LgTvBridge.probePort({ host: gateway, port: 80, timeoutMs: 400 });
    } catch {}
  }

  /** Busca TVs na rede. subnetBase (ex.: "192.168.1") só é usado no navegador. */
  static async scan(subnetBase: string, onProgress?: ProgressFn): Promise<ScanResult> {
    if (isNativeBridgeAvailable()) {
      return this.scanNative(onProgress);
    }
    const found = await this.scanSubnetBrowser(subnetBase, onProgress);
    return { found, subnetLabel: `${subnetBase}.x` };
  }

  // ---------- App nativo ----------

  private static async scanNative(onProgress?: ProgressFn): Promise<ScanResult> {
    const net = await this.getLocalNetwork();
    if (!net) {
      return { found: [], subnetLabel: 'Wi-Fi não detectado' };
    }

    const hosts = hostsToScan(net.ip, net.netmask);
    const total = hosts.length;
    let scanned = 0;
    const found: DiscoveredTV[] = [];
    const candidates: { ip: string; ports: number[] }[] = [];

    // 1) Sondagem TCP rápida das portas webOS
    await runPool(hosts, 40, async (ip) => {
      const [p3001, p3000] = await Promise.all(
        [3001, 3000].map((port) =>
          LgTvBridge.probePort({ host: ip, port, timeoutMs: 700 }).then((r) => r.open).catch(() => false)
        )
      );
      const ports = [p3001 && 3001, p3000 && 3000].filter((p): p is number => !!p);
      if (ports.length > 0) candidates.push({ ip, ports });
      scanned++;
      onProgress?.(scanned, total, [...found]);
    });

    // 2) Confirma que é uma TV webOS abrindo o WebSocket (não mostra nada na TV)
    await runPool(candidates, 6, async ({ ip, ports }) => {
      for (const port of ports) {
        const started = Date.now();
        try {
          const socket = await openTvSocket(port === 3001 ? `wss://${ip}:3001` : `ws://${ip}:3000`, {}, 3000);
          socket.close();
          found.push({ ip, port, responseTimeMs: Date.now() - started });
          onProgress?.(scanned, total, [...found]);
          return;
        } catch {}
      }
    });

    found.sort((a, b) => a.ip.localeCompare(b.ip, undefined, { numeric: true }));
    const prefix = net.ip.split('.').slice(0, 3).join('.');
    return { found, subnetLabel: `${prefix}.x` };
  }

  // ---------- Navegador (desenvolvimento) ----------

  /** Testa um IP por WebSocket com tempo curto */
  static async probeIp(ip: string, port: number = 3001, timeoutMs: number = 1200): Promise<DiscoveredTV | null> {
    const started = Date.now();
    try {
      const socket = await openTvSocket(port === 3001 ? `wss://${ip}:3001` : `ws://${ip}:3000`, {}, timeoutMs);
      socket.close();
      return { ip, port, responseTimeMs: Date.now() - started };
    } catch {
      return null;
    }
  }

  static async scanSubnetBrowser(baseSubnet: string, onProgress?: ProgressFn): Promise<DiscoveredTV[]> {
    const found: DiscoveredTV[] = [];
    const ips = Array.from({ length: 254 }, (_, i) => `${baseSubnet}.${i + 1}`);
    let scanned = 0;

    await runPool(ips, 16, async (ip) => {
      const result = (await this.probeIp(ip, 3001, 1000)) || (await this.probeIp(ip, 3000, 1000));
      scanned++;
      if (result) found.push(result);
      onProgress?.(scanned, ips.length, [...found]);
    });

    return found;
  }
}
