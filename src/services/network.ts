/**
 * Utilitários de IPv4 usados na busca de TVs e no Wake-on-LAN.
 */

/** Converte "192.168.1.20" em número (ou null se inválido) */
export function ipToInt(ip: string | undefined): number | null {
  if (!ip) return null;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    value = value * 256 + n;
  }
  return value;
}

/** Converte número em "192.168.1.20" */
export function intToIp(value: number): string {
  return [24, 16, 8, 0].map((shift) => Math.floor(value / 2 ** shift) % 256).join('.');
}

/** Verdadeiro para IPs de rede local (10/8, 172.16/12, 192.168/16) */
export function isPrivateIp(ip: string | undefined): boolean {
  const n = ipToInt(ip);
  if (n === null) return false;
  const a = Math.floor(n / 2 ** 24);
  const b = Math.floor(n / 2 ** 16) % 256;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** Endereço de broadcast da sub-rede (ex.: 192.168.1.255) */
export function subnetBroadcast(ip: string | undefined, netmask: string | undefined): string | null {
  const ipN = ipToInt(ip);
  const maskN = ipToInt(netmask || '255.255.255.0');
  if (ipN === null || maskN === null) return null;
  const hostBits = 2 ** 32 - 1 - maskN;
  const network = ipN - (ipN % (hostBits + 1));
  return intToIp(network + hostBits);
}

/**
 * Lista os endereços a escanear. Para redes maiores que /24 escaneia só o /24 do celular,
 * que é onde o roteador doméstico quase sempre coloca a TV.
 */
export function hostsToScan(ip: string, netmask: string | undefined): string[] {
  const ipN = ipToInt(ip);
  if (ipN === null) return [];
  let maskN = ipToInt(netmask || '255.255.255.0') ?? 0xffffff00;
  if (maskN < 0xffffff00) maskN = 0xffffff00;
  const hostBits = 2 ** 32 - 1 - maskN;
  const network = ipN - (ipN % (hostBits + 1));
  const hosts: string[] = [];
  for (let i = 1; i < hostBits; i++) {
    const candidate = network + i;
    if (candidate !== ipN) hosts.push(intToIp(candidate));
  }
  return hosts;
}

/** "192.168.1.20" -> "192.168.1" */
export function subnetPrefix(ip: string): string | null {
  const parts = ip.trim().split('.');
  if (parts.length < 3 || parts.slice(0, 3).some((p) => !/^\d{1,3}$/.test(p))) return null;
  return parts.slice(0, 3).join('.');
}
