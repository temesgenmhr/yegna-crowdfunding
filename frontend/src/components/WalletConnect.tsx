import { Wallet, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useWeb3 } from '../contexts/Web3Context';

/**
 * WalletConnect component for connecting/disconnecting a user's wallet.
 * Shows the connected account or a connect button.
 */
export const WalletConnect = () => {
  const { account, isConnecting, connectWallet, disconnectWallet } = useWeb3();

  if (account) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 px-4 py-2 rounded-lg">
          <p className="text-sm font-mono text-muted-foreground">
            {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        </div>
        <Button 
          variant="ghost"
          size="icon"
          onClick={disconnectWallet}
          title="Disconnect Wallet"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="hero"
      onClick={connectWallet}
      disabled={isConnecting}
      className="gap-2 gradient-btn"
    >
      <Wallet className="h-4 w-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};
