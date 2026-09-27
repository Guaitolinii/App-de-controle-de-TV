import { Capacitor, PluginListenerHandle, registerPlugin } from '@capacitor/core';

/**
 * Interface do plugin nativo local "LgTvBridge" (plugins/lg-tv-bridge).
 * No iOS ele faz o que o WebView não consegue: WebSocket com certificado autoassinado da TV,
 * sondagem TCP da rede e envio UDP para Wake-on-LAN.
 */
export interface LgTvBridgePlugin {
  openSocket(options: { id: string; url: string; timeoutMs?: number }): Promise<{ id: string }>;
  sendSocket(options: { id: string; data: string }): Promise<void>;
  closeSocket(options: { id: string }): Promise<void>;
  probePort(options: { host: string; port: number; timeoutMs?: number }): Promise<{ open: boolean; reason?: string }>;
  sendUdp(options: { host: string; port: number; base64: string; broadcast?: boolean }): Promise<{ sent: boolean; bytes?: number; error?: string }>;
  getNetworkInfo(): Promise<{ ip?: string; netmask?: string; interface?: string }>;
  addListener(
    eventName: 'socketMessage',
    listener: (event: { id: string; data: string }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'socketClosed',
    listener: (event: { id: string; code: number; reason: string }) => void
  ): Promise<PluginListenerHandle>;
}

export const LgTvBridge = registerPlugin<LgTvBridgePlugin>('LgTvBridge');

/** Verdadeiro quando o app roda como app nativo e o plugin está registrado (iOS). */
export function isNativeBridgeAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LgTvBridge');
}

/** Verdadeiro quando o app roda empacotado (iOS/Android), e não no navegador. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}
