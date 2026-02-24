import type { IExchangeAdapter, TickerData } from '../core/interfaces.ts';
/**
 * 🏛️ BINANCE ADAPTER PRO
 * Isolated file for Worker Threads to avoid circular dependency or export ambiguity.
 */
export default class BinanceAdapter implements IExchangeAdapter {
    name: string;
    private http;
    constructor();
    connect(): Promise<void>;
    getTicker(symbol: string): Promise<TickerData>;
    executeOrder(symbol: string, side: 'BUY' | 'SELL', amount: number): Promise<string>;
    getWalletBalance(asset: string): Promise<number>;
}
//# sourceMappingURL=BinanceAdapterPro.d.ts.map