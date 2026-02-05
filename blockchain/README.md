# Blockchain Integration (Monad Testnet)

This directory is a placeholder for optional on-chain logging using Monad testnet.

## Setup
1. Deploy a simple logging smart contract (e.g., in Solidity) to Monad testnet.
2. Use Web3.py in the backend to interact (add to requirements.txt: web3).
3. In world.py's _resolve_action, add optional logging if configured.

## Example Contract
```solidity
// ActionLogger.sol
pragma solidity ^0.8.0;

contract ActionLogger {
    event ActionLogged(address agent, string actionType, uint256 timestamp);
    
    function logAction(string memory actionType) external {
        emit ActionLogged(msg.sender, actionType, block.timestamp);
    }
}