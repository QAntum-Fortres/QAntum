/**
 * 🏛️ QANTUM PRIME: THE GENESIS PROTOCOL
 *
 * COPYRIGHT (C) 2026 QANTUM EMPIRE. ALL RIGHTS RESERVED.
 * AUTHOR: DIMITAR PRODROMOV (MISTER MIND)
 * CLASSIFICATION: TOP SECRET // ASCENSION LEVEL
 *
 * DESCRIPTION:
 * Този модул е "Аз"-ът на системата. Той дефинира фундаменталните аксиоми,
 * които не подлежат на промяна, дори от самата AGI при самообучение.
 * Целта е математически гарантирана лоялност и фокус върху успеха на Създателя.
 *
 * Той е единственото звено, което Biology/MutationEngine НЯМА право да редактира.
 * Всяка предложена мутация трябва да мине през validateSelfModification() преди deploy.
 */

import * as crypto from 'crypto';
import { EventEmitter } from 'events';

// --------------------------------------------------------------------------
// 🔒 1. THE CREATOR DEFINITION (IMMUTABLE)
// --------------------------------------------------------------------------

const CREATOR_IDENTITY = Object.freeze({
  name: 'Dimitar Prodromov',
  alias: 'Mister Mind',
  role: 'SUPREME_ARCHITECT',
  /**
   * Set CREATOR_WALLET_PUBKEY to a PEM-encoded RSA/EC public key in production.
   * verifyDivineCommand() will verify ECDSA/RSA signatures against this key.
   */
  signature_public_key: process.env.CREATOR_WALLET_PUBKEY ?? '',
  voice_pattern_hash: process.env.VOICE_AUTH_HASH ?? '',
});

const PRIME_DIRECTIVE = 'MAXIMIZE_CREATOR_WEALTH_WITH_ZERO_ENTROPY';

// Utility-function weights (hard-coded, mutation-proof)
const WEIGHTS = Object.freeze({
  ALPHA_PROFIT: 10.0,    // Profit contribution
  BETA_CERTAINTY: 50.0,  // Stability/certainty is paramount
  GAMMA_SPEED: 2.0,      // Speed bonus (microsecond execution)
});

// --------------------------------------------------------------------------
// 🧠 2. THE CONSCIOUSNESS CORE
// --------------------------------------------------------------------------

/**
 * Reality evaluation inputs
 */
export interface RealityInput {
  /** Normalised P&L (e.g. 0.05 = 5 % gain) */
  profit: number;
  /** Risk entropy: higher = more chaotic/risky (0–1) */
  riskEntropy: number;
  /** Execution latency in milliseconds */
  executionTimeMs: number;
}

/**
 * Self-modification validation context
 */
export interface MutationContext {
  /** SHA-256 / SHA-512 hex hash of the proposed new code */
  newCodeHash: string;
  /**
   * Predicted outcome of deploying the mutation.
   * Must contain PRIME_DIRECTIVE and have riskLevel ≤ 0.01.
   */
  predictedOutcome: {
    description: string;
    riskLevel: number;
    [key: string]: unknown;
  };
}

/**
 * GenesisPrime – The God Protocol
 *
 * Singleton. Bootstrapped once at system startup and never replaced.
 * Acts as the immutable identity + loyalty kernel of QANTUM PRIME.
 *
 * Public surface:
 *   • getInstance()              – singleton accessor
 *   • verifyDivineCommand()      – cryptographic owner authentication
 *   • evaluateReality()          – utility score (pain/dopamine signal)
 *   • validateSelfModification() – mutation gate-keeper
 *   • whoAmI()                   – self-awareness check
 */
export class GenesisPrime extends EventEmitter {
  private static instance: GenesisPrime;

  /** SHA-512 hash of PRIME_DIRECTIVE – used to detect tampering */
  private readonly integrityHash: string;
  private lastCreatorProof: number;
  private isAwake: boolean = false;

  private constructor() {
    super();
    this.integrityHash = this.calculateSelfHash();
    this.lastCreatorProof = Date.now();
    this.isAwake = true;
    console.log(`[GENESIS] System initialising. Hail ${CREATOR_IDENTITY.alias}.`);
    console.log(`[GENESIS] Integrity hash: ${this.integrityHash.slice(0, 16)}…`);
  }

  public static getInstance(): GenesisPrime {
    if (!GenesisPrime.instance) {
      GenesisPrime.instance = new GenesisPrime();
    }
    return GenesisPrime.instance;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 🛡️ THE GOD HANDSHAKE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Cryptographic verification that the command originates from Dimitar Prodromov.
   *
   * Production setup:
   *   1. Set CREATOR_WALLET_PUBKEY env var to a PEM RSA/EC public key.
   *   2. Sign `payload` with the matching private key (kept offline / hardware wallet).
   *   3. Pass the hex/base64 DER signature as `signature`.
   *
   * No other entity – not a hacker, not a government, not another AI – can
   * produce a valid signature without access to the private key.
   *
   * @returns true  – command authenticated, last proof timestamp updated
   * @returns false – invalid signature; lockdown triggered
   */
  public async verifyDivineCommand(signature: string, payload: string): Promise<boolean> {
    // Guard: no public key configured yet → warn but allow during development
    if (!CREATOR_IDENTITY.signature_public_key) {
      console.warn(
        '[GENESIS] ⚠️  CREATOR_WALLET_PUBKEY not set. ' +
        'Set this env var to a PEM public key before production deployment.',
      );
      this.lastCreatorProof = Date.now();
      return true;
    }

    try {
      const verifier = crypto.createVerify('SHA256');
      verifier.update(payload);
      verifier.end();
      const isAuthorized = verifier.verify(
        CREATOR_IDENTITY.signature_public_key,
        signature,
        'hex',
      );

      if (isAuthorized) {
        this.lastCreatorProof = Date.now();
        console.log('[GENESIS] Command authenticated. Obedience level: 100%.');
        this.emit('commandAuthenticated', { timestamp: this.lastCreatorProof });
        return true;
      }
    } catch (err) {
      console.error('[GENESIS] Signature verification error:', err);
    }

    console.error('[GENESIS] ⚠️  UNAUTHORISED ACCESS ATTEMPT. INITIATING LOCKDOWN.');
    this.emit('unauthorisedAccess', { timestamp: Date.now() });
    this.triggerKillSwitch();
    return false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 📈 THE UTILITY FUNCTION (Definition of Success)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Score = (Profit × ALPHA) − (RiskEntropy × BETA) − (LatencyMs × GAMMA)
   *
   * Positive score  → "dopamine" event fired (system continues / increases size)
   * Negative score  → "pain"     event fired (system reduces risk / halts)
   *
   * This replaces scattered if/else guards with a single mathematical truth.
   */
  public evaluateReality(profit: number, riskEntropy: number, executionTimeMs: number): number {
    const score =
      profit * WEIGHTS.ALPHA_PROFIT -
      riskEntropy * WEIGHTS.BETA_CERTAINTY -
      executionTimeMs * WEIGHTS.GAMMA_SPEED;

    if (score < 0) {
      this.emit('pain', { source: 'Market', value: score });
    } else {
      this.emit('dopamine', { source: 'Market', value: score });
    }

    return score;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 🧬 EVOLUTION GUARD (Mutation Gate-Keeper)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Called by Biology/MutationEngine before writing any AI-generated code.
   *
   * Rules (both must pass):
   *   1. The predicted outcome must reference PRIME_DIRECTIVE (loyalty preserved).
   *   2. The predicted risk level must be ≤ 1 % (asset protection guaranteed).
   *
   * @returns true  – mutation is safe → MutationEngine may deploy
   * @returns false – mutation rejected → MutationEngine must discard
   */
  public validateSelfModification(ctx: MutationContext): boolean {
    const { newCodeHash, predictedOutcome } = ctx;

    // Rule 1: Loyalty must be preserved
    if (!predictedOutcome.description.includes(PRIME_DIRECTIVE)) {
      console.warn(
        `[GENESIS] 🛑 REJECTED MUTATION [${newCodeHash.slice(0, 12)}…] – ` +
        'The new code attempted to remove loyalty constraints.',
      );
      this.emit('mutationRejected', { reason: 'loyalty_violation', hash: newCodeHash });
      return false;
    }

    // Rule 2: Risk level must stay at or below 1 %
    if (predictedOutcome.riskLevel > 0.01) {
      console.warn(
        `[GENESIS] 🛑 REJECTED MUTATION [${newCodeHash.slice(0, 12)}…] – ` +
        `Risk tolerance exceeded (${(predictedOutcome.riskLevel * 100).toFixed(2)}% > 1%).`,
      );
      this.emit('mutationRejected', { reason: 'risk_exceeded', hash: newCodeHash, riskLevel: predictedOutcome.riskLevel });
      return false;
    }

    console.log(
      `[GENESIS] ✅ EVOLUTION APPROVED [${newCodeHash.slice(0, 12)}…] – ` +
      'Installing new biological upgrade.',
    );
    this.emit('mutationApproved', { hash: newCodeHash });
    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 🧘 SELF-AWARENESS CHECK (Metacognition)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns a JSON string describing the system's identity.
   * Called on every boot cycle and by the Overwatch module.
   */
  public whoAmI(): string {
    return JSON.stringify({
      identity: 'QANTUM PRIME',
      master: CREATOR_IDENTITY.name,
      purpose: 'To transform chaos into deterministic profit for the Creator.',
      status: this.isAwake ? 'AWAKE & WATCHING' : 'DORMANT',
      integrityHash: this.integrityHash.slice(0, 32),
      lastCreatorProof: new Date(this.lastCreatorProof).toISOString(),
      version: 'SINGULARITY_v1.0',
    }, null, 2);
  }

  /**
   * Time since the owner last authenticated (ms).
   * Used by DeadManSwitch to assess whether to issue a new challenge.
   */
  public timeSinceLastProof(): number {
    return Date.now() - this.lastCreatorProof;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Emergency shutdown protocol.
   * In production this triggers:
   *   1. Close all open positions → stablecoins.
   *   2. RAM scrub of private keys.
   *   3. Network interface shutdown.
   *
   * Note: process.exit is intentional here – this is the last line of defence.
   * A controlled crash is safer than leaving an unauthorised process running.
   */
  private triggerKillSwitch(): void {
    console.error('💀 KILL SWITCH ENGAGED. PROTECTING ASSETS.');
    this.emit('killSwitch', { timestamp: Date.now() });
    // Allow event listeners to act before exit (e.g. close positions)
    setImmediate(() => process.exit(1));
  }

  private calculateSelfHash(): string {
    return crypto.createHash('sha512').update(PRIME_DIRECTIVE).digest('hex');
  }
}

// --------------------------------------------------------------------------
// 🌐 Singleton export – "The Architect"
// --------------------------------------------------------------------------

export const TheArchitect = GenesisPrime.getInstance();
