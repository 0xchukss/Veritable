declare module "lru-cache" {
  export class LRUCache<K, V> {
    constructor(options: any);
    get(key: K): V | undefined;
    set(key: K, value: V, options?: any): void;
  }
}
