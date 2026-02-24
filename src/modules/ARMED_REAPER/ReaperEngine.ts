
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import ccxt from 'ccxt';
import { ProcessGuard } from './ProcessGuard';
import { NotificationService } from './NotificationService';

// --- ⚙️ CONFIGURATION ---
const TARGETS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT'];
const INITIAL_CAPITAL = 1000;
const MAX_POSITIONS = 4;
const TRADE_ALLOCATION = INITIAL_CAPITAL / MAX_POSITIONS;
const LOG_FILE = 'VORTEX_TRADES.csv';

// --- 🧠 STRATEGY (RSI) ---
const RSI_PERIOD = 14;      // Стандартен период
const RSI_OVERBOUGHT = 70;  // Продавай над 70 (Прекалено скъпо)
const RSI_OVERSOLD = 30;    // Купувай под 30 (Евтино е)
const STOP_LOSS_PCT = 0.01; // 1% Stop Loss (по-широк за RSI)
const TAKE_PROFIT_PCT = 0.015; // 1.5% Take Profit

interface Position {
    symbol: string;
    entryPrice: number;
    amount: number;
    isOpen: boolean;
    startTime: string;
}

export class ReaperEngine {
    private exchange: ccxt.Exchange;
    private isRunning: boolean = false;
    private balanceUSDT: number = INITIAL_CAPITAL;
    private positions: Map<string, Position> = new Map();
    // Пазим история на цените за RSI калкулация
    private priceHistory: Map<string, number[]> = new Map();

    constructor() {
        this.exchange = new ccxt.binance({ enableRateLimit: true });
        TARGETS.forEach(t => {
            this.positions.set(t, { symbol: t, entryPrice: 0, amount: 0, isOpen: false, startTime: '' });
            this.priceHistory.set(t, []);
        });
        this.initLogFile();
    }

    private initLogFile() {
        if (!fs.existsSync(LOG_FILE)) {
            const header = "TIMESTAMP,TYPE,PAIR,ENTRY_PRICE,EXIT_PRICE,PNL_USDT,PNL_PERCENT,DURATION_SEC,REASON\n";
            fs.writeFileSync(LOG_FILE, header);
        }
    }

    public async run() {
        ProcessGuard.ensureSingleInstance();
        this.printBanner();
        console.log(`💀 SYSTEM ONLINE | STRATEGY: RSI (${RSI_PERIOD}) | LOG: ${LOG_FILE}`);
        NotificationService.sendAlert(`🚀 SYSTEM STARTED. Initial Capital: $${INITIAL_CAPITAL}. Strategy: RSI.`);
        this.isRunning = true;
        try {
            await this.exchange.loadMarkets();
            // Загряване: Трябват ни данни за RSI преди да почнем
            console.log("⏳ GATHERING MARKET DATA (WARMING UP)...");
            await this.startBattleLoop();
        } catch (error) {
            console.error("❌ ERROR:", error);
        }
    }

    private printBanner() {
        console.clear();
        console.log('\x1b[36m%s\x1b[0m', `    VORTEX AI SYSTEM  |  ARMED REAPER [INTELLIGENT]`);
        console.log("-----------------------------------------------------------------------");
    }

    private async startBattleLoop() {
        while (this.isRunning) {
            try {
                const tickers = await this.exchange.fetchTickers(TARGETS);
                for (const symbol of TARGETS) {
                    const ticker = tickers[symbol];
                    if (ticker && ticker.last) {
                        // Добавяме цена в историята
                        this.updatePriceHistory(symbol, ticker.last);
                        this.processPair(symbol, ticker.last);
                    }
                }
                this.renderDashboard(tickers);
                await this.sleep(1000);
            } catch (error) { }
        }
    }

    private updatePriceHistory(symbol: string, price: number) {
        const history = this.priceHistory.get(symbol)!;
        history.push(price);
        // Пазим само последните N + 1 цени, колкото ни трябват за RSI
        if (history.length > RSI_PERIOD + 5) {
            history.shift();
        }
    }

    private calculateRSI(symbol: string): number {
        const prices = this.priceHistory.get(symbol)!;
        if (prices.length < RSI_PERIOD + 1) return 50; // Няма достатъчно данни, връщаме неутрално

        let gains = 0;
        let losses = 0;

        for (let i = prices.length - RSI_PERIOD; i < prices.length; i++) {
            const difference = prices[i] - prices[i - 1];
            if (difference >= 0) {
                gains += difference;
            } else {
                losses -= difference;
            }
        }

        const avgGain = gains / RSI_PERIOD;
        const avgLoss = losses / RSI_PERIOD;

        if (avgLoss === 0) return 100;

        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    private processPair(symbol: string, currentPrice: number) {
        const pos = this.positions.get(symbol)!;
        const rsi = this.calculateRSI(symbol);

        if (pos.isOpen) {
            const priceChange = (currentPrice - pos.entryPrice) / pos.entryPrice;

            // ИЗХОД: Take Profit, Stop Loss или RSI Overbought (Прекалено скъпо, обръща се)
            if (priceChange >= TAKE_PROFIT_PCT) {
                this.closePosition(symbol, 'TAKE_PROFIT', currentPrice);
            } else if (priceChange <= -STOP_LOSS_PCT) {
                this.closePosition(symbol, 'STOP_LOSS', currentPrice);
            } else if (rsi > RSI_OVERBOUGHT && priceChange > 0.001) {
                // Допълнителен тригер: Ако RSI е над 70 и сме на малка печалба - бягай!
                this.closePosition(symbol, 'RSI_EXIT', currentPrice);
            }

        } else {
            // ВХОД: Само ако имаме пари И RSI е нисък (Евтино/Oversold)
            if (this.balanceUSDT >= TRADE_ALLOCATION) {
                if (rsi < RSI_OVERSOLD) {
                    this.openPosition(symbol, currentPrice);
                }
            }
        }
    }

    private openPosition(symbol: string, price: number) {
        const pos = this.positions.get(symbol)!;
        const amountUSDT = TRADE_ALLOCATION;
        const amountCrypto = (amountUSDT / price) * 0.999;

        this.balanceUSDT -= amountUSDT;
        pos.isOpen = true;
        pos.entryPrice = price;
        pos.amount = amountCrypto;
        pos.startTime = new Date().toISOString();

        NotificationService.sendAlert(`⚔️ ENTERED TRADE: ${symbol} @ $${price.toFixed(4)} (RSI Oversold)`);
    }

    private closePosition(symbol: string, reason: string, price: number) {
        const pos = this.positions.get(symbol)!;
        const valueUSDT = (pos.amount * price) * 0.999;
        const pnlUSDT = valueUSDT - TRADE_ALLOCATION;
        const pnlPercent = ((price - pos.entryPrice) / pos.entryPrice) * 100;

        this.balanceUSDT += valueUSDT;
        this.logTradeToCSV(symbol, pos, price, pnlUSDT, pnlPercent, reason);

        if (pnlUSDT > 0) {
            NotificationService.sendAlert(`✅ PROFIT SECURED: ${symbol} | +$${pnlUSDT.toFixed(2)} (${pnlPercent.toFixed(2)}%) | Reason: ${reason}`);
        } else {
            NotificationService.sendAlert(`🛑 STOPPED OUT: ${symbol} | $${pnlUSDT.toFixed(2)} | Reason: ${reason}`);
        }

        pos.isOpen = false;
        pos.amount = 0;
        pos.entryPrice = 0;
    }

    private logTradeToCSV(symbol: string, pos: Position, exitPrice: number, pnl: number, pnlPct: number, reason: string) {
        const endTime = new Date();
        const startTime = new Date(pos.startTime);
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
        const timestamp = endTime.toISOString();
        const row = `${timestamp},SELL,${symbol},${pos.entryPrice.toFixed(4)},${exitPrice.toFixed(4)},${pnl.toFixed(4)},${pnlPct.toFixed(2)}%,${duration},${reason}\n`;
        fs.appendFileSync(LOG_FILE, row);
    }

    private renderDashboard(tickers: any) {
        process.stdout.write('\x1b[H\x1b[3B');
        console.log(`💰 WALLET: $${this.balanceUSDT.toFixed(2)} USDT | 📄 LOG: ${LOG_FILE}`);
        console.log("----------------------------------------------------------------------------------");
        console.log(`| PAIR      | PRICE         | RSI  | STATUS         | PnL (Unrealized)     |`);
        console.log("----------------------------------------------------------------------------------");

        let totalEquity = this.balanceUSDT;

        TARGETS.forEach(symbol => {
            const ticker = tickers[symbol];
            const price = ticker ? ticker.last : 0;
            const pos = this.positions.get(symbol)!;
            const rsi = this.calculateRSI(symbol); // Показваме RSI на екрана

            let status = "SCANNING...";
            let pnlStr = "-";

            // Оцветяване на RSI (Зелено ако е ниско, Червено ако е високо)
            let rsiStr = rsi.toFixed(1);
            if (rsi < 30) rsiStr = `\x1b[32m${rsiStr}\x1b[0m`; // Green
            else if (rsi > 70) rsiStr = `\x1b[31m${rsiStr}\x1b[0m`; // Red

            if (pos.isOpen) {
                const currentVal = pos.amount * price;
                totalEquity += currentVal;
                const pnlRaw = currentVal - (pos.amount * pos.entryPrice);
                const pnlPercent = ((price - pos.entryPrice) / pos.entryPrice) * 100;
                status = "⚔️ ACTIVE";
                const color = pnlRaw >= 0 ? "+" : "";
                pnlStr = `${color}$${pnlRaw.toFixed(2)} (${pnlPercent.toFixed(2)}%)`;
            } else {
                if (rsi < 35) status = "🎯 AIMING..."; // Готви се за изстрел
            }

            console.log(`| ${symbol.padEnd(9)} | $${price.toFixed(4).padEnd(12)} | ${rsiStr.padEnd(13)} | ${status.padEnd(14)} | ${pnlStr.padEnd(20)} |`);
        });
        console.log("----------------------------------------------------------------------------------");
        console.log(`📈 NET WORTH: $${totalEquity.toFixed(2)}`);
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const isMainModule = () => {
    const currentFile = fileURLToPath(import.meta.url);
    const executedFile = process.argv[1];
    return executedFile === currentFile || executedFile.endsWith(path.basename(currentFile));
};

if (isMainModule()) {
    new ReaperEngine().run();
}
