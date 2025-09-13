/**
 * Simple concurrency limiter to avoid overwhelming external APIs
 */
export class ConcurrencyLimiter {
  private running = 0;
  private queue: Array<() => Promise<void>> = [];

  constructor(private readonly maxConcurrent: number) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const wrappedFn = async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.queue.push(wrappedFn);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const fn = this.queue.shift();
    
    if (!fn) {
      this.running--;
      return;
    }

    try {
      await fn();
    } finally {
      this.running--;
      // Process next item in queue
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Wait for all queued tasks to complete
   */
  async waitForAll(): Promise<void> {
    while (this.queue.length > 0 || this.running > 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
}

