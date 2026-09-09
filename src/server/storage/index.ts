export interface StorageService {
  put(key: string, contents: Uint8Array, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
}
