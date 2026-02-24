// src/reality/AutonomousSalesForce.ts

import { OllamaManager } from '../../ai/OllamaManager';
import { ValueBombGenerator } from '../finance/ValueBombGenerator';

interface ProspectProfile {
    name: string;
    company: string;
    role: string;
    painPoint: string;
}

export class AutonomousSalesForce {
    private llm: OllamaManager;
    private valueBombGen: ValueBombGenerator;

    constructor(llm: OllamaManager, valueBombGen: ValueBombGenerator) {
        this.llm = llm;
        this.valueBombGen = valueBombGen;
    }

    async craftOutreachMessage(prospect: ProspectProfile, valueBombContent: string): Promise<string> {
        console.log(`[AutonomousSalesForce] Crafting pitch for ${prospect.name}...`);

        const prompt = `
            Ти си Elite B2B Sales Copywriter.
            Задача: Напиши студено LinkedIn съобщение (или имейл).
            
            До: ${prospect.name} (${prospect.role} в ${prospect.company}).
            Pain Point: ${prospect.painPoint}
            Offer: Вече сме генерирали безплатно решение за тях (Value Bomb).
            
            Съдържание на Value Bomb (за контекст): 
            "${valueBombContent.substring(0, 200)}..." (извадка)

            Структура на съобщението:
            1. Hook: Персонализирано начало, показващо, че познаваме компанията.
            2. Value: "Забелязахме проблем X, затова моят AI генерира решение Y безплатно."
            3. The "Bomb": Кратко описание какво получават СЕГА.
            4. Soft Close: "Ако ти харесва, мога да правя това всеки месец. Искаш ли да видиш пълния файл?"
            
            Тон: Небрежен, но професионален. Бизнес към бизнес. Без "Уважаеми господине".
            Напиши съобщението на Български език:
        `;

        try {
            const message = await this.llm.ask(prompt);
            return message;
        } catch (error) {
            console.error("Error creating outreach message:", error);
            return `Здравей ${prospect.name}, виж това предложение за ${prospect.company}.`;
        }
    }
}
