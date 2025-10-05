import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';
// Fallback toast implementation if use-toast is missing
const toast = (opts: { title: string; description?: string; variant?: string }) => {
  if (opts.variant === 'destructive') {
    alert(`${opts.title}\n${opts.description || ''}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`${opts.title}: ${opts.description || ''}`);
  }
};
import { ContractService } from '../services/contractService';


interface Web3ContextType {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  account: string | null;
  isConnecting: boolean;
  contractService: ContractService | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);


export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [contractService, setContractService] = useState<ContractService | null>(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      if (typeof window.ethereum === 'undefined') {
        toast({
          title: 'MetaMask not found',
          description: 'Please install MetaMask to use this dApp',
          variant: 'destructive',
        });
        return;
      }
      const prov = new BrowserProvider(window.ethereum);
      setProvider(prov);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const acc = ethers.getAddress(accounts[0]);
      setAccount(acc);
      const sign = await prov.getSigner();
      setSigner(sign);
      // Get chainId for contractService
      const net = await prov.getNetwork();
      setContractService(new ContractService(sign, Number(net.chainId)));
      localStorage.setItem('walletConnected', 'true');
      toast({
        title: 'Wallet Connected',
        description: `Connected: ${acc.slice(0, 6)}...${acc.slice(-4)}`,
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to MetaMask',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setContractService(null);
    localStorage.removeItem('walletConnected');
    toast({
      title: 'Wallet Disconnected',
      description: 'You have been disconnected',
    });
  }, []);

  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected && typeof window.ethereum !== 'undefined') {
      connectWallet();
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(ethers.getAddress(accounts[0]));
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Web3Context.Provider
      value={{ provider, signer, account, isConnecting, contractService, connectWallet, disconnectWallet }}
    >
      {children}
    </Web3Context.Provider>
  );
};


export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Extend window type for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
