/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🚀 B2B AGENCY RUNNER — ПЕЧАТНИЦАТА ЗА ПАРИ
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * AGENCY_MODE: Впряга DeepSeek-v3 да генерира Value Bombs и Sales Pitches
 * за B2B клиенти. Без крипто, без trading — чисто AI-powered lead gen.
 * 
 * Usage: npx ts-node qantum/b2b-agency-runner.ts
 * 
 * @author Димитър Продромов / Mister Mind
 * @version 1.0.0
 */

import { OllamaManager } from '../ai/OllamaManager';
import { ValueBombGenerator } from '../src/finance/ValueBombGenerator';
import { AutonomousSalesForce } from '../src/reality/AutonomousSalesForce';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// TARGET PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

interface B2BTarget {
    name: string;
    company: string;
    domain: string;        // за ValueBombGenerator.generate(domain, company)
    role: string;
    painPoint: string;
    phone?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function igniteB2BAgency() {
    console.clear();
    console.log(`
🚀 ═══════════════════════════════════════════════════════════════════════════════
   QANTUM PRIME — B2B AGENCY MODE
   ─────────────────────────────────────────────────────────────────────────────
   "Крипто арбитражът изисква война с Уолстрийт. Тук воюваме с нормални бизнеси,
    а ние имаме AGI оръжие."
═══════════════════════════════════════════════════════════════════════════════
    `);

    // 1. Инициализиране на Мозъка (LLM) — Singleton pattern
    const llm = OllamaManager.getInstance();
    console.log("🧠 Core Intelligence [OllamaManager] Linked.");

    // 2. Инициализиране на Бизнес Модулите — Singleton pattern
    const valueBombGen = ValueBombGenerator.getInstance();
    console.log("💣 ValueBombGenerator Online.");

    // AutonomousSalesForce приема (llm, valueBombGen) в конструктора
    const salesForce = new AutonomousSalesForce(llm, valueBombGen);
    console.log("🎯 AutonomousSalesForce Armed.");

    // 3. Таргети (ръчно засега, утре — скрапер)
    const targets: B2BTarget[] = [
        { 
            name: "Иван Иванов", 
            company: "TechSolutions BG", 
            domain: "techsolutions.bg",
            role: "CEO", 
            painPoint: "Трудно намиране на B2B клиенти в LinkedIn"
        },
        { 
            name: "Мария Георгиева", 
            company: "Prime Real Estate", 
            domain: "primerealestate.bg",
            role: "Основател", 
            painPoint: "Нужда от качествено видео съдържание за луксозни имоти"
        }
    ];

    console.log(`\n🎯 Намерени ${targets.length} таргета.\n`);

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'dashboard', 'b2b-pitches');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const target of targets) {
        console.log(`\n⚡ ═══ ${target.company} (${target.name}, ${target.role}) ═══`);
        
        // A) ValueBombGenerator.generate(domain, companyName) → ValueBomb обект
        console.log(`💣 Генериране на Value Bomb за ${target.domain}...`);
        const valueBomb = await valueBombGen.generate(target.domain, target.company);

        // B) AutonomousSalesForce.craftOutreachMessage(prospect, valueBombContent)
        console.log(`📝 Генериране на Sales Pitch...`);
        const pitchMessage = await salesForce.craftOutreachMessage(
            { 
                name: target.name, 
                company: target.company, 
                role: target.role, 
                painPoint: target.painPoint 
            },
            valueBomb.markdownContent || valueBomb.executiveSummary || 'Value Bomb Generated'
        );

        // C) Запазване в папка
        const safeCompanyName = target.company.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const timestamp = new Date().toISOString().split('T')[0];
        
        // Pitch съобщение
        const pitchFile = path.join(outputDir, `${safeCompanyName}_pitch_${timestamp}.txt`);
        fs.writeFileSync(pitchFile, [
            `To: ${target.name} (${target.role} @ ${target.company})`,
            `Domain: ${target.domain}`,
            `Pain Point: ${target.painPoint}`,
            `Generated: ${new Date().toISOString()}`,
            ``,
            `══════ OUTREACH MESSAGE ══════`,
            ``,
            pitchMessage,
            ``,
            `══════ VALUE BOMB (SUMMARY) ══════`,
            ``,
            `ID: ${valueBomb.id}`,
            `Estimated Value: $${valueBomb.totalEstimatedValue?.toLocaleString() || 'N/A'}`,
            `Pricing Tier: ${valueBomb.pricingTier || 'N/A'}`,
            `Sections: ${valueBomb.sections?.length || 0}`,
            ``,
            valueBomb.executiveSummary || '',
            ``,
            `══════ CALL TO ACTION ══════`,
            ``,
            valueBomb.callToAction || '',
        ].join('\n'));

        // Value Bomb MD файл (пълен)
        if (valueBomb.markdownContent) {
            const bombFile = path.join(outputDir, `${safeCompanyName}_valuebomb_${timestamp}.md`);
            fs.writeFileSync(bombFile, valueBomb.markdownContent);
        }
        
        console.log(`✅ ${target.company} — ГОТОВО!`);
        console.log(`   📁 Pitch: ${pitchFile}`);
        console.log(`   💣 Bomb ID: ${valueBomb.id}`);
        console.log('─'.repeat(60));
    }

    console.log(`
🔥 ═══════════════════════════════════════════════════════════════════════════════
   ВСИЧКИ ТАРГЕТИ ОБРАБОТЕНИ!
   ─────────────────────────────────────────────────────────────────────────────
   📁 Провери: ${outputDir}
   
   Следващи стъпки:
   1. Прегледай pitch файловете
   2. Копирай съобщенията → LinkedIn / Email
   3. Когато отговорят → пусни linkedin-carousel-generator.html
   4. Затвори 2 клиента → автоматизирай изпращането
═══════════════════════════════════════════════════════════════════════════════
    `);
}

igniteB2BAgency().catch(err => {
    console.error('❌ B2B Agency Runner Error:', err);
    process.exit(1);
});
