export const CONTRACT_ADDRESSES = {
  MONToken: "0x0000000000000000000000000000000000000000",
  ActionLogger: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
};

export const NETWORK_CONFIG = {
  chainId: 10143,
  name: "Monad Testnet",
  rpcUrl: "https://testnet-rpc.monad.xyz",
  blockExplorer: "https://testnet.monadexplorer.com"
};

// ABI for MONToken (Partial)
export const MON_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// ABI for ActionLogger (Partial)
export const ACTION_LOGGER_ABI = [
  "function logAction(string agentId, string actionType, string actionData, uint256 worldTime) payable",
  "function getActionCount() view returns (uint256)",
  "function getCurrentFee() view returns (uint256)"
];
