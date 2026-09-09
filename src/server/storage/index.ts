export interface StorageService {
  put(key: string, contents: Uint8Array, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export { localStorage } from "./local";
export { storeSettingMedia } from "./media";
