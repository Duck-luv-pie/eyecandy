import { describe, it, expect, vi } from 'vitest';
import { ConcurrencyLimiter } from './concurrency.js';

describe('ConcurrencyLimiter', () => {
  it('should limit concurrent executions', async () => {
    const limiter = new ConcurrencyLimiter(2);
    const executionOrder: number[] = [];
    const startTimes: number[] = [];

    const createTask = (id: number, delay: number) => async () => {
      startTimes[id] = Date.now();
      executionOrder.push(id);
      await new Promise(resolve => setTimeout(resolve, delay));
    };

    // Start 4 tasks with max concurrency of 2
    const promises = [
      limiter.execute(createTask(0, 50)),
      limiter.execute(createTask(1, 50)),
      limiter.execute(createTask(2, 50)),
      limiter.execute(createTask(3, 50))
    ];

    await Promise.all(promises);

    // First two should start immediately
    expect(executionOrder.slice(0, 2)).toContain(0);
    expect(executionOrder.slice(0, 2)).toContain(1);
    
    // Last two should start after first two complete
    expect(executionOrder.slice(2, 4)).toContain(2);
    expect(executionOrder.slice(2, 4)).toContain(3);
  });

  it('should handle errors properly', async () => {
    const limiter = new ConcurrencyLimiter(1);
    
    const errorTask = async () => {
      throw new Error('Test error');
    };

    const successTask = async () => {
      return 'success';
    };

    // First task should fail
    await expect(limiter.execute(errorTask)).rejects.toThrow('Test error');
    
    // Second task should succeed
    const result = await limiter.execute(successTask);
    expect(result).toBe('success');
  });

  it('should wait for all tasks to complete', async () => {
    const limiter = new ConcurrencyLimiter(1);
    let completed = 0;

    const createTask = (id: number) => async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      completed++;
    };

    // Start multiple tasks
    const promises = [
      limiter.execute(createTask(0)),
      limiter.execute(createTask(1)),
      limiter.execute(createTask(2))
    ];

    // Wait for all to complete
    await limiter.waitForAll();
    await Promise.all(promises);

    expect(completed).toBe(3);
  });
});

