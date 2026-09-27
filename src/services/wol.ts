// Wake-on-LAN (WoL) Magic Packet Generator and Validator
// Follows IEEE 802.3 Wake-on-LAN specification

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
}
