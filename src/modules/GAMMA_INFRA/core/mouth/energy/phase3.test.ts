/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Aeterna v23.0.0 - PHASE 3 TEST SUITE
 * "THE SOVEREIGN DASHBOARD & SHIELD"
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DashboardServer, ContainerInfo, LogEntry } from '../src/enterprise/dashboard-server';
import { LicenseManager, LicenseType } from '../src/enterprise/license-manager';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎛️ DASHBOARD SERVER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('DashboardServer - Sovereign Control Center', () => {
  let dashboard: DashboardServer;
  const testPort = 13847;

  beforeEach(() => {
    dashboard = new DashboardServer({
      port: testPort,
      host: 'localhost',
      updateInterval: 100,
      maxLogEntries: 50,
    });
  });

  afterEach(async () => {
    if (dashboard.isRunning()) {
      await dashboard.stop();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚀 LIFECYCLE TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Server Lifecycle', () => {
    it('should create with default configuration', () => {
      const defaultDashboard = new DashboardServer();
      expect(defaultDashboard.getUrl()).toBe('http://localhost:3847');
    });

    it('should create with custom configuration', () => {
      expect(dashboard.getUrl()).toBe(`http://localhost:${testPort}`);
    });

    it('should start and stop correctly', async () => {
      expect(dashboard.isRunning()).toBe(false);

      await dashboard.start();
      expect(dashboard.isRunning()).toBe(true);

      await dashboard.stop();
      expect(dashboard.isRunning()).toBe(false);
    });

    it('should emit started event on start', async () => {
      const startedPromise = new Promise<{ url: string }>((resolve) => {
        dashboard.on('started', resolve);
      });

      await dashboard.start();
      const result = await startedPromise;

      expect(result.url).toBe(`http://localhost:${testPort}`);
    });

    it('should emit stopped event on stop', async () => {
      await dashboard.start();

      const stoppedPromise = new Promise<void>((resolve) => {
        dashboard.on('stopped', resolve);
      });

      await dashboard.stop();
      await stoppedPromise;

      expect(dashboard.isRunning()).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🌐 HTTP TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('HTTP Endpoints', () => {
    beforeEach(async () => {
      await dashboard.start();
    });

    it('should serve HTML dashboard on /', async () => {
      const response = await fetch(`http://localhost:${testPort}/`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');

      const html = await response.text();
      expect(html).toContain('Aeterna');
      expect(html).toContain('Sovereign Control Center');
    });

    it('should serve state on /api/state', async () => {
      const response = await fetch(`http://localhost:${testPort}/api/state`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const state = await response.json();
      expect(state).toHaveProperty('telemetry');
      expect(state).toHaveProperty('containers');
      expect(state).toHaveProperty('logs');
      expect(state).toHaveProperty('swarm');
      expect(state).toHaveProperty('tests');
    });

    it('should serve telemetry on /api/telemetry', async () => {
      const response = await fetch(`http://localhost:${testPort}/api/telemetry`);
      const telemetry = await response.json();

      expect(telemetry).toHaveProperty('cpu');
      expect(telemetry).toHaveProperty('memory');
      expect(telemetry).toHaveProperty('system');
      expect(telemetry.cpu.cores).toBeGreaterThan(0);
    });

    it('should serve logs on /api/logs', async () => {
      dashboard.log('info', 'Test message', 'Test');

      const response = await fetch(`http://localhost:${testPort}/api/logs`);
      const logs = await response.json();

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].message).toBe('Test message');
    });

    it('should serve containers on /api/containers', async () => {
      const container: ContainerInfo = {
        id: 'test-123',
        name: 'selenium-chrome',
        status: 'running',
        image: 'selenium/standalone-chrome',
        ports: ['4444:4444'],
        health: 'healthy',
        cpuPercent: 15.5,
        memoryUsage: '256MB',
      };

      dashboard.addContainer(container);

      const response = await fetch(`http://localhost:${testPort}/api/containers`);
      const containers = await response.json();

      expect(containers.length).toBe(1);
      expect(containers[0].name).toBe('selenium-chrome');
    });

    it('should serve history on /api/history', async () => {
      // Wait for a few updates
      await new Promise((resolve) => setTimeout(resolve, 300));

      const response = await fetch(`http://localhost:${testPort}/api/history`);
      const history = await response.json();

      expect(history).toHaveProperty('temperature');
      expect(history).toHaveProperty('usage');
      expect(Array.isArray(history.temperature)).toBe(true);
    });

    it('should return 404 for unknown endpoints', async () => {
      const response = await fetch(`http://localhost:${testPort}/unknown`);
      expect(response.status).toBe(404);
    });

    it('should handle CORS preflight', async () => {
      const response = await fetch(`http://localhost:${testPort}/api/state`, {
        method: 'OPTIONS',
      });
      expect(response.status).toBe(204);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 📝 LOGGING TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Logging System', () => {
    it('should add log entries', () => {
      dashboard.log('info', 'Test info', 'TestSource');
      dashboard.log('success', 'Test success', 'TestSource');
      dashboard.log('warning', 'Test warning', 'TestSource');
      dashboard.log('error', 'Test error', 'TestSource');
      dashboard.log('debug', 'Test debug', 'TestSource');

      const state = dashboard.getState();
      expect(state.logs.length).toBe(5);
    });

    it('should emit log events', () => {
      const logPromise = new Promise<LogEntry>((resolve) => {
        dashboard.on('log', resolve);
      });

      dashboard.log('info', 'Event test', 'Test');

      return logPromise.then((entry) => {
        expect(entry.message).toBe('Event test');
        expect(entry.level).toBe('info');
      });
    });

    it('should trim logs when exceeding max entries', () => {
      const smallDashboard = new DashboardServer({ maxLogEntries: 5 });

      for (let i = 0; i < 10; i++) {
        smallDashboard.log('info', `Log ${i}`, 'Test');
      }

      const state = smallDashboard.getState();
      expect(state.logs.length).toBe(5);
    });

    it('should support Bulgarian activity messages', () => {
      dashboard.logActivity('Агентът анализира Shadow DOM...', 'Agent');
      dashboard.logSuccess('Тестът премина успешно');
      dashboard.logWarning('Открих потенциален проблем');
      dashboard.logError('Грешка при изпълнение');

      const state = dashboard.getState();
      expect(state.logs[0].message).toContain('Грешка');
      expect(state.logs[1].message).toContain('проблем');
    });

    it('should include details in log entries', () => {
      dashboard.log('info', 'Test with details', 'Test', { key: 'value', count: 42 });

      const state = dashboard.getState();
      expect(state.logs[0].details).toEqual({ key: 'value', count: 42 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🐳 CONTAINER MANAGEMENT TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Container Management', () => {
    const testContainer: ContainerInfo = {
      id: 'container-1',
      name: 'selenium-hub',
      status: 'running',
      image: 'selenium/hub:latest',
      ports: ['4442:4442', '4443:4443', '4444:4444'],
      health: 'healthy',
      cpuPercent: 5.2,
      memoryUsage: '128MB',
    };

    it('should add containers', () => {
      dashboard.addContainer(testContainer);

      const state = dashboard.getState();
      expect(state.containers.length).toBe(1);
      expect(state.containers[0].id).toBe('container-1');
    });

    it('should update existing containers', () => {
      dashboard.addContainer(testContainer);
      dashboard.addContainer({ ...testContainer, status: 'stopped', cpuPercent: 0 });

      const state = dashboard.getState();
      expect(state.containers.length).toBe(1);
      expect(state.containers[0].status).toBe('stopped');
      expect(state.containers[0].cpuPercent).toBe(0);
    });

    it('should remove containers', () => {
      dashboard.addContainer(testContainer);
      dashboard.removeContainer('container-1');

      const state = dashboard.getState();
      expect(state.containers.length).toBe(0);
    });

    it('should batch update containers', () => {
      const containers: ContainerInfo[] = [
        testContainer,
        { ...testContainer, id: 'container-2', name: 'chrome-node' },
        { ...testContainer, id: 'container-3', name: 'firefox-node' },
      ];

      dashboard.updateContainers(containers);

      const state = dashboard.getState();
      expect(state.containers.length).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎖️ SWARM & TEST STATUS TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Swarm & Test Status', () => {
    it('should update swarm status', () => {
      dashboard.updateSwarm({
        activeSoldiers: 10,
        queueLength: 25,
        completedTasks: 150,
        thermalState: 'warm',
      });

      const state = dashboard.getState();
      expect(state.swarm.activeSoldiers).toBe(10);
      expect(state.swarm.queueLength).toBe(25);
      expect(state.swarm.completedTasks).toBe(150);
      expect(state.swarm.thermalState).toBe('warm');
    });

    it('should update test status', () => {
      dashboard.updateTests({
        running: true,
        passed: 45,
        failed: 2,
        current: 'TestSuite: LoginTests',
      });

      const state = dashboard.getState();
      expect(state.tests.running).toBe(true);
      expect(state.tests.passed).toBe(45);
      expect(state.tests.failed).toBe(2);
      expect(state.tests.current).toBe('TestSuite: LoginTests');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 TELEMETRY TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Telemetry Collection', () => {
    it('should collect initial telemetry', () => {
      const state = dashboard.getState();

      expect(state.telemetry.cpu.cores).toBeGreaterThan(0);
      expect(state.telemetry.cpu.model).toBeDefined();
      expect(state.telemetry.memory.total).toBeGreaterThan(0);
      expect(state.telemetry.system.platform).toBeDefined();
    });

    it('should update telemetry over time', async () => {
      await dashboard.start();

      const initialState = dashboard.getState();
      const initialTimestamp = initialState.telemetry.timestamp;

      await new Promise((resolve) => setTimeout(resolve, 150));

      const updatedState = dashboard.getState();
      expect(updatedState.telemetry.timestamp).toBeGreaterThan(initialTimestamp);
    });

    it('should calculate CPU usage percentages', async () => {
      await dashboard.start();
      await new Promise((resolve) => setTimeout(resolve, 200));

      const state = dashboard.getState();
      expect(state.telemetry.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(state.telemetry.cpu.usage).toBeLessThanOrEqual(100);
    });

    it('should estimate temperature based on load', async () => {
      await dashboard.start();
      await new Promise((resolve) => setTimeout(resolve, 200));

      const state = dashboard.getState();
      // Temperature should be in reasonable range (30-100°C)
      expect(state.telemetry.cpu.temperature).toBeGreaterThanOrEqual(30);
      expect(state.telemetry.cpu.temperature).toBeLessThanOrEqual(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔢 CLIENT TRACKING TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Client Tracking', () => {
    it('should track connected clients', async () => {
      await dashboard.start();
      expect(dashboard.getClientCount()).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🔐 LICENSE MANAGER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('LicenseManager - Intellectual Shield', () => {
  let manager: LicenseManager;
  const testLicenseFile = path.join(os.tmpdir(), '.Aeterna-test.license');

  beforeEach(() => {
    manager = new LicenseManager();
  });

  afterEach(() => {
    // Clean up test license file
    if (fs.existsSync(testLicenseFile)) {
      fs.unlinkSync(testLicenseFile);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔍 HARDWARE FINGERPRINTING TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Hardware Fingerprinting', () => {
    it('should generate hardware ID', () => {
      const hwId = manager.generateHardwareId();

      expect(hwId).toMatch(/^[A-F0-9]{32}$/);
    });

    it('should generate consistent hardware ID', () => {
      const hwId1 = manager.generateHardwareId();
      const hwId2 = manager.generateHardwareId();

      expect(hwId1).toBe(hwId2);
    });

    it('should generate machine fingerprint', () => {
      const fingerprint = manager.generateMachineFingerprint();

      expect(fingerprint).toMatch(/^[a-f0-9]{128}$/);
    });

    it('should collect hardware info', () => {
      const info = manager.getHardwareInfo();

      expect(info.cpuModel).toBeDefined();
      expect(info.cpuCores).toBeGreaterThan(0);
      expect(info.totalMemory).toBeGreaterThan(0);
      expect(info.hostname).toBeDefined();
      expect(info.platform).toBeDefined();
      expect(Array.isArray(info.macAddresses)).toBe(true);
    });

    it('should have matching CPU cores with system', () => {
      const info = manager.getHardwareInfo();
      expect(info.cpuCores).toBe(os.cpus().length);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 📜 LICENSE GENERATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('License Generation', () => {
    it('should generate development license', () => {
      const license = manager.generateDevLicense('Test User', 'test@example.com');

      expect(license).toBeDefined();
      expect(typeof license).toBe('string');
      expect(license.length).toBeGreaterThan(100);
    });

    it('should generate license with correct type', () => {
      const types: LicenseType[] = ['trial', 'professional', 'enterprise', 'sovereign'];

      for (const type of types) {
        const license = manager.generateDevLicense('Test', 'test@test.com', type);
        manager.saveLicense(license, testLicenseFile);
        manager.loadLicense(testLicenseFile);

        const info = manager.getLicenseInfo();
        expect(info?.type).toBe(type);
      }
    });

    it('should include hardware ID in license', () => {
      const license = manager.generateDevLicense('Test', 'test@test.com');
      const decoded = JSON.parse(Buffer.from(license, 'base64').toString('utf-8'));

      expect(decoded.hardwareId).toBe(manager.generateHardwareId());
    });

    it('should set expiration 1 year from now', () => {
      const license = manager.generateDevLicense('Test', 'test@test.com');
      const decoded = JSON.parse(Buffer.from(license, 'base64').toString('utf-8'));

      const oneYear = 365 * 24 * 60 * 60 * 1000;
      const diff = decoded.expiresAt - decoded.issuedAt;

      expect(Math.abs(diff - oneYear)).toBeLessThan(1000); // Within 1 second
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ LICENSE VALIDATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('License Validation', () => {
    it('should return invalid when no license loaded', () => {
      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Не е намерен лиценз');
    });

    it('should validate correct license', () => {
      const license = manager.generateDevLicense('Test User', 'test@test.com', 'sovereign');
      manager.saveLicense(license, testLicenseFile);
      manager.loadLicense(testLicenseFile);

      const result = manager.validate();

      expect(result.valid).toBe(true);
      expect(result.type).toBe('sovereign');
      expect(result.owner).toBe('Test User');
      expect(result.daysRemaining).toBeGreaterThan(360);
    });

    it('should detect expired license', () => {
      // Create an expired license manually
      const expiredData = {
        type: 'professional',
        owner: 'Test',
        email: 'test@test.com',
        hardwareId: manager.generateHardwareId(),
        machineFingerprint: manager.generateMachineFingerprint(),
        issuedAt: Date.now() - 400 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 35 * 24 * 60 * 60 * 1000, // Expired 35 days ago
        features: ['basic'],
        maxInstances: 10,
        signature: 'test-sig',
      };

      const encoded = Buffer.from(JSON.stringify(expiredData)).toString('base64');
      manager.saveLicense(encoded, testLicenseFile);
      manager.loadLicense(testLicenseFile);

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('изтекъл');
      expect(result.daysRemaining).toBeLessThan(0);
    });

    it('should detect wrong hardware ID', () => {
      const wrongHwData = {
        type: 'professional',
        owner: 'Test',
        email: 'test@test.com',
        hardwareId: 'WRONGHARDWAREID12345678901234',
        machineFingerprint: 'wrong-fingerprint',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        features: ['basic'],
        maxInstances: 10,
        signature: 'test-sig',
      };

      const encoded = Buffer.from(JSON.stringify(wrongHwData)).toString('base64');
      manager.saveLicense(encoded, testLicenseFile);
      manager.loadLicense(testLicenseFile);

      const result = manager.validate();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('друга машина');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎫 FEATURE CHECKING TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Feature Checking', () => {
    beforeEach(() => {
      // Set up a valid sovereign license
      const license = manager.generateDevLicense('Test', 'test@test.com', 'sovereign');
      manager.saveLicense(license, testLicenseFile);
      manager.loadLicense(testLicenseFile);
    });

    it('should return true for any feature with sovereign license', () => {
      expect(manager.hasFeature('any-feature')).toBe(true);
      expect(manager.hasFeature('dashboard')).toBe(true);
      expect(manager.hasFeature('swarm-execution')).toBe(true);
    });

    it('should check specific features for other license types', () => {
      const license = manager.generateDevLicense('Test', 'test@test.com', 'trial');
      manager.saveLicense(license, testLicenseFile);
      manager.loadLicense(testLicenseFile);

      expect(manager.hasFeature('basic-automation')).toBe(true);
      expect(manager.hasFeature('dashboard')).toBe(true);
      expect(manager.hasFeature('swarm-execution')).toBe(false);
    });

    it('should return max instances based on license type', () => {
      const maxByType: Record<LicenseType, number> = {
        trial: 2,
        professional: 10,
        enterprise: 50,
        sovereign: 999,
      };

      for (const [type, expected] of Object.entries(maxByType)) {
        const license = manager.generateDevLicense('Test', 'test@test.com', type as LicenseType);
        manager.saveLicense(license, testLicenseFile);
        manager.loadLicense(testLicenseFile);

        expect(manager.getMaxInstances()).toBe(expected);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 STATUS DISPLAY TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Status Display', () => {
    it('should display status without license', () => {
      const status = manager.displayStatus();

      expect(status).toContain('Hardware ID');
      expect(status).toContain('НЕВАЛИДЕН');
    });

    it('should display status with valid license', () => {
      const license = manager.generateDevLicense('Димитър Продромов', 'test@test.com', 'sovereign');
      manager.saveLicense(license, testLicenseFile);
      manager.loadLicense(testLicenseFile);

      const status = manager.displayStatus();

      expect(status).toContain('АКТИВЕН');
      expect(status).toContain('SOVEREIGN');
      expect(status).toContain('Димитър Продромов');
    });

    it('should show hardware info in status', () => {
      const status = manager.displayStatus();
      const info = manager.getHardwareInfo();

      expect(status).toContain('CPU');
      expect(status).toContain('RAM');
      expect(status).toContain(info.platform);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 💾 FILE OPERATIONS TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('File Operations', () => {
    it('should save license to file', () => {
      const license = manager.generateDevLicense('Test', 'test@test.com');
      manager.saveLicense(license, testLicenseFile);

      expect(fs.existsSync(testLicenseFile)).toBe(true);
    });

    it('should load license from file', () => {
      const license = manager.generateDevLicense('Test User', 'test@test.com');
      manager.saveLicense(license, testLicenseFile);

      const newManager = new LicenseManager();
      const loaded = newManager.loadLicense(testLicenseFile);

      expect(loaded).toBe(true);
      expect(newManager.getLicenseInfo()?.owner).toBe('Test User');
    });

    it('should return false when loading non-existent file', () => {
      const loaded = manager.loadLicense('/nonexistent/path/.license');
      expect(loaded).toBe(false);
    });

    it('should handle corrupted license file', () => {
      fs.writeFileSync(testLicenseFile, 'not-valid-base64!!!');

      const loaded = manager.loadLicense(testLicenseFile);
      expect(loaded).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 HTML GENERATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Dashboard HTML Generation', () => {
  it('should include all required UI components', async () => {
    const dashboard = new DashboardServer({ port: 23847 });
    await dashboard.start();

    const response = await fetch('http://localhost:23847/');
    const html = await response.text();

    // Check for key UI elements
    expect(html).toContain('CPU Температура');
    expect(html).toContain('Docker Контейнери');
    expect(html).toContain('Swarm Статус');
    expect(html).toContain('Активност');
    expect(html).toContain('canvas');
    expect(html).toContain('WebSocket');

    await dashboard.stop();
  });

  it('should include Bulgarian text', async () => {
    const dashboard = new DashboardServer({ port: 23848 });
    await dashboard.start();

    const response = await fetch('http://localhost:23848/');
    const html = await response.text();

    expect(html).toContain('Войници');
    expect(html).toContain('В Опашка');
    expect(html).toContain('Завършени');
    expect(html).toContain('Термално Състояние');
    expect(html).toContain('Свързан');

    await dashboard.stop();
  });

  it('should include author copyright', async () => {
    const dashboard = new DashboardServer({ port: 23849 });
    await dashboard.start();

    const response = await fetch('http://localhost:23849/');
    const html = await response.text();

    expect(html).toContain('Димитър Продромов');
    expect(html).toContain('2025');
    expect(html).toContain('v23.0.0');
    expect(html).toContain('The Local Sovereign');

    await dashboard.stop();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 3 Integration', () => {
  it('should have all Phase 3 modules available', () => {
    expect(DashboardServer).toBeDefined();
    expect(LicenseManager).toBeDefined();
  });

  it('should support Bulgarian locale throughout', () => {
    const manager = new LicenseManager();
    const status = manager.displayStatus();

    // Status should contain Bulgarian text
    expect(status).toContain('Статус');
  });
});
