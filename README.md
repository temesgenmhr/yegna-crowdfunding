## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Install Dependencies

Install backend and frontend dependencies:

```sh
npm install
cd frontend
npm install
```

### 2. Compile & Test Smart Contracts

From the project root:

```sh
npx hardhat compile
npx hardhat test
```

### 3. Deploy Contracts (Local Network)

Start a local Hardhat node in one terminal:

```sh
npx hardhat node
```

In another terminal, deploy contracts:

```sh
npx hardhat run scripts/send-op-tx.ts --network localhost
```

### 4. Run the Frontend

From the `frontend` folder:

```sh
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) (default Vite port).

---
# Yegna Crowdfunding

Yegna Crowdfunding is a decentralized crowdfunding platform built on Ethereum. It enables users to create fundraising campaigns, contribute ETH to campaigns, and manage funds transparently using smart contracts. The project features a full-stack dApp with a Solidity smart contract backend and a modern React/TypeScript frontend.

## Features


## Tech Stack

**Smart Contract & Backend:**
- Solidity (Ethereum smart contracts)
- Hardhat (development, testing, deployment)
- Ethers.js (blockchain interaction)

**Frontend:**
- React (TypeScript, Vite)
- ethers.js (web3 integration)
- Tailwind CSS (UI styling)
- Radix UI, Lucide Icons, React Router

**Testing:**
- Mocha, Chai (unit tests)

## Project Structure

```
contracts/        # Solidity smart contracts
frontend/         # React frontend app
test/             # Smart contract tests (TypeScript)
artifacts/        # Compiled contract artifacts
scripts/          # Deployment and utility scripts
ignition/         # Hardhat Ignition deployment modules
types/            # TypeScript contract types
```



