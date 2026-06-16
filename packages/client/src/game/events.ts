// Minimal typed event emitter (Signal/observer equivalent for the web).

type Handler<T> = (payload: T) => void;

export class Emitter<Events extends Record<string, unknown>> {
  private readonly map = new Map<keyof Events, Set<Handler<unknown>>>();

  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): () => void {
    const set = this.map.get(type) ?? new Set<Handler<unknown>>();
    set.add(handler as Handler<unknown>);
    this.map.set(type, set);
    return () => set.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    this.map.get(type)?.forEach((h) => (h as Handler<Events[K]>)(payload));
  }
}
