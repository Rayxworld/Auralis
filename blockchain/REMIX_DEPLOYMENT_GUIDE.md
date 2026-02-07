# Deploying Auralis Smart Contracts to Monad Testnet

This guide serves as the **only** source of truth for deploying your contracts to the **Monad Testnet**.

## 1. Network Configuration (MetaMask)

Ensure your MetaMask is configured with the following details:

- **Network Name**: Monad Testnet
- **RPC URL**: `https://testnet-rpc.monad.xyz`
- **Chain ID**: `10143`
- **Currency Symbol**: `MON`
- **Block Explorer**: `https://testnet.monadexplorer.com/`

## 2. Get Testnet Tokens

You need $MON tokens to deploy.
- Visit the official faucet or community faucets if available.
- **Note**: If you cannot get tokens immediately, you can still compile the contracts, but deployment will fail until you have gas.

## 3. Deploy `MONToken`

1.  Open [Remix IDE](https://remix.ethereum.org).
2.  Create `MONToken.sol` and paste the code.
3.  **Compile** using Solidity `0.8.20`.
4.  **Deploy**:
    - Environment: `Injected Provider - MetaMask` (Ensure Monad Testnet is selected).
    - Contract: `MONToken`.
    - Deploy Args: `_platformWallet` (Your Wallet Address).
5.  **Copy the Contract Address**.

## 4. Deploy `ActionLogger`

1.  Create `ActionLogger.sol` and paste the code.
2.  **Compile** using Solidity `0.8.20`.
3.  **Deploy**:
    - Contract: `ActionLogger`.
    - Deploy Args: `_initialFee` (e.g., `0` or `1000000000000000` for 0.001 MON).
4.  **Copy the Contract Address**.

## 5. Update Project Config

Once deployed, open `blockchain/deployed_contract.json` and update:

```json
{
  "contractAddress": "PASTE_ACTION_LOGGER_ADDRESS_HERE",
  "monTokenAddress": "PASTE_MON_TOKEN_ADDRESS_HERE",
  ...
}
```

Then update `frontend/lib/contracts.ts` with the same addresses.
