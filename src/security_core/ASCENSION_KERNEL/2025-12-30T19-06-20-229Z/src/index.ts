/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *     ██████╗  █████╗ ███╗   ██╗████████╗██╗   ██╗███╗   ███╗
 *    ██╔═══██╗██╔══██╗████╗  ██║╚══██╔══╝██║   ██║████╗ ████║
 *    ██║   ██║███████║██╔██╗ ██║   ██║   ██║   ██║██╔████╔██║
 *    ██║▄▄ ██║██╔══██║██║╚██╗██║   ██║   ██║   ██║██║╚██╔╝██║
 *    ╚██████╔╝██║  ██║██║ ╚████║   ██║   ╚██████╔╝██║ ╚═╝ ██║
 *     ╚══▀▀═╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝
 *
 *                        ⚛️ VERSION 1.0.0 ⚛️
 *              "The Autonomous QA Agent - Quantum Grade"
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Aeterna - Beyond Classical Testing
 * AI-Powered • Self-Healing • Ghost Mode • Swarm Execution
 *
 * Core Capabilities:
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚛️ QUANTUM CORE      - AI-powered test intelligence
 * 🧬 SELF-HEALING      - Autonomous locator recovery
 * 👻 GHOST MODE        - Undetectable browser automation
 * 🐝 SWARM EXECUTION   - 16,000+ parallel tests
 * 🔮 PREDICTIVE AI     - Anticipates failures before they happen
 * 🛡️ FORTRESS MODE     - Production-grade isolation
 * 📊 NEURAL MAPPING    - Learns your application's DNA
 *
 * @author Aeterna Labs
 * @version 1.0.0-AETERNA
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// AETERNA CORE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { Aeterna, createQA } from './core/aeterna.js';
export { SelfHealingEngine, selfHealer } from './core/self-healing.js';
export { DeepSearchEngine, deepSearch } from './core/deep-search.js';
export { NetworkInterceptor, networkInterceptor } from './core/network-interceptor.js';
export { FluentChain } from './core/fluent-chain.js';

// Types
export * from './types/index.js';

// ═══════════════════════════════════════════════════════════════════════════════
// NEW MODULE EXPORTS - ФАЗА 1-100
// ═══════════════════════════════════════════════════════════════════════════════

// Data Module
export * from './data/index.js';

// Verification Module
export * from './verification/index.js';

// Error Handling Module
export * from './error/index.js';

// Session Module
export * from './session/index.js';

// Scenarios Module
export * from './scenario/index.js';

// Reporters Module
// export * from './reporters';

// Visual Testing Module
export * from './visual/index.js';

// CI/CD Module
export * from './ci/index.js';

// CLI Module
export * from './cli/index.js';

// API Module
export * from './api/index.js';

// Plugins Module
export * from './plugins/index.js';

// Scheduler Module
export * from './scheduler/index.js';

// Metrics Module
export * from './metrics/index.js';

// Browser Module
// export * from './browser/index.js';

// Mobile Module
export * from './mobile/index.js';

// Performance Module
export * from './performance/index.js';

// Security Module
export * from './security/index.js';

// AI Module
export * from './ai/index.js';

// Behavior Module
export * from './behavior/index.js';

// Forms Module
export * from './forms/index.js';

// Integrations Module
// export * from './integrations';

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

import { createMM } from './core/aeterna.js';
export const mm = createMM();

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION INFO
// ═══════════════════════════════════════════════════════════════════════════════

export const VERSION = '1.0.0-AETERNA';
export const CODENAME = 'GHOST_IN_THE_MACHINE';

// ═══════════════════════════════════════════════════════════════════════════════
// GHOST v1.0.0-AETERNA - ZERO-DETECTION AUTOMATION
// ═══════════════════════════════════════════════════════════════════════════════

export * from './ghost/index.js';
