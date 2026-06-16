// The single GameClock that drives idle accumulation; UI updates separately.

export class GameClock {
  private id: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly intervalMs: number,
    private readonly onTick: () => void,
  ) {}

  get running(): boolean {
    return this.id !== null;
  }

  start(): void {
    if (this.id === null) this.id = setInterval(this.onTick, this.intervalMs);
  }

  stop(): void {
    if (this.id !== null) {
      clearInterval(this.id);
      this.id = null;
    }
  }

  toggle(): void {
    if (this.running) this.stop();
    else this.start();
  }
}
