import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { SharedMemoryV2, resetSharedMemory } from "./SharedMemoryV2";

describe("SharedMemoryV2", () => {
  let memory: SharedMemoryV2;

  beforeEach(() => {
    resetSharedMemory();
    memory = new SharedMemoryV2("test-component", {
      staleLockTimeoutMs: 50,
      watchdogIntervalMs: 10,
      lockRetryAttempts: 1,
      retryDelayMs: 1
    });
  });

  afterEach(() => {
    memory.destroy();
  });

  test("should acquire and release lock", async () => {
    memory.createSegment("seg1", { value: 1 });
    const acquired = await memory.acquireLock("seg1");
    expect(acquired).toBe(true);

    const info = memory.getSegmentInfo("seg1");
    expect(info?.locked).toBe(true);
    expect(info?.lockHolder).toBe("test-component");

    const released = memory.releaseLock("seg1");
    expect(released).toBe(true);

    const infoAfter = memory.getSegmentInfo("seg1");
    expect(infoAfter?.locked).toBe(false);
  });

  test("should handle reentrant locks", async () => {
    memory.createSegment("seg1", { value: 1 });
    await memory.acquireLock("seg1");
    const reacquired = await memory.acquireLock("seg1");
    expect(reacquired).toBe(true);
    
    // Release should still work (and fully release since no counter is mentioned in implementation, just ownership check)
    // Looking at implementation:
    // if (segment.lockHolder === this.componentId) return true;
    // So it's reentrant but doesn't count. One release unlocks it.
    memory.releaseLock("seg1");
    const info = memory.getSegmentInfo("seg1");
    expect(info?.locked).toBe(false);
  });

  test("watchdog should release stale locks", async () => {
    memory.createSegment("stale-seg", { value: 1 });
    await memory.acquireLock("stale-seg");

    // Manually set lock timestamp to be old to simulate stale lock immediately
    // Since we can't access private segments easily, we just wait.
    // Timeout is 50ms. We wait 70ms.
    await new Promise(resolve => setTimeout(resolve, 70));

    // Watchdog runs every 10ms.
    // It should have released the lock by now.
    
    // Wait a bit more for watchdog cycle
    await new Promise(resolve => setTimeout(resolve, 20));

    const info = memory.getSegmentInfo("stale-seg");
    expect(info?.locked).toBe(false);
  });

  test("getStats returns correct counts", async () => {
    memory.createSegment("s1", {});
    memory.createSegment("s2", {});
    
    await memory.acquireLock("s1");
    
    const stats = memory.getStats();
    expect(stats.totalSegments).toBe(2);
    expect(stats.lockedSegments).toBe(1);
    
    memory.releaseLock("s1");
    const stats2 = memory.getStats();
    expect(stats2.lockedSegments).toBe(0);
  });
});
