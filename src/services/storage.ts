import { TVDevice } from '../types/tv';

const STORAGE_KEY_TVS = 'lg_remote_saved_devices';
const STORAGE_KEY_ACTIVE = 'lg_remote_active_id';

export const DEFAULT_SAMPLE_TV: TVDevice = {
  id: 'tv_living_room',
  name: 'LG OLED evo C3 (Sala)',
  ip: '192.168.1.145',
  mac: 'A4:5E:60:3C:9B:12',
  port: 3001,
  clientKey: 'b4a92c81e7d0f9831a384f981034f81a',
  modelName: 'OLED55C3PSA',
  webosVersion: 'webOS 23 (8.3.0)',
  isOnline: true,
  powerState: 'on',
  lastConnected: Date.now(),
};

export class TVStorage {
  static getDevices(): TVDevice[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TVS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading devices from storage', e);
    }
    return [DEFAULT_SAMPLE_TV];
  }

  static saveDevices(devices: TVDevice[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_TVS, JSON.stringify(devices));
    } catch (e) {
      console.error('Error saving devices', e);
    }
  }

  static getActiveDeviceId(): string {
    return localStorage.getItem(STORAGE_KEY_ACTIVE) || DEFAULT_SAMPLE_TV.id;
  }

  static setActiveDeviceId(id: string): void {
    localStorage.setItem(STORAGE_KEY_ACTIVE, id);
  }

  static upsertDevice(device: TVDevice): void {
    const list = this.getDevices();
    const index = list.findIndex((d) => d.id === device.id);
    if (index >= 0) {
      list[index] = device;
    } else {
      list.push(device);
    }
    this.saveDevices(list);
  }

  static removeDevice(id: string): void {
    const list = this.getDevices().filter((d) => d.id !== id);
    this.saveDevices(list);
  }
}
