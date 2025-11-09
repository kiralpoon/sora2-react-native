export interface ApiKeyStorage {
  load(): Promise<string | undefined>;
  save(key: string): Promise<void>;
  clear(): Promise<void>;
}

export function createMemoryApiKeyStorage(initialKey?: string): ApiKeyStorage {
  let value = initialKey;
  return {
    async load() {
      return value;
    },
    async save(key: string) {
      if (!key.trim()) {
        throw new Error('API key cannot be empty.');
      }
      value = key;
    },
    async clear() {
      value = undefined;
    },
  };
}
