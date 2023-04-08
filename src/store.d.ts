export interface ProxiedStore<T extends object> {
  get<K extends keyof T>(property: K): T[K];
  assign(object: Partial<T>): void;
  delete<K extends keyof T>(property: K): void;
  deleteAll(): void;
  deleteProperty<K extends keyof T>(property: K): void;
  emit(object?: Partial<T>): void;
  subscribe(
    run: (proxy: T) => void,
    invalidate?: () => void
  ): () => void;
}

export type ProxyHandler<T extends object> = {
  get: (internal: T, property: keyof T) => T[keyof T];
};

export function proxied<T extends object>(
  handler?: ProxyHandler<T>
): ProxiedStore<T>;
