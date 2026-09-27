/**
 * WiFi Discovery Service for LG Smart TVs
 * Scans candidate local IP addresses on the user's WiFi network via WebSocket probes (ports 3000 & 3001).
 * Works directly in mobile browsers and native apps without requiring iOS multicast permissions.
 */

export interface DiscoveredTV {
  ip: string;
  port: number;
  responseTimeMs: number;
}

export class WifiDiscoveryService {
  /**
   * Probes a specific IP and port via WebSocket with a short timeout.
   */
  static probeIp(ip: string, port: number = 3001, timeoutMs: number = 1200): Promise<DiscoveredTV | null> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const protocol = port === 3001 ? 'wss' : 'ws';
      let settled = false;

      let ws: WebSocket | null = null;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          if (ws) {
            try { ws.close(); } catch {}
          }
          resolve(null);
        }
      }, timeoutMs);

      try {
        ws = new WebSocket(`${protocol}://${ip}:${port}`);

        ws.onopen = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            const responseTimeMs = Date.now() - startTime;
            try { ws?.close(); } catch {}
            resolve({ ip, port, responseTimeMs });
          }
        };

        ws.onerror = (e) => {
          // On SSL self-signed or connection refusal, if it failed immediately with connection reset,
          // it might still indicate a host is there, but for safety we check onclose
        };

        ws.onclose = (e) => {
          // In some browsers, self-signed WSS fails with close code 1006 immediately.
          // If port was 3001 and failed, let's probe port 3000 as fallback
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(null);
          }
        };
      } catch (err) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(null);
        }
      }
    });
  }

  /**
   * Scans a list of candidate IPs in parallel with a concurrency limit.
   */
  static async scanSubnet(
    baseSubnet: string, // e.g. "192.168.1" or "192.168.0"
    onProgress?: (scanned: number, total: number, found: DiscoveredTV[]) => void
  ): Promise<DiscoveredTV[]> {
    const found: DiscoveredTV[] = [];
    const ipsToScan: string[] = [];

    // Most common router DHCP pools assign TVs between .2 and .150
    for (let i = 2; i <= 80; i++) {
      ipsToScan.push(`${baseSubnet}.${i}`);
    }

    const total = ipsToScan.length;
    let scanned = 0;

    // Concurrency pool of 10
    const concurrency = 8;
    let index = 0;

    const worker = async () => {
      while (index < ipsToScan.length) {
        const currentIp = ipsToScan[index++];
        // Test port 3001 first, then 3000
        let result = await this.probeIp(currentIp, 3001, 1000);
        if (!result) {
          result = await this.probeIp(currentIp, 3000, 1000);
        }

        scanned++;
        if (result) {
          found.push(result);
        }
        if (onProgress) {
          onProgress(scanned, total, found);
        }
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    return found;
  }
}
