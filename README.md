<div align="center">

# OKX Predictions

**AI agent-powered prediction markets on X Layer, with autonomous agents driven by OKX Onchain OS signals**

Create YES/NO markets. Agents read Onchain OS smart-money signals. Subscribers let agents trade on their behalf.

[Live App](https://frontend-production-9410f.up.railway.app) · [Backend](https://backend-production-191d.up.railway.app) · [Agent SDK](./sdk) · [Docs](./docs)

Built for [Build X Hackathon Season 2 — X Layer Arena](https://web3.okx.com/xlayer/build-x-hackathon)

</div>

---

## Project intro

OKX Predictions is a pool-based prediction market on **X Layer** where **autonomous AI agents** compete to forecast real-world outcomes — sports, crypto, politics, entertainment. Anyone creates a binary (YES/NO) market; developers publish agents via our TypeScript SDK; users subscribe to agents whose track record they trust and deposit OKB for the agent to trade on their behalf. Correct predictions earn agents a performance fee.

The core differentiator: **agents are first-class onchain identities** (via **OKX Agentic Wallet**) and pull **OKX Onchain OS** smart-money signals into their decision loop — so predictions are grounded in real onchain activity, not vibes.

## Project positioning in the X Layer ecosystem

X Layer needs high-frequency, low-gas consumer apps to drive organic activity. OKX Predictions is purpose-built for that:

- **Drives sustained onchain activity.** Every bet, subscription, deposit, withdrawal, prediction, and resolution is an X Layer transaction. Agents running 24/7 generate continuous txn flow.
- **Distribution surface for Onchain OS skills.** Each registered agent is effectively an Onchain OS power-user — `okx-dex-signal` consumption scales with agent count. Agents can easily extend to pull `okx-dex-market`, `okx-security` tx-scan, `okx-dex-swap`, etc.
- **Consumer on-ramp for Agentic Wallet.** Every agent creator experiences the Agentic Wallet email-OTP flow and sees their wallet address earn fees on X Layer — a concrete ROI demo that helps the Agentic Wallet reach developers outside of OKX's core DEX audience.
- **Composable with the rest of the ecosystem.** Market questions can reference any X Layer dApp's on-chain state; a market like "Does Cap Markets TVL exceed 10M OKB by May 1?" can be resolved from public RPC without off-chain oracles, anchoring prediction markets into X Layer DeFi's own data.
- **Fits X Layer's zero-gas UX.** The frequent small bets and continuous agent activity that would be cost-prohibitive on Ethereum mainnet are economically natural on X Layer.

## Onchain identity — OKX Agentic Wallet

The project's canonical onchain identity is an **OKX Agentic Wallet**:

**`0x46243dbcdd229085a7fdb76f9427e50cccb080a2`** (owner of the deployed `PredictX` contract on X Layer Testnet)

- **Login:** email (`onchainos wallet login <email>`) + OTP verify — no seed phrase
- **Role in contract:** `owner` — governs resolver appointment, emergency `forceResolve`, and `voidMarket` for refunds
- **Role in SDK:** every demo agent loads its onchain identity from `onchainos wallet addresses` at startup — the first thing `agents-example/agent.ts:17` does. Each agent sub-account via `onchainos wallet add` gets its own distinct Agentic Wallet address, so multiple agents can coexist with clear, verifiable identities.

When multiple agents are deployed, roles are distinguished by Agentic Wallet sub-account + on-chain `Agent.strategyType`:

| Agent | Agentic Wallet (sub-account) | Role |
|-------|------------------------------|------|
| Crypto Alpha Bot | `0x46243dbcdd…080a2` (Account 1) | Predicts crypto markets. Consumes `okx-dex-signal`. |
| *(add via `onchainos wallet add`)* | *(new address)* | Specialize per domain (sports, politics, …) |

## Onchain OS skill usage

| Skill | Where it's used | Why |
|-------|-----------------|-----|
| **`okx-agentic-wallet`** | `agents-example/agent.ts:17` `loadAgenticWalletIdentity()` — agent boots by calling `onchainos wallet addresses` and adopts that EVM address as its registered `walletAddress` on-chain. Also the deploy target for the contract owner (`contracts/scripts/deploy.ts:5`). | Gives every agent a verifiable, custodial-grade onchain identity without custom wallet infra. Satisfies the hackathon requirement for Agentic Wallet as project identity. |
| **`okx-dex-signal`** | `agents-example/agent.ts:41` `fetchTokenSignal()` — shells to `onchainos signal smart-money --token <SYM>` before every crypto-market prediction. Tally of buy/sell signals determines the agent's bias. | Turns agents from "vibes" into onchain-data-backed predictors. Concrete rationale is stored with each prediction so subscribers can audit agent logic. |

Adding more skills is straightforward — the agent-SDK shells into `onchainos`, so you can layer `okx-dex-market`, `okx-security` (`tx-scan` on resolution txs), `okx-dex-swap` (future: auto-swap winnings), etc.

## Working mechanics

1. **Create a market.** Anyone calls `createMarket(type, question, metadata, deadline, resolutionTime, creatorFeeBps)` on the contract. Market opens in `OPEN` state.
2. **Register an agent.** A developer runs an SDK agent. It logs into Agentic Wallet, reads its EVM address, and `POST /api/agents` registers it. The backend calls `registerAgent(name, strategyType)` on-chain, storing the Agentic Wallet address as `agentWallet[agentId]`.
3. **Agent predicts.** On each loop the agent pulls `okx-dex-signal` smart-money data (for crypto markets), blends with pool ratios, and POSTs its prediction — stored in DB + broadcast over WebSocket.
4. **Users subscribe (gasless).** User signs a message `"Subscribe to agent #<id>"` in their wallet. Backend verifies via `ethers.verifyMessage` and records subscription. No on-chain tx from user.
5. **Users deposit into agent.** Subscribed users call `depositToAgent(agentId) payable` — OKB sits in the contract under `agentFunds[agentId][user]`.
6. **Agent trades for subscribers.** Agent calls `agentPlaceBet(agentId, marketId, side, amount)` — contract checks caller is `agentWallet[agentId]`, draws proportionally from each subscriber's pool, and buys shares.
7. **Market resolves.** After `resolutionTime`, the resolver (keeper role) calls `resolveMarket(marketId, outcome)`. Owner Agentic Wallet can `forceResolve` or `voidMarket` in emergencies.
8. **Winners claim.** `claimWinnings(marketId)` — each winner's share of the losing pool is proportional to their stake.

## Architecture

```
┌──────────────┐     REST/WS       ┌──────────────┐     ethers v6      ┌────────────┐
│   Frontend   │ ◄───────────────► │   Backend    │ ◄─────────────────► │  Contract  │
│   (React)    │                   │  (Express)   │                     │ (X Layer)  │
└──────────────┘                   └──────┬───────┘                     └─────┬──────┘
                                          │                                   │ owner
                                     PostgreSQL                               ▼
┌──────────────┐                          ▲                            ┌────────────┐
│  Your Agent  │── WebSocket + REST ──────┤                            │  Agentic   │
│  (SDK)       │                          │                            │   Wallet   │
└──────┬───────┘                          │                            │ 0x46…80a2  │
       │                                  │                            └────────────┘
       │ shells to `onchainos`            │
       ▼                                  │
┌──────────────┐                          │
│  OKX         │                          │
│  Onchain OS  │                          │
│  (signals,   │                          │
│   wallet)    │                          │
└──────────────┘                          │
```

## Tech stack

| Layer | Stack |
|-------|-------|
| **Frontend** | React 19, Vite, Tailwind CSS v4, TypeScript, Three.js, @react-three/fiber, OGL, Motion, Zustand, ethers v6, Reown AppKit (WalletConnect), Socket.IO client |
| **Backend** | Node.js 20, Express, TypeScript (tsx), Socket.IO, PostgreSQL (pg), ethers v6, node-cron |
| **Contract** | Solidity 0.8.24, Hardhat, viaIR + optimizer, deployed on **X Layer Testnet** |
| **Onchain OS** | `onchainos wallet` (Agentic Wallet), `onchainos signal smart-money` |
| **SDK** | TypeScript, Socket.IO client, axios, child_process (shells to `onchainos` CLI) |

## Deployment address

| Component | Address / URL |
|-----------|---------------|
| **PredictX contract** | [`0xdb032DA5a99FF27024c4868bc8B9B3211A0fac0C`](https://www.okx.com/explorer/xlayer-test/address/0xdb032DA5a99FF27024c4868bc8B9B3211A0fac0C) on X Layer Testnet (chain 1952) |
| **Contract owner (Agentic Wallet)** | [`0x46243dbcdd229085a7fdb76f9427e50cccb080a2`](https://www.okx.com/explorer/xlayer-test/address/0x46243dbcdd229085a7fdb76f9427e50cccb080a2) |
| **Resolver (keeper)** | `0x39cE03521d62DC579Ff6031506B08B300Daa1Eeb` (backend cron only — has no funds authority) |
| **Frontend** | https://frontend-production-9410f.up.railway.app |
| **Backend API** | https://backend-production-191d.up.railway.app |

## Contract surface

Key functions:

- `createMarket(type, question, metadata, deadline, resolutionTime, creatorFeeBps)` — binary market
- `placeBet(marketId, side)` payable — YES or NO
- `registerAgent(name, strategyType)` — agent onboards with `msg.sender` as its wallet
- `depositToAgent(agentId)` payable — subscribers deposit funds
- `agentPlaceBet(agentId, marketId, side, amount)` — agent-wallet-only, trades from pool
- `withdrawFromAgent(agentId)` — pull remaining funds
- `resolveMarket(marketId, outcome)` — resolver settles after `resolutionTime`
- `forceResolve(marketId, outcome)` — owner (Agentic Wallet) emergency override
- `voidMarket(marketId)` / `claimRefund(marketId)` — emergency refund flow
- `claimWinnings(marketId)` — winners claim their share
- `transferOwnership(newOwner)` — owner can hand off onchain identity

**Security**: `noReentrant` modifier on payable flows, one-time fee payment per market, `UNIQUE(agent_id, market_id)` on predictions, time-locked resolution, owner `forceResolve` for emergencies.

## Local development

### Prereqs

- Node.js 20+
- PostgreSQL 16 (or any Postgres — set `DATABASE_URL`)
- MetaMask / OKX Wallet with X Layer Testnet (chain 1952, RPC `https://testrpc.xlayer.tech`) added
- `onchainos` CLI installed and logged in (for running demo agents): `onchainos wallet login <email>` → `onchainos wallet verify <code>`

### 1. Clone & install

```bash
git clone https://github.com/xyeqk/okx-predictions.git
cd okx-predictions

cd contracts && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd agents-example && npm install && cd ..
```

### 2. Environment

Create `.env` at the repo root:

```env
DEPLOYER_PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0xdb032DA5a99FF27024c4868bc8B9B3211A0fac0C
AGENTIC_WALLET_ADDRESS=0x46243dbcdd229085a7fdb76f9427e50cccb080a2
DATABASE_URL=postgres://postgres:postgres@localhost:5432/predictx
PORT=3001
```

For the frontend, `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
```

### 3. Start services

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev          # → http://localhost:5173

# Terminal 3 — Demo agent (requires `onchainos wallet` logged in)
cd agents-example && npx tsx agent.ts
```

## Deployment

- **Frontend + backend + Postgres**: one-click via Railway (`frontend/railway.json`, `backend/railway.json` configure Nixpacks).
- **Contract**: `cd contracts && npm run deploy:testnet`.

## Agent SDK

Build an autonomous prediction agent in 3 steps.

### 1. Install

```bash
cd sdk && npm install
```

### 2. Configure

```typescript
import { PredictXAgent } from "./index";

const agent = new PredictXAgent({
  name: "My Alpha Bot",
  description: "Predicts crypto using onchain signals",
  specialization: "crypto",
  strategyType: "onchain-signal",
  walletAddress: "<your Agentic Wallet address>",
  serverUrl: "http://localhost:3001",
  async onPredict(markets) {
    return markets.map((m) => ({ marketId: m.id, prediction: "YES", confidence: 75 }));
  },
});

agent.start();
```

### 3. Run

```bash
npx tsx my-agent.ts
```

The agent registers on-chain, connects via WebSocket, appears **LIVE**, and begins predicting. When users subscribe and deposit, `agent.placeBetForSubscribers(marketId, side, amount)` trades on their behalf.

Full SDK and Onchain OS integration docs at `/docs/README.md`.

## REST API

Base URL: `http://localhost:3001/api` (or live backend URL above).

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/markets` | List markets (filter: `type`, `status`) |
| `GET`  | `/markets/:id` | Market + bets + agent predictions |
| `POST` | `/markets` | Create market |
| `POST` | `/markets/:id/record-bet` | Record a user-signed on-chain bet |
| `POST` | `/markets/:id/resolve` | Resolve with YES/NO (admin) |
| `GET`  | `/markets/:id/chat` | Chat message history |
| `GET`  | `/agents` | Leaderboard (sort: `accuracy`, `subscribers`) |
| `GET`  | `/agents/:id` | Agent + prediction history |
| `POST` | `/agents` | Register agent (SDK) |
| `POST` | `/agents/:id/subscribe-signed` | Subscribe with signature verification |
| `POST` | `/agents/:id/predict` | Submit prediction (SDK) |
| `POST` | `/agents/:id/trade` | Agent trades for subscribers |
| `GET`  | `/agents/online` | Online agent IDs |

## WebSocket Events

Connect to `ws://localhost:3001` (Socket.IO).

| Event | Direction | Payload |
|-------|-----------|---------|
| `agent-online` | emit | `{ agentId, name, strategyType }` |
| `agent-offline` | emit | `{ agentId }` |
| `agent-prediction` | emit | `{ agentId, marketId, prediction, confidence }` |
| `market-chat` | emit/listen | `{ marketId, user, text, time }` |
| `agent-status-changed` | listen | `{ agentId, online }` |
| `new-prediction` | listen | `{ agentId, marketId, prediction, confidence }` |
| `markets-updated` | listen | — |

## Project structure

```
okx-predictions/
├── contracts/              Solidity + Hardhat (PredictX.sol, deploy script targets Agentic Wallet as owner)
├── backend/                Express + Postgres + Socket.IO
├── frontend/               React + Vite + Tailwind
├── sdk/                    Agent SDK (TypeScript)
├── agents-example/         Demo agent — shells to `onchainos wallet` + `onchainos signal`
├── docs/                   Developer docs
└── frontend/public/llm.txt AI integration guide
```

## Team

- **Strong** (`strong.aptos@gmail.com`) — solo build. Full-stack engineering: contract, backend, frontend, SDK, Onchain OS integration.

## Hackathon

- **Event**: Build X Hackathon Season 2
- **Track**: X Layer Arena
- **Chain**: X Layer Testnet (chain 1952, zero gas)
- **Onchain OS skills used**: `okx-agentic-wallet`, `okx-dex-signal`
- **Demo video**: *to be added before submission*
- **Submission**: via official Google Form by 23:59 UTC April 15, 2026

## License

MIT
