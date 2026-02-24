# QAntum Prime v36.1 — Engine Documentation

## System Overview

**QAntum Prime** is a high-frequency trading (HFT) engine built on a **Rust NAPI** core with **AtomicU64 dynamic thresholds**. It processes live market data from Binance and Kraken exchanges at sub-100ns latency, generating BUY/SELL/HOLD signals in real-time.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      QAntum Prime v36.1                             │
├─────────────┬──────────────────┬──────────────────┬─────────────────┤
│  WebSocket  │  Ring Buffer     │  Rust NAPI       │  Dashboard      │
│  Feed       │  O(1) Lock-Free  │  Engine          │  Server         │
│             │                  │                  │                 │
│  Binance    │  128-slot SPSC   │  AtomicU64       │  HTTP + WS      │
│  Kraken     │  queue           │  128-bit arith   │  REST API       │
│             │                  │  Monte Carlo     │  Canvas Charts  │
└─────┬───────┴────────┬─────────┴──────┬───────────┴────────┬────────┘
      │                │                │                    │
      ▼                ▼                ▼                    ▼
  Live Prices     Batch 32 ticks   Decision Engine      Command Center
  BTC ETH SOL     per iteration    BUY/SELL/HOLD        Professional UI
  XRP AVAX                         sub-100ns            3-page dashboard
```

---

## Core Components

### 1. Rust NAPI Engine (`native/qantum-engine/`)

The heart of the system — a compiled Rust native module loaded via N-API into Node.js.

#### Exported Functions

| Function | Description | Performance |
|----------|-------------|-------------|
| `executeBatch(ticks)` | Process array of price ticks, return BUY/SELL/HOLD decisions | ~100-130ns/tick |
| `priceOraclePredict(symbol, sims, horizon)` | Monte Carlo price prediction | 3000 sims in <1ms |
| `computeRisk(prices)` | VaR, Sharpe, Sortino, Max Drawdown | O(n) |
| `batchArb(pricesA, pricesB)` | Cross-exchange arbitrage with 128-bit precision | O(n) |
| `triangularArb(prices)` | Triangular arbitrage path analysis | O(n²) |
| `updateThresholds(symbol, buyThreshold, sellThreshold)` | Dynamic AtomicU64 threshold update | Lock-free |
| `computeGlobalEntropy(prices)` | Shannon entropy computation | O(n) |
| `engineHealth()` | Return engine vitals | O(1) |
| `ringBufferBenchmark(iterations)` | Test ring buffer throughput | Variable |

#### Dynamic Thresholds (AtomicU64)

Thresholds use `f64::to_bits()` to store as `AtomicU64` with `Ordering::Relaxed`:

```rust
// Set threshold
let bits = threshold_value.to_bits();
THRESHOLD.store(bits, Ordering::Relaxed);

// Read threshold (lock-free, zero-copy)
let value = f64::from_bits(THRESHOLD.load(Ordering::Relaxed));
```

Auto-calibration runs every 3 seconds, adjusting BUY/SELL thresholds within a ±0.15% band around the current price.

### 2. Dashboard Server (`dashboard/server.js`)

Node.js HTTP + WebSocket server on **port 9094**.

#### REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Engine health vitals from Rust |
| `/api/engine/status` | GET | Full status: prices, history, metrics, signals |
| `/api/predict/:symbol` | GET | Monte Carlo prediction (query: `simulations`, `horizon`) |
| `/api/risk` | GET | Risk metrics: VaR, Sharpe, Sortino, Drawdown |
| `/api/arbitrage` | GET | Cross-exchange arbitrage scan |

#### WebSocket Protocol

Connect to `ws://localhost:9094/ws`

**Messages from server:**

```json
// On connect
{ "type": "init", "livePrices": {...}, "exchangeStatus": {...}, "metrics": {...}, "uptime": 12345 }

// Every 500ms
{ "type": "update", "livePrices": {...}, "exchangeStatus": {...}, "metrics": {...}, "recentSignals": [...], "uptime": 12345 }
```

**Metrics shape:**
```json
{
  "ticksProcessed": 15000,
  "batchesRun": 470,
  "avgLatencyNs": 128.5,
  "minLatencyNs": 89,
  "maxLatencyNs": 312,
  "decisions": { "BUY": 5, "SELL": 3, "HOLD": 669 },
  "totalPnl": 0.0042,
  "thresholdUpdates": 130,
  "calibratedSymbols": 5
}
```

#### Data Flow

1. **Binance WebSocket** (`wss://stream.binance.com:9443`) — Subscribes to `btcusdt@trade`, `ethusdt@trade`, `solusdt@trade`, `xrpusdt@trade`, `avaxusdt@trade`
2. **Kraken WebSocket** (`wss://ws.kraken.com/v2`) — Subscribes to `XBT/USD`, `ETH/USD`, `SOL/USD`, `XRP/USD`, `AVAX/USD`
3. Ticks are batched (32 per iteration) → `executeBatch()` → decisions logged
4. Every 3s: `updateThresholds()` auto-calibrates to ±0.15% of current price
5. Every 500ms: WebSocket broadcast to all connected dashboard clients

### 3. Command Center Dashboard (`dashboard/index.html`)

Professional-grade single-page application with 3 tabs:

#### Overview Tab
- **Telemetry Strip** — 7 metrics: Latency, Ticks, Signals, PnL, Thresholds, Exchanges, Entropy
- **Price Chart** — Canvas-rendered line chart with gradient fill, switchable between 5 symbols
- **Live Prices Table** — Real-time prices with change percentages
- **Decision Distribution** — Visual bar showing BUY/SELL/HOLD ratios
- **Exchange Connections** — Binance/Kraken connection status
- **Entropy Gauge** — SVG ring showing system entropy
- **Signal Log** — Scrollable feed of non-HOLD trading signals
- **Latency Waveform** — Real-time canvas waveform of engine processing latency

#### Analytics Tab
- **Monte Carlo Prediction** — Run N=3000 simulations for any symbol, showing predicted price, confidence, trend, risk, VaR, Sharpe, best/worst case
- **Risk Assessment** — VaR, Sharpe, Sortino, Max Drawdown, Volatility, Risk Grade
- **Arbitrage Scanner** — Cross-exchange spread detection with profit calculations

#### System Tab
- **Architecture Diagram** — Visual flow: WebSocket → Ring Buffer → Rust Engine → Dashboard
- **Engine Capabilities** — All 8 exported Rust functions with descriptions
- **Engine Health** — Live health data from Rust engine
- **Performance Benchmarks** — Ring buffer ops, batch throughput, P99 latency, memory

---

## Tracked Symbols

| Symbol | Binance Stream | Kraken Pair | Icon |
|--------|---------------|-------------|------|
| BTC/USD | `btcusdt@trade` | `XBT/USD` | ₿ |
| ETH/USD | `ethusdt@trade` | `ETH/USD` | Ξ |
| SOL/USD | `solusdt@trade` | `SOL/USD` | ◎ |
| XRP/USD | `xrpusdt@trade` | `XRP/USD` | ✕ |
| AVAX/USD | `avaxusdt@trade` | `AVAX/USD` | ▲ |

---

## Running

### Prerequisites
- Node.js 18+
- Rust toolchain (for building the NAPI engine)
- `napi-rs` CLI

### Build & Start

```bash
# Build Rust engine
cd native/qantum-engine
npm run build

# Start dashboard server
cd ../../dashboard
node server.js
```

Open `http://localhost:9094` in your browser.

### Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Server Port | `9094` | HTTP + WS server port |
| Batch Size | `32` | Ticks per engine batch |
| Calibration Interval | `3000ms` | Auto-threshold adjustment |
| Calibration Band | `±0.15%` | Threshold distance from price |
| WS Broadcast Interval | `500ms` | Dashboard update frequency |
| Price History Length | `300` | Max data points per symbol |
| Signal History Length | `200` | Max stored non-HOLD signals |

---

## Performance Benchmarks

From live testing with real Binance + Kraken feeds:

| Metric | Value |
|--------|-------|
| Average Tick Latency | ~128ns |
| HOLD Signals | 669 (typical session) |
| Threshold Updates | 130 (typical session) |
| Calibrated Symbols | 5/5 |
| Batch Size | 32 ticks |
| Ring Buffer | O(1) lock-free SPSC |
| Arithmetic Precision | 128-bit integer |

---

## Design System

### Typography
- **UI Text**: Inter (300–800 weights)
- **Data/Code**: JetBrains Mono (300–700 weights)

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-void` | `#06080d` | Body background |
| `--bg-surface` | `#111827` | Header, surfaces |
| `--bg-card` | `#151d2e` | Card backgrounds |
| `--blue` | `#3b82f6` | Primary accent, chart lines |
| `--cyan` | `#06b6d4` | Latency, entropy |
| `--green` | `#10b981` | BUY, positive, live |
| `--red` | `#ef4444` | SELL, negative, error |
| `--amber` | `#f59e0b` | Warning, connecting |
| `--purple` | `#8b5cf6` | Thresholds, info |

### Responsive Breakpoints
- `> 1200px`: Full 7-column telemetry, 2-column grid
- `768px–1200px`: 4-column telemetry, single-column grid
- `< 768px`: 2-column telemetry, stacked layout

---

## File Structure

```
Blockchain/
├── dashboard/
│   ├── index.html           # Command Center UI (professional SPA)
│   └── server.js            # HTTP + WebSocket server (port 9094)
├── native/
│   └── qantum-engine/
│       ├── src/lib.rs        # Core Rust NAPI engine
│       ├── Cargo.toml        # Rust dependencies
│       └── qantum-engine.node # Compiled native module
├── scripts/
│   └── unified-runner.js    # Standalone benchmark runner
├── Arbitrage/               # Arbitrage strategies
├── Exchanges/               # Exchange adapters
├── Core/                    # Core trading logic
└── utils/                   # Utility functions
```

---

*QAntum Prime v36.1 — Built with Rust NAPI, AtomicU64 Dynamic Thresholds, 128-bit Precision*
