/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   AETERNA VISUAL MODULE                                                        ║
 * ║   "Unified visual testing facade"                                             ║
 * ║                                                                               ║
 * ║   TODO B #33-34 - Visual Testing Module                                       ║
 * ║                                                                               ║
 * ║   © 2025-2026 Aeterna | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  VisualTestEngine,
  ScreenshotOptions,
  ComparisonResult,
  VisualTestConfig,
  Viewport,
  ViewportPresets,
  getVisualEngine,
  configureVisual,
  visual,
} from './engine';

export {
  SnapshotManager,
  SnapshotConfig,
  SnapshotSerializer,
  SnapshotResult,
  getSnapshotManager,
  configureSnapshots,
  snapshot,
} from './snapshot';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED VISUAL TESTING
// ═══════════════════════════════════════════════════════════════════════════════

import { VisualTestEngine, VisualTestConfig, ComparisonResult, ViewportPresets } from './engine';
import { SnapshotManager, SnapshotConfig, SnapshotResult } from './snapshot';

export interface AeternaVisualConfig {
  visual?: Partial<VisualTestConfig>;
  snapshot?: Partial<SnapshotConfig>;
}

/**
 * Unified Aeterna Visual Testing
 */
export class AeternaVisual {
  private static instance: AeternaVisual;

  private _engine: VisualTestEngine;
  private _snapshots: SnapshotManager;

  private constructor(config: AeternaVisualConfig = {}) {
    this._engine = VisualTestEngine.getInstance(config.visual);
    this._snapshots = SnapshotManager.getInstance(config.snapshot);
  }

  static getInstance(config?: AeternaVisualConfig): AeternaVisual {
    if (!AeternaVisual.instance) {
      AeternaVisual.instance = new AeternaVisual(config);
    }
    return AeternaVisual.instance;
  }

  static configure(config: AeternaVisualConfig): AeternaVisual {
    AeternaVisual.instance = new AeternaVisual(config);
    return AeternaVisual.instance;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACCESSORS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get visual engine
   */
  get engine(): VisualTestEngine {
    return this._engine;
  }

  /**
   * Get snapshot manager
   */
  get snapshots(): SnapshotManager {
    return this._snapshots;
  }

  /**
   * Get viewport presets
   */
  get viewports(): typeof ViewportPresets {
    return ViewportPresets;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREENSHOT TESTING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Compare screenshot with baseline
   */
  async compareScreenshot(name: string, screenshot: Buffer): Promise<ComparisonResult> {
    return this._engine.compare(name, screenshot);
  }

  /**
   * Assert screenshot matches baseline
   */
  async assertScreenshot(name: string, screenshot: Buffer): Promise<void> {
    return this._engine.assertMatch(name, screenshot);
  }

  /**
   * Save new baseline
   */
  async saveBaseline(name: string, screenshot: Buffer): Promise<string> {
    return this._engine.saveBaseline(name, screenshot);
  }

  /**
   * Check baseline exists
   */
  async hasBaseline(name: string): Promise<boolean> {
    return this._engine.hasBaseline(name);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SNAPSHOT TESTING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Match value snapshot
   */
  async matchSnapshot(
    testName: string,
    value: any,
    snapshotName?: string
  ): Promise<SnapshotResult> {
    return this._snapshots.matchSnapshot(testName, value, snapshotName);
  }

  /**
   * Assert value matches snapshot
   */
  async assertSnapshot(testName: string, value: any, snapshotName?: string): Promise<void> {
    return this._snapshots.assertSnapshot(testName, value, snapshotName);
  }

  /**
   * Match inline snapshot
   */
  matchInlineSnapshot(value: any, inlineSnapshot?: string): { match: boolean; actual: string } {
    return this._snapshots.matchInlineSnapshot(value, inlineSnapshot);
  }

  /**
   * Serialize value
   */
  serialize(value: any): string {
    return this._snapshots.serialize(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COMBINED TESTING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Full page test - screenshot + HTML snapshot
   */
  async fullPageTest(
    name: string,
    screenshot: Buffer,
    html: string
  ): Promise<{ visual: ComparisonResult; snapshot: SnapshotResult }> {
    const [visual, snapshot] = await Promise.all([
      this.compareScreenshot(name, screenshot),
      this.matchSnapshot(name, html, `${name}-html`),
    ]);

    return { visual, snapshot };
  }

  /**
   * Assert full page matches
   */
  async assertFullPage(name: string, screenshot: Buffer, html: string): Promise<void> {
    await Promise.all([
      this.assertScreenshot(name, screenshot),
      this.assertSnapshot(name, html, `${name}-html`),
    ]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESPONSIVE TESTING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Test multiple viewports
   */
  async testResponsive(
    name: string,
    screenshotGetter: (viewport: { width: number; height: number }) => Promise<Buffer>,
    viewportNames: (keyof typeof ViewportPresets)[] = ['desktop', 'iPad', 'iPhone14']
  ): Promise<Map<string, ComparisonResult>> {
    const results = new Map<string, ComparisonResult>();

    for (const viewportName of viewportNames) {
      const viewport = ViewportPresets[viewportName];
      const screenshot = await screenshotGetter(viewport);
      const result = await this.compareScreenshot(`${name}-${viewportName}`, screenshot);
      results.set(viewportName, result);
    }

    return results;
  }

  /**
   * Assert all viewports match
   */
  async assertResponsive(
    name: string,
    screenshotGetter: (viewport: { width: number; height: number }) => Promise<Buffer>,
    viewportNames: (keyof typeof ViewportPresets)[] = ['desktop', 'iPad', 'iPhone14']
  ): Promise<void> {
    const results = await this.testResponsive(name, screenshotGetter, viewportNames);

    const failures: string[] = [];
    for (const [viewport, result] of results) {
      if (!result.match) {
        failures.push(`${viewport}: ${result.diffPercentage.toFixed(2)}% difference`);
      }
    }

    if (failures.length > 0) {
      throw new Error(`Responsive visual regression:\n${failures.join('\n')}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Enable update mode
   */
  enableUpdateMode(): void {
    this._snapshots.setUpdateMode(true);
  }

  /**
   * Disable update mode
   */
  disableUpdateMode(): void {
    this._snapshots.setUpdateMode(false);
  }

  /**
   * Reset for new test file
   */
  reset(): void {
    this._snapshots.resetCounts();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getAeternaVisual = (): AeternaVisual => AeternaVisual.getInstance();
export const configureAeternaVisual = (config: AeternaVisualConfig): AeternaVisual =>
  AeternaVisual.configure(config);

export default AeternaVisual;
