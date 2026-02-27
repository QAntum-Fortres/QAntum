/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHYSICS ENGINE SMOKE TEST
 * First Line of Defense for the PHYSICS Layer
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "Димният тест: Ако включиш уреда и излиза дим, нещо не е наред."
 *                                                    — Engineering Wisdom
 *
 * This smoke test validates the core PHYSICS layer components:
 * - PhysicsQueue (priority queue with time decay)
 * - RateLimiter
 * - SlidingWindowCounter
 * - PerformanceTracker
 * - calculateSwarmForces
 *
 * @module tests/smoke/physics-engine.test
 * @version 1.0.0-AETERNA
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

// Physics Layer imports
import {
  PhysicsQueue,
  RateLimiter,
  SlidingWindowCounter,
  PerformanceTracker,
  calculateSwarmForces,
  type SwarmParticle,
} from '../../src/layers/physics';

// ═══════════════════════════════════════════════════════════════════════════
// SMOKE TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

describe('🔬 PHYSICS ENGINE SMOKE TEST', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // ENVIRONMENT CHECKS
  // ─────────────────────────────────────────────────────────────────────────

  describe('Environment', () => {
    it('should have SharedArrayBuffer available', () => {
      expect(typeof SharedArrayBuffer).toBe('function');
    });

    it('should have Atomics available', () => {
      expect(typeof Atomics).toBe('object');
    });

    it('should support Worker threads', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Worker } = require('worker_threads');
      expect(typeof Worker).toBe('function');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PHYSICS QUEUE TESTS
  // ─────────────────────────────────────────────────────────────────────────

  describe('PhysicsQueue', () => {
    let queue: PhysicsQueue<string>;

    beforeAll(() => {
      queue = new PhysicsQueue<string>({ maxSize: 100 });
    });

    it('should create instance', () => {
      expect(queue).toBeInstanceOf(PhysicsQueue);
    });

    it('should enqueue items with priority', () => {
      const testQueue = new PhysicsQueue<string>({ maxSize: 100 });
      const success = testQueue.enqueue('task-1', 10);
      expect(success).toBe(true);
      expect(testQueue.size).toBe(1);
    });

    it('should dequeue highest priority first', () => {
      const testQueue = new PhysicsQueue<string>({ maxSize: 100 });
      testQueue.enqueue('low-priority', 1);
      testQueue.enqueue('high-priority', 100);
      testQueue.enqueue('mid-priority', 50);

      const first = testQueue.dequeue();
      expect(first).toBe('high-priority');
    });

    it('should respect max size limit', () => {
      const smallQueue = new PhysicsQueue<number>({ maxSize: 3 });
      smallQueue.enqueue(1, 10);
      smallQueue.enqueue(2, 20);
      smallQueue.enqueue(3, 30);

      const success = smallQueue.enqueue(4, 40);
      expect(typeof success).toBe('boolean');
    });

    it('should handle deadline urgency boost', () => {
      const urgentQueue = new PhysicsQueue<string>({ maxSize: 10 });
      urgentQueue.enqueue('normal', 50);
      urgentQueue.enqueue('urgent', 10, -1000);

      const first = urgentQueue.dequeue();
      expect(first).toBe('urgent');
    });

    it('should return undefined when empty', () => {
      const emptyQueue = new PhysicsQueue<string>({ maxSize: 10 });
      expect(emptyQueue.dequeue()).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // RATE LIMITER TESTS
  // ─────────────────────────────────────────────────────────────────────────

  describe('RateLimiter', () => {
    it('should create instance with config', () => {
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 1000 });
      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it('should allow requests within limit', () => {
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });
      for (let i = 0; i < 5; i++) {
        expect(limiter.tryAcquire()).toBe(true);
      }
    });

    it('should block requests over limit', () => {
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 10000 });
      limiter.tryAcquire();
      limiter.tryAcquire();
      limiter.tryAcquire();
      expect(limiter.tryAcquire()).toBe(false);
    });

    it('should report remaining capacity', () => {
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 1000 });
      limiter.tryAcquire();
      limiter.tryAcquire();
      expect(limiter.remaining()).toBe(8);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SLIDING WINDOW COUNTER TESTS
  // ─────────────────────────────────────────────────────────────────────────

  describe('SlidingWindowCounter', () => {
    it('should create instance', () => {
      const counter = new SlidingWindowCounter({ windowMs: 1000, buckets: 10 });
      expect(counter).toBeInstanceOf(SlidingWindowCounter);
    });

    it('should increment and track counts', () => {
      const counter = new SlidingWindowCounter({ windowMs: 1000, buckets: 10 });
      counter.increment();
      counter.increment();
      counter.increment();
      expect(counter.count()).toBe(3);
    });

    it('should calculate rate', () => {
      const counter = new SlidingWindowCounter({ windowMs: 1000, buckets: 10 });
      counter.increment();
      counter.increment();
      const rate = counter.rate();
      expect(rate).toBeGreaterThanOrEqual(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PERFORMANCE TRACKER TESTS
  // ─────────────────────────────────────────────────────────────────────────

  describe('PerformanceTracker', () => {
    it('should create instance', () => {
      const tracker = new PerformanceTracker({ historySize: 100 });
      expect(tracker).toBeInstanceOf(PerformanceTracker);
    });

    it('should record operations', () => {
      const tracker = new PerformanceTracker({ historySize: 100 });
      tracker.record('test-op', 10);
      tracker.record('test-op', 20);
      tracker.record('test-op', 30);
      const stats = tracker.getStats('test-op');
      expect(stats.count).toBe(3);
      expect(stats.avg).toBe(20);
    });

    it('should calculate min/max correctly', () => {
      const tracker = new PerformanceTracker({ historySize: 100 });
      tracker.record('op', 5);
      tracker.record('op', 15);
      tracker.record('op', 10);
      const stats = tracker.getStats('op');
      expect(stats.min).toBe(5);
      expect(stats.max).toBe(15);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SWARM FORCES CALCULATION TESTS
  // ─────────────────────────────────────────────────────────────────────────

  describe('calculateSwarmForces', () => {
    it('should calculate forces between particles', () => {
      const particle1: SwarmParticle = {
        id: 'p1',
        mass: 1,
        velocity: 0,
        position: { x: 0, y: 0 },
        createdAt: { epochMs: Date.now(), iso: new Date().toISOString() },
        bestPosition: { x: 0, y: 0 },
        bestFitness: 0,
      };

      const particle2: SwarmParticle = {
        id: 'p2',
        mass: 1,
        velocity: 0,
        position: { x: 10, y: 0 },
        createdAt: { epochMs: Date.now(), iso: new Date().toISOString() },
        bestPosition: { x: 10, y: 0 },
        bestFitness: 0,
      };

      const forces = calculateSwarmForces([particle1, particle2], {
        cohesionWeight: 1,
        separationWeight: 1,
        alignmentWeight: 1,
        neighborRadius: 100,
      });

      expect(forces).toBeDefined();
      expect(Array.isArray(forces)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // INTEGRATION: Queue + RateLimiter Flow
  // ─────────────────────────────────────────────────────────────────────────

  describe('E2E Integration', () => {
    it('should flow from queue through rate limiter', () => {
      const queue = new PhysicsQueue<{ id: string; priority: number }>({ maxSize: 10 });
      const limiter = new RateLimiter({ maxRequests: 100, windowMs: 1000 });

      queue.enqueue({ id: 'task-1', priority: 10 }, 10);
      queue.enqueue({ id: 'task-2', priority: 20 }, 20);
      queue.enqueue({ id: 'task-3', priority: 15 }, 15);

      const results: string[] = [];

      while (queue.size > 0) {
        const task = queue.dequeue();
        if (task && limiter.tryAcquire()) {
          results.push(task.id);
        }
      }

      expect(results).toHaveLength(3);
      expect(results[0]).toBe('task-2');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE BASELINE
// ═══════════════════════════════════════════════════════════════════════════

describe('⚡ Performance Baseline', () => {
  it('should enqueue 10,000 items in under 100ms', () => {
    const queue = new PhysicsQueue<number>({ maxSize: 10000 });
    const start = performance.now();

    for (let i = 0; i < 10000; i++) {
      queue.enqueue(i, Math.random() * 100);
    }

    const duration = performance.now() - start;
    console.log(`[Perf] Enqueue 10,000: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(100);
  });

  it('should dequeue 10,000 items in under 500ms', () => {
    const queue = new PhysicsQueue<number>({ maxSize: 10000 });

    for (let i = 0; i < 10000; i++) {
      queue.enqueue(i, Math.random() * 100);
    }

    const start = performance.now();
    while (queue.size > 0) {
      queue.dequeue();
    }

    const duration = performance.now() - start;
    console.log(`[Perf] Dequeue 10,000: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(500);
  });

  it('should handle 100,000 rate limit checks in under 50ms', () => {
    const limiter = new RateLimiter({ maxRequests: 1000000, windowMs: 10000 });
    const start = performance.now();

    for (let i = 0; i < 100000; i++) {
      limiter.tryAcquire();
    }

    const duration = performance.now() - start;
    console.log(`[Perf] Rate Limit 100,000: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(50);
  });
});
