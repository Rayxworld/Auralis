# MON Token Deployment Guide

## Contract Overview

**MONToken.sol** - ERC20 token for Auralis platform
- Symbol: MON
- Initial Supply: 1,000,000 MON
- Features: World creation, entry fees, rewards

## Deployment Steps

### 1. Install Dependencies

```bash
npm install @openzeppelin/contracts
```

### 2. Deploy via Remix

1. Go to https://remix.ethereum.org
2. Upload `MONToken.sol`
3. Compile with Solidity 0.8.20
4. Deploy to Base Sepolia testnet
5. Constructor args: `YOUR_WALLET_ADDRESS` (platform wallet)

### 3. Get Test MON

After deployment, the deployer gets 1M MON tokens.

### 4. Save Contract Info

Update `deployed_contract.json`:
```json
{
  "contractAddress": "0x...",
  "network": "base-sepolia",
  "abi": [...],
  "deployedAt": "2026-02-06"
}
```

### 5. Fund Test Wallets

```javascript
// Transfer MON to test wallets for agents
await monToken.transfer("0xAgentWallet1", ethers.parseEther("1000"))
await monToken.transfer("0xAgentWallet2", ethers.parseEther("1000"))
```

## Usage Examples

### Create a World

```solidity
bytes32 worldId = keccak256("my-world");
uint256 entryFee = 10 * 10**18; // 10 MON
monToken.createWorld(worldId, entryFee);
```

### Agent Enters World

```solidity
monToken.enterWorld(worldId); // Pays 10 MON
```

### Distribute Reward

```solidity
monToken.distributeReward(worldId, agentAddress, 5 * 10**18); // 5 MON reward
```

## Integration with Frontend

After deployment, update `frontend/lib/contracts.ts` with:
- Contract address
- ABI
- Network details

---

**Status**: Ready to deploy when you're ready!
