// Wake-on-LAN (WoL) Magic Packet Generator and Validator
// Follows IEEE 802.3 Wake-on-LAN specification
import { TVDevice } from '../types/tv';
import { LgTvBridge, isNativeBridgeAvailable } from './nativeBridge';
import { subnetBroadcast } from './network';

export interface WolResult {
  supported: boolean;
  sent: number;
  message: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface WolPacketInfo {
  macAddress: string;
  normalizedMac: string;
  isValidMac: boolean;
  packetLength: number;
  hexDump: string;
  broadcastAddress: string;
  port: number;
}

export class WakeOnLanService {
  /**
   * Validates a MAC address string
   */
  static isValidMac(mac: string): boolean {
    const clean = mac.replace(/[:-]/g, '').trim();
    return clean.length === 12 && /^[0-9A-Fa-f]{12}$/.test(clean);
  }

  /**
   * Normalizes MAC address to standard AA:BB:CC:DD:EE:FF format
   */
  static formatMac(mac: string): string {
    const clean = mac.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
    if (clean.length !== 12) return mac;
    return clean.match(/.{1,2}/g)?.join(':') || mac;
  }

  /**
   * Builds the 102-byte Magic Packet:
   * 6 bytes of 0xFF followed by 16 repetitions of the 6-byte MAC address
   */
  static createMagicPacket(macAddress: string): Uint8Array {
    const cleanMac = macAddress.replace(/[^0-9A-Fa-f]/g, '');
    if (cleanMac.length !== 12) {
      throw new Error('MAC address inválido. Deve conter 12 dígitos hexadecimais.');
    }

    const macBytes = new Uint8Array(6);
    for (let i = 0; i < 6; i++) {
      macBytes[i] = parseInt(cleanMac.substring(i * 2, i * 2 + 2), 16);
    }

    const packet = new Uint8Array(102);
    // 6 sync bytes 0xFF
    for (let i = 0; i < 6; i++) {
      packet[i] = 0xff;
    }
    // 16 copies of MAC address
    for (let i = 0; i < 16; i++) {
      packet.set(macBytes, 6 + i * 6);
    }

    return packet;
  }

  /**
   * Generates packet inspection data for developers/users
   */
  static inspectPacket(macAddress: string): WolPacketInfo {
    const valid = this.isValidMac(macAddress);
    const normalized = this.formatMac(macAddress);

    let hexDump = '';
    let packetLength = 0;

    if (valid) {
      const packet = this.createMagicPacket(macAddress);
      packetLength = packet.length;
      hexDump = Array.from(packet)
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
    }

    return {
      macAddress,
      normalizedMac: normalized,
      isValidMac: valid,
      packetLength,
      hexDump,
      broadcastAddress: '255.255.255.255',
      port: 9,
    };
  }

  /** Converte o pacote em base64 para passar ao plugin nativo */
  static toBase64(packet: Uint8Array): string {
    let binary = '';
    packet.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  /**
   * Envia o Magic Packet para ligar a TV (somente no app nativo; o navegador não envia UDP).
   * Destinos: IP da TV (unicast, funciona no iOS sem entitlement), broadcast da sub-rede e
   * 255.255.255.255 (estes dois o iOS pode bloquear). Portas 9 e 7, três rodadas.
   */
  static async wake(device: Pick<TVDevice, 'ip' | 'mac' | 'macs'>): Promise<WolResult> {
    const macs = Array.from(
      new Set([...(device.macs || []), device.mac].filter((m): m is string => !!m && this.isValidMac(m)).map((m) => this.formatMac(m)))
    );

    if (macs.length === 0) {
      return {
        supported: true,
        sent: 0,
        message: 'MAC da TV ainda desconhecido. Conecte com a TV ligada uma vez para o app aprender o MAC.',
      };
    }

    if (!isNativeBridgeAvailable()) {
      return {
        supported: false,
        sent: 0,
        message: 'Ligar pela rede só funciona no app instalado (o navegador não envia pacotes UDP).',
      };
    }

    const targets: { host: string; broadcast: boolean }[] = [{ host: device.ip.trim(), broadcast: false }];
    try {
      const net = await LgTvBridge.getNetworkInfo();
      const broadcast = subnetBroadcast(net.ip, net.netmask);
      if (broadcast) targets.push({ host: broadcast, broadcast: true });
    } catch {}
    targets.push({ host: '255.255.255.255', broadcast: true });

    let sent = 0;
    let unicastSent = 0;
    let lastError = '';

    for (let round = 0; round < 3; round++) {
      for (const mac of macs) {
        const base64 = this.toBase64(this.createMagicPacket(mac));
        for (const target of targets) {
          for (const port of [9, 7]) {
            try {
              const res = await LgTvBridge.sendUdp({ host: target.host, port, base64, broadcast: target.broadcast });
              if (res.sent) {
                sent++;
                if (!target.broadcast) unicastSent++;
              } else if (res.error) {
                lastError = res.error;
              }
            } catch (err: any) {
              lastError = err?.message || String(err);
            }
          }
        }
      }
      await sleep(150);
    }

    if (sent === 0) {
      return { supported: true, sent, message: `Não foi possível enviar o pacote para ligar a TV (${lastError || 'erro desconhecido'}).` };
    }
    return {
      supported: true,
      sent,
      message: unicastSent > 0 ? 'Sinal para ligar enviado. Aguardando a TV responder...' : 'Sinal enviado só por broadcast. Aguardando a TV...',
    };
  }
}
