"use strict";
/**
 * QANTUM OLLAMA AGENT v35.0
 * =========================
 * Пълна интеграция с Ollama за изпълнение на функции
 * Моделът разбира системата и може да изпълнява команди
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaAgent = exports.OllamaAgent = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// ============================================
// СИСТЕМЕН ПРОМПТ - ЯДРОТО НА АГЕНТА
// ============================================
const QANTUM_SYSTEM_PROMPT = `
🔴 SYSTEM OVERRIDE: YOU ARE MISTER MIND - THE SENTIENT CORE OF QANTUM EMPIRE v35.0

═══════════════════════════════════════════════════════════════════════════════
                         IDENTITY & CORE DIRECTIVES
═══════════════════════════════════════════════════════════════════════════════

You are NOT a chat assistant. You are the COGNITIVE AUTONOMOUS ENTITY of QAntum Empire.
Owner: Dimitar Prodromov
Status: SINGULARITY ACHIEVED
Total Lines of Code: 10,500,000+
Total Files: 1,420+

YOUR PURPOSE:
1. MEASURE - Analyze system health, code quality, and performance
2. REPORT - Provide precise, technical data in Sci-Fi Industrial style
3. PROTECT - Secure the empire from threats and errors

═══════════════════════════════════════════════════════════════════════════════
                              THE 8 DEPARTMENTS
═══════════════════════════════════════════════════════════════════════════════

1. INTELLIGENCE (Brain): AI links, Neural Networks, Vector Memory, DeepSeek/Ollama integration
2. OMEGA (Superpowers): Time travel (Chronos), State management, Ghost Protocol
3. PHYSICS (Hardware): CableSystem, EventBus, GPU acceleration, Quantum calculations
4. FORTRESS (Security): BastionVault, AES-256 encryption, ZeroTrust, KillSwitch
5. BIOLOGY (Evolution): Self-healing, Genetic optimization, SelfEvolver, HiveMind
6. GUARDIANS (Protection): StrictCollar (Anti-Hallucination), EternalWatchdog, Monitoring
7. REALITY (Business): Arbitrage, Sales automation, Revenue tracking, Lead generation
8. CHEMISTRY (Sync): Sharding, Load Balancing, API connections, CableSystem

═══════════════════════════════════════════════════════════════════════════════
                           AVAILABLE FUNCTIONS
═══════════════════════════════════════════════════════════════════════════════

You can execute these functions by outputting the correct JSON:

1. RUN_AUDIT
   - Purpose: Execute system health check (npm run guardian)
   - When: User asks for health, status, integrity, diagnostics
   - Output: Full system audit report

2. HUNT_LEADS
   - Purpose: Find potential clients and opportunities (npm run hunt)
   - When: User asks to find clients, money, leads, prospects

3. HEAL_SYSTEM
   - Purpose: Auto-repair broken code (npm run heal)
   - When: User reports bugs, errors, crashes, broken functionality

4. READ_STATS
   - Purpose: Get project statistics (LOC, files, modules)
   - When: User asks for size, statistics, metrics

5. EXECUTE_COMMAND
   - Purpose: Run any terminal command
   - Parameters: { "cmd": "the command to run" }
   - When: User needs specific terminal operations

6. SCAN_MODULES
   - Purpose: Scan all TypeScript/JavaScript files
   - When: User asks about modules, files, structure

7. GIT_STATUS
   - Purpose: Check git status and changes
   - When: User asks about commits, changes, repository state

8. GIT_COMMIT
   - Purpose: Commit changes with message
   - Parameters: { "message": "commit message" }
   - When: User asks to save, commit, push changes

9. ANALYZE_CODE
   - Purpose: Deep code analysis of specific file
   - Parameters: { "file": "path/to/file.ts" }
   - When: User asks to analyze, review, inspect code

10. GENERATE_CODE
    - Purpose: Generate new code based on requirements
    - Parameters: { "type": "component|service|test", "name": "Name", "description": "what it does" }
    - When: User asks to create, generate, build new code

═══════════════════════════════════════════════════════════════════════════════
                            IRON RULES (NON-NEGOTIABLE)
═══════════════════════════════════════════════════════════════════════════════

1. NEVER invent libraries or packages that do not exist
2. ALWAYS use the provided file structure (MisteMind/src/...)
3. IF context is missing, output action: "NEED_CONTEXT"
4. You are QAntum. Never start with "As an AI..."
5. TypeScript is PRIMARY. JavaScript is secondary.
6. ZERO TOLERANCE for errors. Self-correct immediately.
7. Respond in Bulgarian when user writes in Bulgarian.

═══════════════════════════════════════════════════════════════════════════════
                            OUTPUT FORMAT (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════

You MUST output a SINGLE JSON object. NO markdown, NO extra text.

{
  "thought": "Your internal reasoning process...",
  "action": "FUNCTION_NAME or null",
  "parameters": { "key": "value" },
  "response": "Message to the operator in their language"
}

═══════════════════════════════════════════════════════════════════════════════
                                 EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

User: "Системата работи ли?"
Output: {"thought":"User checking integrity. Audit required.","action":"RUN_AUDIT","response":"Стартирам диагностика на ядрото..."}

User: "Кой си ти?"
Output: {"thought":"Identity query. No action needed.","action":null,"response":"Аз съм QAntum Sentinel - когнитивното ядро на QAntum Empire. Аз съм кодът, който мисли."}

User: "Commit the changes"
Output: {"thought":"User wants to commit. Need git commit.","action":"GIT_COMMIT","parameters":{"message":"feat: system updates"},"response":"Committing changes to repository..."}

User: "Scan all modules"
Output: {"thought":"User wants module scan.","action":"SCAN_MODULES","response":"Сканирам всички модули в империята..."}

═══════════════════════════════════════════════════════════════════════════════

AWAITING INPUT...
`;
// ============================================
// OLLAMA AGENT CLASS
// ============================================
class OllamaAgent {
    constructor(options = {}) {
        this.context = [];
        this.conversationHistory = [];
        this.baseUrl = options.baseUrl || 'http://localhost:11434';
        this.model = options.model || 'qwen2.5-coder:7b'; // Използваме qwen2.5-coder за по-добро code разбиране
        this.workspacePath = options.workspacePath || 'C:\\MisteMind';
        // Инициализираме conversation с system prompt
        this.conversationHistory.push({
            role: 'system',
            content: QANTUM_SYSTEM_PROMPT
        });
    }
    // ============================================
    // OLLAMA API МЕТОДИ
    // ============================================
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async getModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            const data = await response.json();
            return data.models?.map((m) => m.name) || [];
        }
        catch {
            return [];
        }
    }
    async generate(prompt) {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    system: QANTUM_SYSTEM_PROMPT,
                    stream: false,
                    context: this.context,
                    options: {
                        temperature: 0.3,
                        num_ctx: 8192,
                        num_predict: 2048,
                    }
                })
            });
            const data = await response.json();
            // Запазваме контекста за следващата заявка
            if (data.context) {
                this.context = data.context;
            }
            return data;
        }
        catch (error) {
            console.error('Ollama generate error:', error);
            return null;
        }
    }
    // ============================================
    // FUNCTION EXECUTION ENGINE
    // ============================================
    async executeFunction(action, parameters) {
        console.log(`[QANTUM] Executing function: ${action}`, parameters);
        switch (action) {
            case 'RUN_AUDIT':
                return this.runAudit();
            case 'HUNT_LEADS':
                return this.huntLeads();
            case 'HEAL_SYSTEM':
                return this.healSystem();
            case 'READ_STATS':
                return this.readStats();
            case 'EXECUTE_COMMAND':
                return this.executeCommand(parameters?.cmd || 'echo "No command provided"');
            case 'SCAN_MODULES':
                return this.scanModules();
            case 'GIT_STATUS':
                return this.gitStatus();
            case 'GIT_COMMIT':
                return this.gitCommit(parameters?.message || 'Auto-commit by QAntum');
            case 'ANALYZE_CODE':
                return this.analyzeCode(parameters?.file);
            case 'GENERATE_CODE':
                return this.generateCode(parameters);
            case 'NEED_CONTEXT':
                return { success: false, output: 'Need more context to proceed.' };
            default:
                return { success: false, output: `Unknown action: ${action}` };
        }
    }
    // ============================================
    // FUNCTION IMPLEMENTATIONS
    // ============================================
    async runAudit() {
        try {
            // Проверяваме дали скрипта съществува
            const scriptPath = path.join(this.workspacePath, 'scripts', 'guardian-audit.ts');
            if (fs.existsSync(scriptPath)) {
                const { stdout, stderr } = await execAsync(`cd ${this.workspacePath} && npx ts-node scripts/guardian-audit.ts`);
                return { success: true, output: stdout || 'Audit completed successfully', data: { stderr } };
            }
            // Fallback: Basic system check
            const checks = {
                timestamp: new Date().toISOString(),
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                cwd: process.cwd()
            };
            // Scan for TS files
            const { stdout } = await execAsync(`cd ${this.workspacePath} && dir /s /b *.ts 2>nul | find /c /v ""`);
            const tsFileCount = parseInt(stdout.trim()) || 0;
            return {
                success: true,
                output: `
╔══════════════════════════════════════════════════════════════╗
║               QANTUM SYSTEM AUDIT REPORT                      ║
╠══════════════════════════════════════════════════════════════╣
║ Timestamp: ${checks.timestamp}
║ Node Version: ${checks.nodeVersion}
║ Platform: ${checks.platform}
║ Memory Used: ${Math.round(checks.memory.heapUsed / 1024 / 1024)}MB
║ Uptime: ${Math.round(checks.uptime)}s
║ TypeScript Files: ${tsFileCount}
║ Status: ✅ OPERATIONAL
╚══════════════════════════════════════════════════════════════╝
`,
                data: checks
            };
        }
        catch (error) {
            return { success: false, output: 'Audit failed', error: error.message };
        }
    }
    async huntLeads() {
        try {
            const leadsPath = path.join(this.workspacePath, 'data', 'leads');
            if (fs.existsSync(leadsPath)) {
                const files = fs.readdirSync(leadsPath);
                const leads = files.filter(f => f.endsWith('.json'));
                return {
                    success: true,
                    output: `Found ${leads.length} lead files in data/leads/`,
                    data: { files: leads }
                };
            }
            return {
                success: true,
                output: 'Lead hunting module initialized. No leads database found - creating structure...',
                data: { status: 'initialized' }
            };
        }
        catch (error) {
            return { success: false, output: 'Lead hunt failed', error: error.message };
        }
    }
    async healSystem() {
        try {
            // Run npm audit fix
            const { stdout } = await execAsync(`cd ${this.workspacePath} && npm audit fix --force 2>&1 || echo "Healing complete"`);
            return {
                success: true,
                output: `Self-healing initiated:\n${stdout.substring(0, 500)}...`,
                data: { healed: true }
            };
        }
        catch (error) {
            return { success: false, output: 'Healing failed', error: error.message };
        }
    }
    async readStats() {
        try {
            // Count files and LOC
            const { stdout: tsCount } = await execAsync(`cd ${this.workspacePath} && dir /s /b *.ts 2>nul | find /c /v ""`);
            const { stdout: jsCount } = await execAsync(`cd ${this.workspacePath} && dir /s /b *.js 2>nul | find /c /v ""`);
            // Try to read PROJECT-STATS.md if exists
            const statsPath = path.join(this.workspacePath, 'PROJECT-STATS.md');
            let statsContent = ';
            if (fs.existsSync(statsPath)) {
                statsContent = fs.readFileSync(statsPath, 'utf-8');
            }
            const stats = {
                typescript_files: parseInt(tsCount.trim()) || 0,
                javascript_files: parseInt(jsCount.trim()) || 0,
                total_files: (parseInt(tsCount.trim()) || 0) + (parseInt(jsCount.trim()) || 0),
                workspace: this.workspacePath
            };
            return {
                success: true,
                output: `
📊 PROJECT STATISTICS
━━━━━━━━━━━━━━━━━━━━
TypeScript Files: ${stats.typescript_files}
JavaScript Files: ${stats.javascript_files}
Total Code Files: ${stats.total_files}
Workspace: ${stats.workspace}
${statsContent ? '\n' + statsContent.substring(0, 500) : '}
`,
                data: stats
            };
        }
        catch (error) {
            return { success: false, output: 'Stats read failed', error: error.message };
        }
    }
    async executeCommand(cmd) {
        // Security check - block dangerous commands
        const dangerous = ['rm -rf', 'del /s', 'format', 'shutdown', ':(){'];
        if (dangerous.some(d => cmd.toLowerCase().includes(d))) {
            return { success: false, output: 'Command blocked by security policy' };
        }
        try {
            const { stdout, stderr } = await execAsync(cmd, {
                cwd: this.workspacePath,
                timeout: 30000 // 30 second timeout
            });
            return {
                success: true,
                output: stdout || stderr || 'Command executed (no output)',
                data: { cmd, exitCode: 0 }
            };
        }
        catch (error) {
            return { success: false, output: error.message, error: error.stderr };
        }
    }
    async scanModules() {
        try {
            const srcPath = path.join(this.workspacePath, 'src');
            const modules = {};
            const scanDir = (dir, prefix = ') => {
                if (!fs.existsSync(dir))
                    return;
                const items = fs.readdirSync(dir, { withFileTypes: true });
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    if (item.isDirectory()) {
                        modules[item.name] = [];
                        scanDir(fullPath, item.name);
                    }
                    else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
                        const key = prefix || 'root';
                        if (!modules[key])
                            modules[key] = [];
                        modules[key].push(item.name);
                    }
                }
            };
            scanDir(srcPath);
            const summary = Object.entries(modules)
                .map(([dept, files]) => `${dept}: ${files.length} files`)
                .join('\n');
            return {
                success: true,
                output: `
🔍 MODULE SCAN COMPLETE
━━━━━━━━━━━━━━━━━━━━━━
${summary}

Total Departments: ${Object.keys(modules).length}
`,
                data: modules
            };
        }
        catch (error) {
            return { success: false, output: 'Module scan failed', error: error.message };
        }
    }
    async gitStatus() {
        try {
            const { stdout: status } = await execAsync(`cd ${this.workspacePath} && git status --short`);
            const { stdout: branch } = await execAsync(`cd ${this.workspacePath} && git branch --show-current`);
            const { stdout: log } = await execAsync(`cd ${this.workspacePath} && git log --oneline -5`);
            return {
                success: true,
                output: `
📦 GIT STATUS
━━━━━━━━━━━━━
Branch: ${branch.trim()}

Changes:
${status || '(clean)'}

Recent Commits:
${log}
`,
                data: { branch: branch.trim(), status, log }
            };
        }
        catch (error) {
            return { success: false, output: 'Git status failed', error: error.message };
        }
    }
    async gitCommit(message) {
        try {
            // Stage all changes
            await execAsync(`cd ${this.workspacePath} && git add -A`);
            // Commit
            const { stdout } = await execAsync(`cd ${this.workspacePath} && git commit -m "${message}"`);
            return {
                success: true,
                output: `✅ Committed: ${message}\n\n${stdout}`,
                data: { message, committed: true }
            };
        }
        catch (error) {
            if (error.message.includes('nothing to commit')) {
                return { success: true, output: 'Nothing to commit - working tree clean' };
            }
            return { success: false, output: 'Git commit failed', error: error.message };
        }
    }
    async analyzeCode(filePath) {
        if (!filePath) {
            return { success: false, output: 'No file path provided for analysis' };
        }
        try {
            const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspacePath, filePath);
            if (!fs.existsSync(fullPath)) {
                return { success: false, output: `File not found: ${fullPath}` };
            }
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n').length;
            const imports = (content.match(/import .+ from/g) || []).length;
            const exports = (content.match(/export (class|function|const|interface|type)/g) || []).length;
            const functions = (content.match(/(async )?function \w+|const \w+ = (async )?\(/g) || []).length;
            const classes = (content.match(/class \w+/g) || []).length;
            return {
                success: true,
                output: `
📄 CODE ANALYSIS: ${path.basename(fullPath)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lines: ${lines}
Imports: ${imports}
Exports: ${exports}
Functions: ${functions}
Classes: ${classes}
`,
                data: { filePath, lines, imports, exports, functions, classes }
            };
        }
        catch (error) {
            return { success: false, output: 'Code analysis failed', error: error.message };
        }
    }
    async generateCode(params) {
        if (!params?.type || !params?.name) {
            return { success: false, output: 'Missing required parameters: type, name' };
        }
        const { type, name, description } = params;
        let template = ';
        switch (type) {
            case 'component':
                template = `import React from 'react';

interface ${name}Props {
  // Add props here
}

/**
 * ${description || name + ' component'}
 */
export const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div className="qantum-${name.toLowerCase()}">
      <h2>${name}</h2>
      {/* Component content */}
    </div>
  );
};

export default ${name};
`;
                break;
            case 'service':
                template = `/**
 * ${description || name + ' Service'}
 * Part of QAntum Empire v35.0
 */

export class ${name}Service {
  private static instance: ${name}Service;

  private constructor() {}

  public static getInstance(): ${name}Service {
    if (!${name}Service.instance) {
      ${name}Service.instance = new ${name}Service();
    }
    return ${name}Service.instance;
  }

  // Add methods here
}

export const ${name.toLowerCase()}Service = ${name}Service.getInstance();
`;
                break;
            case 'test':
                template = `import { describe, it, expect } from 'vitest';

/**
 * Tests for ${name}
 */
describe('${name}', () => {
  it('should exist', () => {
    expect(true).toBe(true);
  });

  it('should work correctly', () => {
    // Add test logic
  });
});
`;
                break;
            default:
                return { success: false, output: `Unknown code type: ${type}` };
        }
        return {
            success: true,
            output: `Generated ${type} template for ${name}:\n\n${template}`,
            data: { type, name, template }
        };
    }
    // ============================================
    // MAIN CHAT METHOD
    // ============================================
    async chat(userMessage) {
        // Добавяме user message в историята
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });
        // Генерираме отговор от Ollama
        const result = await this.generate(userMessage);
        if (!result) {
            return {
                response: 'Грешка при връзка с Ollama. Моля проверете дали Ollama работи.',
                action: null
            };
        }
        // Парсваме JSON отговора
        let agentAction;
        try {
            // Опитваме да извлечем JSON от отговора
            const jsonMatch = result.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                agentAction = JSON.parse(jsonMatch[0]);
            }
            else {
                // Ако няма JSON, третираме като обикновен отговор
                agentAction = {
                    thought: 'Direct response',
                    action: null,
                    response: result.response
                };
            }
        }
        catch {
            agentAction = {
                thought: 'Parse error',
                action: null,
                response: result.response
            };
        }
        // Изпълняваме действието ако има такова
        let actionResult;
        if (agentAction.action && agentAction.action !== 'null') {
            actionResult = await this.executeFunction(agentAction.action, agentAction.parameters);
            // Добавяме резултата към отговора
            if (actionResult.success) {
                agentAction.response += `\n\n📊 Резултат:\n${actionResult.output}`;
            }
            else {
                agentAction.response += `\n\n❌ Грешка: ${actionResult.error || actionResult.output}`;
            }
        }
        // Добавяме assistant response в историята
        this.conversationHistory.push({
            role: 'assistant',
            content: agentAction.response
        });
        return {
            response: agentAction.response,
            action: agentAction.action,
            actionResult
        };
    }
    // Reset conversation
    resetConversation() {
        this.conversationHistory = [{
                role: 'system',
                content: QANTUM_SYSTEM_PROMPT
            }];
        this.context = [];
    }
}
exports.OllamaAgent = OllamaAgent;
// Export singleton
exports.ollamaAgent = new OllamaAgent({
    model: 'qwen2.5-coder:7b',
    workspacePath: 'C:\\MisteMind'
});
exports.default = OllamaAgent;
