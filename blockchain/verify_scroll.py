import sys
from web3 import Web3

# Network RPCs to check
NETWORKS = {
    "Scroll Mainnet": "https://rpc.scroll.io",
    "Scroll Sepolia": "https://sepolia-rpc.scroll.io",
    "Base Sepolia": "https://sepolia.base.org",
    "Monad Testnet": "https://testnet-rpc.monad.xyz" # tentative specific RPC, might need adjustment if public one differs
}

# Addresses to check
contracts = {
    "MONToken": "0x04ad48a9C5d64021e92E94D93d473D022Af062D1",
    "ActionLogger": "0xdb35cde57250b6c99cceAD40F1ad2EDEA8CEf4b4"
}

def check_deployment():
    for net_name, rpc_url in NETWORKS.items():
        print(f"\n--- Checking {net_name} ---")
        try:
            w3 = Web3(Web3.HTTPProvider(rpc_url))
            if not w3.is_connected():
                print(f"⚠️  Could not connect to {net_name} RPC")
                continue
                
            chain_id = w3.eth.chain_id
            print(f"Connected! Chain ID: {chain_id}")
            
            found_count = 0
            for name, address in contracts.items():
                # Checksum address
                try:
                    checksum_addr = w3.to_checksum_address(address)
                    code = w3.eth.get_code(checksum_addr)
                    
                    if code and code != b'\x00' and code != b'':
                        print(f"✅ FOUND {name} at {checksum_addr}")
                        print(f"   Code size: {len(code)} bytes")
                        found_count += 1
                    else:
                        print(f"❌ {name}: Not found")
                except Exception as e:
                    print(f"❌ {name}: Error - {e}")
            
            if found_count == len(contracts):
                print(f"\n🎉 SUCCESS! All contracts found on {net_name}!")
                return
                
        except Exception as e:
            print(f"Error checking {net_name}: {e}")

    print("\n🏁 Check complete.")

if __name__ == "__main__":
    check_deployment()
