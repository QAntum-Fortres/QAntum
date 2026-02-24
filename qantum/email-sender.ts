/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📧 QANTUM EMAIL SENDER — АВТОНОМНО ИЗПРАЩАНЕ НА ИМЕЙЛИ
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Gmail SMTP интеграция с nodemailer.
 * 
 * SETUP:
 *   1. Отиди на https://myaccount.google.com/apppasswords
 *   2. Създай App Password за "Mail" → "Windows Computer"
 *   3. Сложи го в .env файла като GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *   4. Или го подай директно при инициализация
 * 
 * @author Димитър Продромов
 * @version 1.0.0
 */

import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface EmailConfig {
    senderEmail: string;
    senderName: string;
    appPassword: string;      // Gmail App Password (NOT regular password)
}

export interface EmailPayload {
    to: string;               // recipient email
    toName?: string;          // recipient name
    subject: string;
    textBody: string;         // plain text version
    htmlBody?: string;        // optional HTML version
    replyTo?: string;
    attachments?: Array<{
        filename: string;
        path: string;
    }>;
}

export interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    timestamp: string;
    to: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL SENDER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class QantumEmailSender {
    private transporter: nodemailer.Transporter;
    private config: EmailConfig;
    private sendLog: SendResult[] = [];
    private logFile: string;
    
    // Лимити за да не те баннат от Gmail
    private readonly DELAY_BETWEEN_EMAILS_MS = 15000;  // 15 сек между имейлите
    private readonly MAX_PER_HOUR = 20;                // макс 20/час
    private readonly MAX_PER_DAY = 100;                // макс 100/ден (Gmail лимит е 500)

    constructor(config: EmailConfig) {
        this.config = config;
        this.logFile = path.join(process.cwd(), 'dashboard', 'b2b-pitches', 'email-send-log.json');
        
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,   // true за 465, false за 587 (STARTTLS)
            auth: {
                user: config.senderEmail,
                pass: config.appPassword,
            },
            tls: {
                rejectUnauthorized: true
            }
        });
    }

    /**
     * Верифицира SMTP връзката преди изпращане
     */
    async verify(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('✅ SMTP връзка верифицирана — Gmail е ready.');
            return true;
        } catch (err: any) {
            console.error('❌ SMTP верификация НЕУСПЕШНА:', err.message);
            if (err.message.includes('Invalid login')) {
                console.error('   → Провери App Password! Трябва App Password, НЕ обичайна парола.');
                console.error('   → https://myaccount.google.com/apppasswords');
            }
            return false;
        }
    }

    /**
     * Изпраща един имейл
     */
    async send(payload: EmailPayload): Promise<SendResult> {
        const result: SendResult = {
            success: false,
            timestamp: new Date().toISOString(),
            to: payload.to,
        };

        try {
            // Rate limit check
            await this.checkRateLimits();

            const mailOptions: nodemailer.SendMailOptions = {
                from: `"${this.config.senderName}" <${this.config.senderEmail}>`,
                to: payload.toName ? `"${payload.toName}" <${payload.to}>` : payload.to,
                subject: payload.subject,
                text: payload.textBody,
                replyTo: payload.replyTo || this.config.senderEmail,
            };

            if (payload.htmlBody) {
                mailOptions.html = payload.htmlBody;
            }

            if (payload.attachments && payload.attachments.length > 0) {
                mailOptions.attachments = payload.attachments;
            }

            const info = await this.transporter.sendMail(mailOptions);
            
            result.success = true;
            result.messageId = info.messageId;
            
            console.log(`📧 ✅ Изпратено до ${payload.to} — ID: ${info.messageId}`);
        } catch (err: any) {
            result.error = err.message;
            console.error(`📧 ❌ Грешка при изпращане до ${payload.to}: ${err.message}`);
        }

        this.sendLog.push(result);
        this.saveSendLog();
        return result;
    }

    /**
     * Изпраща batch от имейли с delay между тях
     */
    async sendBatch(payloads: EmailPayload[]): Promise<SendResult[]> {
        const results: SendResult[] = [];
        
        console.log(`\n📬 Начало на batch изпращане: ${payloads.length} имейла`);
        console.log(`   ⏱️  Delay: ${this.DELAY_BETWEEN_EMAILS_MS / 1000}s между имейли\n`);

        for (let i = 0; i < payloads.length; i++) {
            console.log(`📧 [${i + 1}/${payloads.length}] Изпращане до ${payloads[i].to}...`);
            
            const result = await this.send(payloads[i]);
            results.push(result);

            // Delay между имейли (освен за последния)
            if (i < payloads.length - 1) {
                console.log(`   ⏱️  Пауза ${this.DELAY_BETWEEN_EMAILS_MS / 1000}s...`);
                await this.sleep(this.DELAY_BETWEEN_EMAILS_MS);
            }
        }

        const sent = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`\n📬 Batch резултат: ✅ ${sent} изпратени, ❌ ${failed} грешки\n`);
        
        return results;
    }

    /**
     * Генерира HTML версия на pitch-а за по-добро представяне
     */
    static pitchToHtml(pitchText: string, senderName: string): string {
        // Escape HTML
        const escaped = pitchText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            color: #1a1a2e;
            background: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 24px;
            border-radius: 12px 12px 0 0;
            text-align: center;
        }
        .header h2 { margin: 0; font-size: 18px; }
        .content {
            background: white;
            padding: 24px;
            border: 1px solid #e2e8f0;
            border-top: none;
            white-space: pre-wrap;
            line-height: 1.6;
            font-size: 14px;
        }
        .footer {
            background: #f1f5f9;
            padding: 16px 24px;
            border: 1px solid #e2e8f0;
            border-top: none;
            border-radius: 0 0 12px 12px;
            font-size: 12px;
            color: #64748b;
            text-align: center;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin: 16px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🚀 QAntum Prime · AI-Powered Business Intelligence</h2>
    </div>
    <div class="content">${escaped}</div>
    <div class="footer">
        <p>${senderName} · QAntum Prime · AETERNA_LOGOS</p>
        <p>Powered by QANTUM AI Infrastructure</p>
    </div>
</body>
</html>`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIVATE
    // ═══════════════════════════════════════════════════════════════════════════

    private async checkRateLimits(): Promise<void> {
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        const oneDayAgo = now - 86400000;

        const recentHour = this.sendLog.filter(
            r => r.success && new Date(r.timestamp).getTime() > oneHourAgo
        ).length;

        const recentDay = this.sendLog.filter(
            r => r.success && new Date(r.timestamp).getTime() > oneDayAgo
        ).length;

        if (recentHour >= this.MAX_PER_HOUR) {
            const waitMinutes = Math.ceil((3600000 - (now - new Date(this.sendLog[this.sendLog.length - this.MAX_PER_HOUR].timestamp).getTime())) / 60000);
            throw new Error(`⚠️ Rate limit: ${this.MAX_PER_HOUR}/час достигнат. Изчакай ${waitMinutes} мин.`);
        }

        if (recentDay >= this.MAX_PER_DAY) {
            throw new Error(`⚠️ Rate limit: ${this.MAX_PER_DAY}/ден достигнат. Опитай утре.`);
        }
    }

    private saveSendLog(): void {
        try {
            const dir = path.dirname(this.logFile);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.logFile, JSON.stringify(this.sendLog, null, 2));
        } catch (e) {
            // silent
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
