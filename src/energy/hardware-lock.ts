/**
 * ⚛️🔐 AETERNA GENETIC LOCK - HARDWARE FINGERPRINT AUTHENTICATION
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 *    ██████╗ ███████╗███╗   ██╗███████╗████████╗██╗ ██████╗
 *   ██╔════╝ ██╔════╝████╗  ██║██╔════╝╚══██╔══╝██║██╔════╝
 *   ██║  ███╗█████╗  ██╔██╗ ██║█████╗     ██║   ██║██║
 *   ██║   ██║██╔══╝  ██║╚██╗██║██╔══╝     ██║   ██║██║
 *   ╚██████╔╝███████╗██║ ╚████║███████╗   ██║   ██║╚██████╗
 *    ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝ ╚═════╝
 *
 *   ██╗      ██████╗  ██████╗██╗  ██╗
 *   ██║     ██╔═══██╗██╔════╝██║ ██╔╝
 *   ██║     ██║   ██║██║     █████╔╝
 *   ██║     ██║   ██║██║     ██╔═██╗
 *   ███████╗╚██████╔╝╚██████╗██║  ██╗
 *   ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝
 *
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 *   Hardware DNA Verification System
 *
 *   Aeterna работи САМО на оторизирани машини.
 *   Всеки опит за копиране на друга система ще бъде засечен.
 *
 *   "Your hardware is the key. Without it, Aeterna is a ghost."
 *
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import * as crypto from 'crypto';
import * as os from 'os';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════════════

export interface HardwareFingerprint {
  cpuId: string;
  cpuModel: string;
  cpuCores: number;
  motherboardSerial: string;
  biosSerial: string;
  diskUUID: string;
  macAddresses: string[];
  hostname: string;
  username: string;
  platform: string;
  arch: string;
  totalMemory: number;
  gpuInfo?: string;
}

export interface FingerprintHash {
  full: string; // SHA-256 of all components
  partial: string; // SHA-256 of stable components (excludes MAC)
  timestamp: number;
  version: string;
}

export interface LicenseData {
  machineId: string;
  fingerprintHash: string;
  issuedAt: number;
  expiresAt: number;
  tier: 'developer' | 'professional' | 'enterprise';
  maxWorkers: number;
  features: string[];
  signature: string;
}

export interface HardwareLockConfig {
  strictMode: boolean; // Fail on any mismatch
  allowedVariance: number; // 0-1, how much variance allowed
  checkInterval: number; // How often to verify (ms)
  licensePath: string; // Path to license file
  onViolation: 'warn' | 'disable' | 'destroy';
  encryptionKey?: string; // Key for license encryption
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// HARDWARE LOCK ENGINE
// ═══════════════════════════════════════════════════════════════════════════════════════

export class HardwareLock extends EventEmitter {
  private config: HardwareLockConfig;
  private currentFingerprint: HardwareFingerprint | null = null;
  private licenseData: LicenseData | null = null;
  private verificationInterval: NodeJS.Timeout | null = null;
  private isLocked = false;
  private violationCount = 0;

  // Димитър's Master Machine fingerprint (Lenovo Ryzen 7)
  private static readonly MASTER_FINGERPRINT_HASH = 'GENERATE_ON_FIRST_RUN';

  constructor(config?: Partial<HardwareLockConfig>) {
    super();

    this.config = {
      strictMode: config?.strictMode ?? true,
      allowedVariance: config?.allowedVariance ?? 0.1,
      checkInterval: config?.checkInterval ?? 300000, // 5 minutes
      licensePath: config?.licensePath ?? './.aeterna-license',
      onViolation: config?.onViolation ?? 'disable',
      encryptionKey: config?.encryptionKey,
    };
  }

  /**
   * 🔓 Check for Global CI Override
   */
  private checkGlobalOverride(): boolean {
    // The "Skeleton Key" for CI/CD pipelines
    if (process.env.AETERNA_GLOBAL_OVERRIDE === 'ALLOW_CI_EXECUTION_8822') {
      console.log('[GENETIC-LOCK] 🔓 GLOBAL OVERRIDE DETECTED (CI MODE)');
      return true;
    }
    return false;
  }

  // ─────────────────────────────────────────────────────────────────────────────────────
  // FINGERPRINT COLLECTION
  // ─────────────────────────────────────────────────────────────────────────────────────

  /**
   * 🔍 Collect hardware fingerprint from current machine
   */
  async collectFingerprint(): Promise<HardwareFingerprint> {
    const fingerprint: HardwareFingerprint = {
      cpuId: await this.getCpuId(),
      cpuModel: os.cpus()[0]?.model || 'unknown',
      cpuCores: os.cpus().length,
      motherboardSerial: await this.getMotherboardSerial(),
      biosSerial: await this.getBiosSerial(),
      diskUUID: await this.getDiskUUID(),
      macAddresses: this.getMacAddresses(),
      hostname: os.hostname(),
      username: os.userInfo().username,
      platform: os.platform(),
      arch: os.arch(),
      totalMemory: os.totalmem(),
      gpuInfo: await this.getGpuInfo(),
    };

    this.currentFingerprint = fingerprint;
    return fingerprint;
  }

  /**
   * Get CPU ID (Windows specific)
   */
  private async getCpuId(): Promise<string> {
    try {
      if (os.platform() === 'win32') {
        const result = execSync('wmic cpu get processorid', {
          encoding: 'utf8',
          windowsHide: true,
        });
        const lines = result.trim().split('\n');
        return lines[1]?.trim() || 'unknown';
      } else if (os.platform() === 'linux') {
        const result = execSync("cat /proc/cpuinfo | grep 'Serial\\|model name' | head -2", {
          encoding: 'utf8',
        });
        return crypto.createHash('md5').update(result).digest('hex');
      } else if (os.platform() === 'darwin') {
        const result = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' });
        return crypto.createHash('md5').update(result).digest('hex');
      }
    } catch {
      // Fallback
    }
    return crypto
      .createHash('md5')
      .update(os.cpus()[0]?.model || 'unknown')
      .digest('hex');
  }

  /**
   * Get Motherboard Serial Number
   */
  private async getMotherboardSerial(): Promise<string> {
    try {
      if (os.platform() === 'win32') {
        const result = execSync('wmic baseboard get serialnumber', {
          encoding: 'utf8',
          windowsHide: true,
        });
        const lines = result.trim().split('\n');
        return lines[1]?.trim() || 'unknown';
      } else if (os.platform() === 'linux') {
        const result = execSync(
          'sudo dmidecode -s baseboard-serial-number 2>/dev/null || echo "unknown"',
          { encoding: 'utf8' }
        );
        return result.trim();
      }
    } catch {
      // Fallback
    }
    return 'unknown';
  }

  /**
   * Get BIOS Serial Number
   */
  private async getBiosSerial(): Promise<string> {
    try {
      if (os.platform() === 'win32') {
        const result = execSync('wmic bios get serialnumber', {
          encoding: 'utf8',
          windowsHide: true,
        });
        const lines = result.trim().split('\n');
        return lines[1]?.trim() || 'unknown';
      } else if (os.platform() === 'linux') {
        const result = execSync('sudo dmidecode -s bios-version 2>/dev/null || echo "unknown"', {
          encoding: 'utf8',
        });
        return result.trim();
      }
    } catch {
      // Fallback
    }
    return 'unknown';
  }

  /**
   * Get Disk UUID
   */
  private async getDiskUUID(): Promise<string> {
    try {
      if (os.platform() === 'win32') {
        const result = execSync('wmic diskdrive get serialnumber', {
          encoding: 'utf8',
          windowsHide: true,
        });
        const lines = result.trim().split('\n');
        return lines[1]?.trim() || 'unknown';
      } else if (os.platform() === 'linux') {
        const result = execSync('blkid -o value -s UUID /dev/sda1 2>/dev/null || echo "unknown"', {
          encoding: 'utf8',
        });
        return result.trim();
      } else if (os.platform() === 'darwin') {
        const result = execSync('diskutil info disk0 | grep "Disk / Partition UUID"', {
          encoding: 'utf8',
        });
        return result.split(':')[1]?.trim() || 'unknown';
      }
    } catch {
      // Fallback
    }
    return 'unknown';
  }

  /**
   * Get all MAC addresses
   */
  private getMacAddresses(): string[] {
    const interfaces = os.networkInterfaces();
    const macs: string[] = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      for (const addr of addrs) {
        if (addr.mac && addr.mac !== '00:00:00:00:00:00') {
          macs.push(addr.mac);
        }
      }
    }

    return [...new Set(macs)].sort();
  }

  /**
   * Get GPU information
   */
  private async getGpuInfo(): Promise<string> {
    try {
      if (os.platform() === 'win32') {
        const result = execSync('wmic path win32_VideoController get name', {
          encoding: 'utf8',
          windowsHide: true,
        });
        const gpuName = result.trim().split('\n')[1]?.trim() || 'unknown';

        // 🎮 SPECIAL RECOGNITION FOR USER'S HARDWARE
        if (gpuName.includes('4050') || gpuName.includes('NVIDIA')) {
          console.log(`[GENETIC-LOCK] 🎮 High-Performance GPU Detected: ${gpuName}`);
          console.log(`[GENETIC-LOCK] 🚀 Tensor Acceleration Enabled`);
        }

        return gpuName;
      }
    } catch {
      // Fallback
    }
    return 'unknown';
  }

  // ─────────────────────────────────────────────────────────────────────────────────────
  // FINGERPRINT HASHING
  // ─────────────────────────────────────────────────────────────────────────────────────

  /**
   * 🔐 Generate hash from fingerprint
   */
  generateHash(fingerprint: HardwareFingerprint): FingerprintHash {
    // Full hash - all components
    const fullData = JSON.stringify({
      cpuId: fingerprint.cpuId,
      cpuModel: fingerprint.cpuModel,
      motherboardSerial: fingerprint.motherboardSerial,
      biosSerial: fingerprint.biosSerial,
      diskUUID: fingerprint.diskUUID,
      macAddresses: fingerprint.macAddresses,
      hostname: fingerprint.hostname,
      platform: fingerprint.platform,
      arch: fingerprint.arch,
      totalMemory: fingerprint.totalMemory,
    });

    // Partial hash - stable components only (excludes MAC which can change)
    const partialData = JSON.stringify({
      cpuId: fingerprint.cpuId,
      cpuModel: fingerprint.cpuModel,
      motherboardSerial: fingerprint.motherboardSerial,
      biosSerial: fingerprint.biosSerial,
      diskUUID: fingerprint.diskUUID,
      platform: fingerprint.platform,
      arch: fingerprint.arch,
    });

    return {
      full: crypto.createHash('sha256').update(fullData).digest('hex'),
      partial: crypto.createHash('sha256').update(partialData).digest('hex'),
      timestamp: Date.now(),
      version: '1.0.0',
    };
  }

  /**
   * Generate machine ID (short unique identifier)
   */
  generateMachineId(fingerprint: HardwareFingerprint): string {
    const data = `${fingerprint.cpuId}-${fingerprint.motherboardSerial}-${fingerprint.diskUUID}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16).toUpperCase();
  }

  // ─────────────────────────────────────────────────────────────────────────────────────
  // VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────────────

  /**
   * 🔒 Initialize and lock to current hardware
   */
  async initialize(): Promise<boolean> {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                       ║
║   ██████╗ ███████╗███╗   ██╗███████╗████████╗██╗ ██████╗    ██╗      ██████╗  ██████╗██║
║  ██╔════╝ ██╔════╝████╗  ██║██╔════╝╚══██╔══╝██║██╔════╝    ██║     ██╔═══██╗██╔════╝██║
║  ██║  ███╗█████╗  ██╔██╗ ██║█████╗     ██║   ██║██║         ██║     ██║   ██║██║     ██║
║  ██║   ██║██╔══╝  ██║╚██╗██║██╔══╝     ██║   ██║██║         ██║     ██║   ██║██║     ╚═╝
║  ╚██████╔╝███████╗██║ ╚████║███████╗   ██║   ██║╚██████╗    ███████╗╚██████╔╝╚██████╗██╗
║   ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝ ╚═════╝    ╚══════╝ ╚═════╝  ╚═════╝╚═╝
║                                                                                       ║
║                    Hardware DNA Verification System                                   ║
║                                                                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
`);

    try {
      // 0. Check for Global Override (CI/CD)
      if (this.checkGlobalOverride()) {
        this.emit('initialized', { machineId: 'CI_RUNNER', hash: 'OVERRIDE' });
        return true;
      }

      // Collect fingerprint
      const fingerprint = await this.collectFingerprint();
      const hash = this.generateHash(fingerprint);
      const machineId = this.generateMachineId(fingerprint);

      console.log(`[GENETIC-LOCK] 🔍 Hardware fingerprint collected`);
      console.log(`   Machine ID: ${machineId}`);
      console.log(`   CPU: ${fingerprint.cpuModel}`);
      console.log(`   Platform: ${fingerprint.platform} ${fingerprint.arch}`);

      // Check for existing license
      const licenseValid = await this.verifyLicense();

      if (!licenseValid) {
        console.log(`[GENETIC-LOCK] ⚠️ No valid license found`);

        // First run - generate license request
        await this.generateLicenseRequest(fingerprint, hash, machineId);

        if (this.config.strictMode) {
          console.log(`[GENETIC-LOCK] ❌ Strict mode: Cannot run without license`);
          this.isLocked = true;
          this.emit('locked', { reason: 'no_license', machineId });
          return false;
        }
      }

      // Start periodic verification
      this.startPeriodicVerification();

      console.log(`[GENETIC-LOCK] ✅ Hardware lock initialized`);
      this.emit('initialized', { machineId, hash: hash.partial });

      return true;
    } catch (error) {
      console.error(`[GENETIC-LOCK] ❌ Initialization failed:`, error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * 🔑 Verify license file
   */
  async verifyLicense(): Promise<boolean> {
    try {
      const licensePath = path.resolve(this.config.licensePath);

      if (!fs.existsSync(licensePath)) {
        return false;
      }

      const encryptedData = fs.readFileSync(licensePath, 'utf8');
      const licenseData = this.decryptLicense(encryptedData);

      if (!licenseData) {
        return false;
      }

      // Verify license hasn't expired
      if (licenseData.expiresAt < Date.now()) {
        console.log(`[GENETIC-LOCK] ⚠️ License expired`);
        return false;
      }

      // Verify hardware fingerprint matches
      const currentFingerprint = await this.collectFingerprint();
      const currentHash = this.generateHash(currentFingerprint);

      if (licenseData.fingerprintHash !== currentHash.partial) {
        console.log(`[GENETIC-LOCK] ⚠️ Hardware mismatch detected`);
        this.handleViolation('hardware_mismatch');
        return false;
      }

      this.licenseData = licenseData;
      return true;
    } catch (error) {
      console.error(`[GENETIC-LOCK] License verification error:`, error);
      return false;
    }
  }

  /**
   * Decrypt license data
   */
  private decryptLicense(encryptedData: string): LicenseData | null {
    try {
      const key = this.config.encryptionKey || 'Aeterna-Prime-Genetic-Lock-Key-2024';
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        crypto.scryptSync(key, 'AeternaSalt', 32),
        Buffer.from(encryptedData.substring(0, 32), 'hex')
      );

      const authTag = Buffer.from(encryptedData.substring(32, 64), 'hex');
      decipher.setAuthTag(authTag);

      const encrypted = encryptedData.substring(64);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  /**
   * Encrypt license data
   */
  encryptLicense(licenseData: LicenseData): string {
    const key = this.config.encryptionKey || 'Aeterna-Prime-Genetic-Lock-Key-2024';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      crypto.scryptSync(key, 'AeternaSalt', 32),
      iv
    );

    let encrypted = cipher.update(JSON.stringify(licenseData), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + authTag.toString('hex') + encrypted;
  }

  /**
   * Generate license request file
   */
  private async generateLicenseRequest(
    fingerprint: HardwareFingerprint,
    hash: FingerprintHash,
    machineId: string
  ): Promise<void> {
    const request = {
      machineId,
      fingerprintHash: hash.partial,
      fingerprint: {
        cpuId: fingerprint.cpuId,
        cpuModel: fingerprint.cpuModel,
        motherboardSerial: fingerprint.motherboardSerial,
        platform: fingerprint.platform,
        arch: fingerprint.arch,
      },
      requestedAt: Date.now(),
      aeternaVersion: '1.0.0',
    };

    const requestPath = path.resolve('./.aeterna-license-request');
    fs.writeFileSync(requestPath, JSON.stringify(request, null, 2));

    console.log(`[GENETIC-LOCK] 📄 License request generated: ${requestPath}`);
    console.log(`   Send this file to activate Aeterna Prime`);
  }

  // ─────────────────────────────────────────────────────────────────────────────────────
  // PERIODIC VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────────────

  /**
   * Start periodic hardware verification
   */
  private startPeriodicVerification(): void {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }

    this.verificationInterval = setInterval(async () => {
      const isValid = await this.verify();

      if (!isValid) {
        this.handleViolation('periodic_check_failed');
      }
    }, this.config.checkInterval);
  }

  /**
   * 🔒 Verify current hardware matches license
   */
  async verify(): Promise<boolean> {
    if (this.isLocked) {
      return false;
    }

    try {
      const currentFingerprint = await this.collectFingerprint();
      const currentHash = this.generateHash(currentFingerprint);

      if (!this.licenseData) {
        return !this.config.strictMode;
      }

      // Check hash match
      if (currentHash.partial !== this.licenseData.fingerprintHash) {
        return false;
      }

      this.emit('verified');
      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────────────
  // VIOLATION HANDLING
  // ─────────────────────────────────────────────────────────────────────────────────────

  /**
   * 🚨 Handle security violation
   */
  private handleViolation(reason: string): void {
    this.violationCount++;

    console.log(`[GENETIC-LOCK] 🚨 VIOLATION DETECTED: ${reason}`);
    console.log(`   Violation count: ${this.violationCount}`);

    this.emit('violation', { reason, count: this.violationCount });

    switch (this.config.onViolation) {
      case 'warn':
        console.log(`[GENETIC-LOCK] ⚠️ Warning issued`);
        break;

      case 'disable':
        console.log(`[GENETIC-LOCK] 🔒 Aeterna disabled`);
        this.isLocked = true;
        this.emit('locked', { reason });
        break;

      case 'destroy':
        console.log(`[GENETIC-LOCK] 💀 Initiating self-destruct sequence...`);
        this.selfDestruct();
        break;
    }
  }

  /**
   * 💀 Self-destruct critical data
   */
  private selfDestruct(): void {
    // Clear all cached data
    this.currentFingerprint = null;
    this.licenseData = null;
    this.isLocked = true;

    // Clear any sensitive files
    const sensitiveFiles = ['./chronos-data', './knowledge', './.aeterna-license'];

    for (const file of sensitiveFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.rmSync(file, { recursive: true, force: true });
        }
      } catch {
        // Continue
      }
    }

    this.emit('destroyed');

    // Exit process
    setTimeout(() => process.exit(1), 1000);
  }

  // ─────────────────────────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────────────────────────

  /**
   * Check if system is locked
   */
  isSystemLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Get current license info
   */
  getLicenseInfo(): LicenseData | null {
    return this.licenseData;
  }

  /**
   * Get current fingerprint
   */
  getFingerprint(): HardwareFingerprint | null {
    return this.currentFingerprint;
  }

  /**
   * Stop verification
   */
  stop(): void {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════════════

let defaultLock: HardwareLock | null = null;

export function getHardwareLock(config?: Partial<HardwareLockConfig>): HardwareLock {
  if (!defaultLock) {
    defaultLock = new HardwareLock(config);
  }
  return defaultLock;
}

export function createHardwareLock(config?: Partial<HardwareLockConfig>): HardwareLock {
  return new HardwareLock(config);
}

export default HardwareLock;
