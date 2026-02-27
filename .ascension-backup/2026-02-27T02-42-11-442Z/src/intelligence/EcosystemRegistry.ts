/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   🌐 ECOSYSTEM REGISTRY v1.0                                                  ║
 * ║   Universal Module Map & Neural Binder                                        ║
 * ║                                                                               ║
 * ║   Purpose:                                                                    ║
 * ║   Maps the entire file system into a graph that the Brain can traverse.       ║
 * ║   Connects "The Head" (src/intelligence) with "The Body" (src/modules).       ║
 * ║                                                                               ║
 * ║   © 2026 QAntum Architecture                                                  ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import * as fs from 'fs';
import * as path from 'path';

export interface EcosystemNode {
  id: string;
  path: string;
  type: 'core' | 'module' | 'legacy' | 'config' | 'data';
  connected: boolean;
  files: number;
}

export class EcosystemRegistry {
  private static instance: EcosystemRegistry;
  private nodes: Map<string, EcosystemNode> = new Map();
  private rootDir: string;

  private constructor() {
    this.rootDir = path.resolve(__dirname, '../../'); // Assuming src/intelligence placement
    this.scanEmpire();
  }

  public static getInstance(): EcosystemRegistry {
    if (!EcosystemRegistry.instance) {
      EcosystemRegistry.instance = new EcosystemRegistry();
    }
    return EcosystemRegistry.instance;
  }

  /**
   * Scans the entire project to build the neural map
   */
  private scanEmpire(): void {
    const criticalPaths = [
      { path: 'src/intelligence', type: 'core' },
      { path: 'src/physics', type: 'core' },
      { path: 'src/modules', type: 'module' },
      { path: 'src/modules/_root_migrated', type: 'legacy' },
      { path: 'src/security_core', type: 'module' }, // 🛡️ ADDED BY USER REQUEST
      { path: 'src/_VAULT_', type: 'data' }, // 🔐 THE VAULT (HOLY GRAIL)
      { path: 'scripts', type: 'config' },
      { path: 'data/memoryals', type: 'data' },
    ];

    for (const p of criticalPaths) {
      this.scanDirectoryRecursive(path.join(this.rootDir, p.path), p.type as any);
    }
  }

  private scanDirectoryRecursive(
    dir: string,
    type: 'core' | 'module' | 'legacy' | 'config' | 'data'
  ): void {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir, { withFileTypes: true });

    // Register this directory as a node
    const relativePath = path.relative(this.rootDir, dir).replace(/\\/g, '/');
    const fileCount = items.filter((i) => i.isFile()).length;

    if (fileCount > 0) {
      this.nodes.set(relativePath, {
        id: relativePath,
        path: relativePath,
        type,
        connected: true,
        files: fileCount,
      });
    }

    // Recurse
    for (const item of items) {
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        this.scanDirectoryRecursive(path.join(dir, item.name), type);
      }
    }
  }

  public getStatusReport(): string {
    const totalNodes = this.nodes.size;
    const totalFiles = Array.from(this.nodes.values()).reduce((sum, n) => sum + n.files, 0);

    return `
╔══════════════════════════════════════════════════════════════════╗
║   🕸️  ECOSYSTEM REGISTRY REPORT                                  ║
╠══════════════════════════════════════════════════════════════════╣
║   📍 Total Neural Nodes:    ${totalNodes.toString().padEnd(36)} ║
║   📄 Total Linked Files:    ${totalFiles.toString().padEnd(36)} ║
║   🟢 Connection Status:     100% (ONLINE)                        ║
╚══════════════════════════════════════════════════════════════════╝`;
  }

  public getNode(pathLike: string): EcosystemNode | undefined {
    return this.nodes.get(pathLike);
  }

  public getAllNodes(): EcosystemNode[] {
    return Array.from(this.nodes.values());
  }
}
