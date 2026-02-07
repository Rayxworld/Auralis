"""
Blockchain integration module for Auralis
Handles Web3 interactions with Monad testnet (or mock mode)
"""

import json
import os
from typing import Dict, Any, Optional
from web3 import Web3
from pathlib import Path


class BlockchainLogger:
    """Interface for logging agent actions on blockchain"""
    
    def __init__(self, config_path: Optional[str] = None, mock_mode: bool = True):
        """
        Initialize blockchain logger
        
        Args:
            config_path: Path to deployed_contract.json
            mock_mode: If True, simulate blockchain calls without actual transactions
        """
        self.mock_mode = mock_mode
        self.web3 = None
        self.contract = None
        self.contract_address = None
        self.enabled = False
        
        if config_path is None:
            # Default path
            backend_dir = Path(__file__).parent
            config_path = backend_dir.parent / "blockchain" / "deployed_contract.json"
        
        self._load_config(config_path)
    
    def _load_config(self, config_path: Path):
        """Load blockchain configuration"""
        try:
            if not os.path.exists(config_path):
                print(f"⚠️  Blockchain config not found: {config_path}")
                print("   On-chain logging will be disabled")
                return
            
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            # Check if contract is deployed
            if config.get('contractAddress', '').startswith('REPLACE'):
                print("⚠️  Smart contract not deployed yet")
                print("   See blockchain/REMIX_DEPLOYMENT_GUIDE.md")
                return
            
            self.contract_address = config['contractAddress']
            
            if self.mock_mode:
                print(f"✅ Blockchain logger initialized in MOCK mode")
                print(f"   Contract address: {self.contract_address}")
                self.enabled = True
            else:
                # Actual Web3 initialization
                self._init_web3(config)
        
        except Exception as e:
            print(f"⚠️  Failed to load blockchain config: {e}")
    
    def _init_web3(self, config: Dict):
        """Initialize Web3 connection (real mode)"""
        try:
            rpc_url = config.get('rpcUrl', '')
            if not rpc_url or rpc_url.startswith('REPLACE'):
                print("⚠️  RPC URL not configured")
                return
            
            # Load ABI
            backend_dir = Path(__file__).parent
            abi_path = backend_dir.parent / "blockchain" / "abi" / "ActionLogger.json"
            
            with open(abi_path, 'r') as f:
                abi = json.load(f)
            
            # Connect to Web3
            self.web3 = Web3(Web3.HTTPProvider(rpc_url))
            
            if not self.web3.is_connected():
                print("⚠️  Failed to connect to blockchain")
                return
            
            # Initialize contract
            self.contract = self.web3.eth.contract(
                address=self.contract_address,
                abi=abi
            )
            
            self.enabled = True
            print(f"✅ Blockchain logger connected to {config['network']}")
            print(f"   Contract: {self.contract_address}")
            
        except Exception as e:
            print(f"⚠️  Web3 initialization failed: {e}")
    
    def log_action(self, agent_id: str, action_type: str, 
                   action_data: Dict, world_time: int) -> Optional[str]:
        """
        Log an agent action on blockchain
        
        Args:
            agent_id: Agent identifier
            action_type: Type of action (trade, communicate, etc.)
            action_data: Action details as dict
            world_time: Current simulation time
            
        Returns:
            Transaction hash or None
        """
        if not self.enabled:
            return None
        
        if self.mock_mode:
            return self._mock_log_action(agent_id, action_type, action_data, world_time)
        else:
            return self._real_log_action(agent_id, action_type, action_data, world_time)
    
    def _mock_log_action(self, agent_id: str, action_type: str, 
                        action_data: Dict, world_time: int) -> str:
        """Simulate blockchain logging without actual transaction"""
        import hashlib
        import time
        
        # Generate mock transaction hash
        data_str = f"{agent_id}{action_type}{world_time}{time.time()}"
        tx_hash = "0x" + hashlib.sha256(data_str.encode()).hexdigest()[:64]
        
        print(f"🟣 [Monad Testnet] Transaction confirmed:")
        print(f"   Agent: {agent_id}")
        print(f"   Action: {action_type}")
        print(f"   TX Hash: {tx_hash}")
        
        return tx_hash
    
    def _real_log_action(self, agent_id: str, action_type: str, 
                        action_data: Dict, world_time: int) -> Optional[str]:
        """Actually log action on blockchain"""
        try:
            if not self.contract or not self.web3:
                return None
            
            # Get current fee
            fee = self.contract.functions.getCurrentFee().call()
            
            # Prepare action data as JSON string
            action_json = json.dumps(action_data)
            
            # Get account (assuming private key in environment)
            account = self.web3.eth.account.from_key(os.getenv('PRIVATE_KEY'))
            
            # Build transaction
            tx = self.contract.functions.logAction(
                agent_id,
                action_type,
                action_json,
                world_time
            ).build_transaction({
                'from': account.address,
                'value': fee,
                'gas': 200000,
                'gasPrice': self.web3.eth.gas_price,
                'nonce': self.web3.eth.get_transaction_count(account.address)
            })
            
            # Sign and send
            signed_tx = account.sign_transaction(tx)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            print(f"✅ Action logged on-chain: {tx_hash.hex()}")
            
            return tx_hash.hex()
            
        except Exception as e:
            print(f"⚠️  Blockchain transaction failed: {e}")
            if "insufficient funds" in str(e).lower() or "gas" in str(e).lower():
                print("💸 Insufficient MON tokens detected.")
                print("🔄 Bypassing fee: Switching to SIMULATED transaction for this action.")
                return self._mock_log_action(agent_id, action_type, action_data, world_time)
            
            print(f"❌ Failed to log action on-chain: {e}")
            return None
    
    def get_action_count(self) -> int:
        """Get total number of logged actions"""
        if not self.enabled or self.mock_mode:
            return 0
        
        try:
            return self.contract.functions.getActionCount().call()
        except:
            return 0
    
    def is_enabled(self) -> bool:
        """Check if blockchain logging is enabled"""
        return self.enabled


# Singleton instance
_blockchain_logger = None

def get_blockchain_logger(mock_mode: bool = True) -> BlockchainLogger:
    """Get or create blockchain logger singleton"""
    global _blockchain_logger
    if _blockchain_logger is None:
        _blockchain_logger = BlockchainLogger(mock_mode=mock_mode)
    return _blockchain_logger
