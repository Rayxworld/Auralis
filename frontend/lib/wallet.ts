export const connectWallet = async () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    } catch (error) {
      console.error("User denied account access", error);
      return null;
    }
  } else {
    alert("Please install MetaMask to use this feature!");
    return null;
  }
};

export const switchToMonadTestnet = async () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x279F' }], // 10143 in hex
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x279F',
                chainName: 'Monad Testnet',
                rpcUrls: ['https://testnet-rpc.monad.xyz'],
                blockExplorerUrls: ['https://testnet.monadexplorer.com'],
                nativeCurrency: {
                  name: 'MON',
                  symbol: 'MON',
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Monad Testnet", addError);
        }
      }
    }
  }
};
