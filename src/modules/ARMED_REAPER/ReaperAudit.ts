
import fs from 'fs';
import path from 'path';

const LOG_FILE = 'VORTEX_TRADES.csv';

interface TradeStats {
    totalTrades: number;
    wins: number;
    losses: number;
    totalPnL: number;
    bestTrade: number;
    worstTrade: number;
    avgDuration: number;
}

const runAudit = () => {
    console.clear();
    console.log('\x1b[36m%s\x1b[0m', `
    📊 VORTEX AI AUDIT SYSTEM
    -------------------------
    Reading contents of: ${LOG_FILE}
    `);

    if (!fs.existsSync(LOG_FILE)) {
        console.error("❌ NO DATA FOUND. The CSV file is missing.");
        return;
    }

    const data = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = data.trim().split('\n');

    // Премахваме заглавния ред (Header)
    const headers = lines.shift();

    if (lines.length === 0) {
        console.log("⚠️  FILE IS EMPTY. No trades recorded yet.");
        return;
    }

    const stats: TradeStats = {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        totalPnL: 0,
        bestTrade: -Infinity,
        worstTrade: Infinity,
        avgDuration: 0
    };

    let totalDuration = 0;

    lines.forEach(line => {
        // Current CSV Format: TIMESTAMP,TYPE,PAIR,PRICE,AMOUNT,PNL_USDT,BALANCE
        // Index: 0,1,2,3,4,5,6
        const cols = line.split(',');
        const type = cols[1];
        const pnl = parseFloat(cols[5]);

        // We only audit COMPLETED trades (SELLs) as these realize the PnL
        if (type === 'SELL') {
            stats.totalTrades++;
            stats.totalPnL += pnl;

            // Duration calculation would require pairing with previous BUY
            // For now, we skip duration or implement pairing logic later. 
            // We focus on PnL which is the most critical metric.

            if (pnl > 0) stats.wins++;
            else stats.losses++;

            if (pnl > stats.bestTrade) stats.bestTrade = pnl;
            if (pnl < stats.worstTrade) stats.worstTrade = pnl;
        }
    });

    if (stats.totalTrades === 0) {
        console.log("⚠️  NO COMPLETED TRADES FOUND. The Log only contains OPEN positions (BUYs).");
        return;
    }

    const winRate = (stats.wins / stats.totalTrades) * 100;

    // --- REPORT ---
    console.log("📈 PERFORMANCE REPORT");
    console.log("------------------------------------------------");
    console.log(`🔹 Total Closed Trades: ${stats.totalTrades}`);
    console.log(`✅ Win Rate:          ${winRate.toFixed(1)}%  (${stats.wins} Wins / ${stats.losses} Losses)`);
    console.log(`💰 TOTAL PROFIT:      $${stats.totalPnL.toFixed(2)}`);
    console.log("------------------------------------------------");
    console.log(`🚀 Best Trade:        +$${stats.bestTrade.toFixed(2)}`);
    console.log(`🔻 Worst Trade:       $${stats.worstTrade.toFixed(2)}`);
    // console.log(`⏱️  Avg Trade Time:    ${stats.avgDuration.toFixed(1)} seconds`); // Future Upgrade
    console.log("------------------------------------------------");

    if (stats.totalPnL > 0) {
        console.log(`🏆 VERDICT: PROFITABLE SYSTEM. READY FOR DEPLOY.`);
    } else {
        console.log(`⚠️  VERDICT: SYSTEM NEEDS OPTIMIZATION.`);
    }
};

runAudit();
