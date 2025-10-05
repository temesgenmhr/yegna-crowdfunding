import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Web3Provider } from "./contexts/Web3Context";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <Web3Provider>
      <TooltipProvider> 
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
            <Route path="/create" element={<CreateCampaign />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </Web3Provider>
  </QueryClientProvider>
);

export default App;
/* 
import { useEffect, useState } from 'react';
import { ethers, BrowserProvider, JsonRpcSigner, Contract } from 'ethers';
import CounterABI from './abis/Counter.json';
import { config } from './config';

// Extend window type for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [counter, setCounter] = useState<Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);

  // Load blockchain data
  const loadBlockchainData = async () => {
    if (window.ethereum) {
      const prov = new BrowserProvider(window.ethereum);
      setProvider(prov);

      const net = await prov.getNetwork();
      // chainId is bigint, convert to string
      const chainId = net.chainId.toString();
  const addr = (config as any)[Number(chainId)]?.counterAddress;
      if (addr) {
        const sign = await prov.getSigner();
        setSigner(sign);
        // Use CounterABI.abi for ethers v6
        const contract = new Contract(addr, CounterABI.abi, sign);
        setCounter(contract);

        const c = await contract.x();
        setCount(Number(c));
      }
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(ethers.getAddress(accounts[0]));
      loadBlockchainData();
    }
  };

  // Increment functions
  const handleInc = async () => {
    if (counter) {
      try {
        const tx = await counter.inc();
        await tx.wait();
        const c = await counter.x();
        setCount(Number(c));
      } catch (err: any) {
        console.error('Increment failed:', err);
        alert('Increment failed: ' + (err?.reason || err?.message || err));
      }
    }
  };

  const handleIncBy = async (by: number) => {
    if (counter) {
      try {
        const tx = await counter.incBy(by);
        await tx.wait();
        const c = await counter.x();
        setCount(Number(c));
      } catch (err: any) {
        console.error('Increment by failed:', err);
        alert('Increment by failed: ' + (err?.reason || err?.message || err));
      }
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  return (
    <div className="App">
      <header>
        {!account ? (
          <button onClick={connectWallet}>Connect MetaMask</button>
        ) : (
          <p>Account: {account}</p>
        )}
        <p>Current Count: {count}</p>
        <button onClick={handleInc}>Increment</button>
        <button onClick={() => handleIncBy(5)}>Increment by 5</button>
      </header>
    </div>
  );
}

export default App; */