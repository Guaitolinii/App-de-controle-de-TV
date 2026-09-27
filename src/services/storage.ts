import { TVDevice } from '../types/tv';

const STORAGE_KEY_TVS = 'lg_remote_saved_devices';
const STORAGE_KEY_ACTIVE = 'lg_remote_active_id';

export class TVStorage {
  static getDevices(): TVDevice[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TVS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Erro ao ler dispositivos do storage', e);
    }
    return [];
  }

  static saveDevices(devices: TVDevice[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_TVS, JSON.stringify(devices));
    } catch (e) {
      console.error('Erro ao salvar dispositivos', e);
    }
  }

  static getActiveDeviceId(): string {
    const devices = this.getDevices();
    const stored = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (stored && devices.some((d) => d.id === stored)) {
      return stored;
    }
    return devices[0]?.id || '';
  }

  static setActiveDeviceId(id: string): void {
    localStorage.setItem(STORAGE_KEY_ACTIVE, id);
  }

  static upsertDevice(device: TVDevice): void {
    const list = this.getDevices();
    const index = list.findIndex((d) => d.id === device.id || d.ip === device.ip);
    if (index >= 0) {
      list[index] = { ...list[index], ...device };
    } else {
      list.push(device);
    }
    this.saveDevices(list);
    this.setActiveDeviceId(device.id);
  }

  static updateClientKey(deviceId: string, clientKey: string): void {
    const list = this.getDevices();
    const dev = list.find((d) => d.id === deviceId);
    if (dev) {
      dev.clientKey = clientKey;
      this.saveDevices(list);
    }
  }

  static removeDevice(id: string): void {
    const list = this.getDevices().filter((d) => d.id !== id);
    this.saveDevices(list);
    if (this.getActiveDeviceId() === id) {
      if (list.length > 0) {
        this.setActiveDeviceId(list[0].id);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE);
      }
    }
  }
}
