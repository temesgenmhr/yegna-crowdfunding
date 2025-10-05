import { WalletConnect } from '../components/WalletConnect';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Rocket, ArrowLeft, Target, Users, Calendar, User, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useState, useEffect } from 'react';
// Fallback toast implementation if use-toast is missing
const toast = (opts: { title: string; description?: string; variant?: string }) => {
  if (opts.variant === 'destructive') {
    alert(`${opts.title}\n${opts.description || ''}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`${opts.title}: ${opts.description || ''}`);
  }
};
import type { Campaign } from '../services/contractService';

// Mock campaign data
const mockCampaign = {
  id: '1',
  title: 'Decentralized Education Platform',
  description: 'Building a blockchain-based learning platform for underserved communities worldwide. Our mission is to provide quality education through decentralized technology, ensuring transparency and accessibility for all learners.',
  fullDescription: `This campaign aims to revolutionize education by leveraging blockchain technology to create a transparent, accessible, and high-quality learning platform. 

Key Features:
• Decentralized content management
• Blockchain-verified certificates
• Peer-to-peer learning networks
• Transparent fund allocation

The funds will be used for:
- Platform development (40%)
- Content creation (30%)
- Community outreach (20%)
- Operational costs (10%)`,
  goal: '10',
  raised: '6.5',
  contributors: 42,
  deadline: '30 days left',
  owner: '0x1234567890abcdef1234567890abcdef12345678',
};

const CampaignDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { account, contractService } = useWeb3();
  const [contributionAmount, setContributionAmount] = useState('');
  const [isContributing, setIsContributing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userContribution, setUserContribution] = useState('0');

  useEffect(() => {
    loadCampaign();
  }, [id, contractService, account]);

  const loadCampaign = async () => {
    if (!id) return;

    if (!contractService) {
      // Use mock data if contract service is not available
      setCampaign({
        id: mockCampaign.id,
        creator: mockCampaign.owner,
        title: mockCampaign.title,
        description: mockCampaign.fullDescription,
        goal: mockCampaign.goal,
        deadline: Math.floor(Date.now() / 1000) + 86400 * 30,
        amountRaised: mockCampaign.raised,
        withdrawn: false,
        contributorCount: mockCampaign.contributors,
      });
      setIsLoading(false);
      return;
    }

    try {
      const campaignData = await contractService.getCampaign(id);
      setCampaign(campaignData);

      if (account) {
        const contribution = await contractService.getContribution(id, account);
        setUserContribution(contribution);
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = (parseFloat(campaign.amountRaised) / parseFloat(campaign.goal)) * 100;
  const isOwner = account?.toLowerCase() === campaign.creator.toLowerCase();
  const isDeadlinePassed = contractService?.isDeadlinePassed(campaign.deadline) || false;
  const isGoalReached = contractService?.isGoalReached(campaign.amountRaised, campaign.goal) || false;

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account || !contractService || !id) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to contribute",
        variant: "destructive",
      });
      return;
    }

    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid contribution amount",
        variant: "destructive",
      });
      return;
    }

    if (isDeadlinePassed) {
      toast({
        title: "Campaign Ended",
        description: "This campaign has already ended",
        variant: "destructive",
      });
      return;
    }

    setIsContributing(true);
    
    try {
      await contractService.contribute(id, contributionAmount);
      
      toast({
        title: "Contribution Successful!",
        description: `You contributed ${contributionAmount} ETH to this campaign`,
      });
      setContributionAmount('');
      
      // Reload campaign data
      await loadCampaign();
    } catch (error: any) {
      console.error('Error contributing:', error);
      toast({
        title: "Contribution Failed",
        description: error.message || "Failed to contribute to campaign",
        variant: "destructive",
      });
    } finally {
      setIsContributing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!account || !contractService || !id) return;

    if (!isGoalReached) {
      toast({
        title: "Goal Not Reached",
        description: "Cannot withdraw funds until the goal is reached",
        variant: "destructive",
      });
      return;
    }

    if (!isDeadlinePassed) {
      toast({
        title: "Campaign Active",
        description: "Cannot withdraw funds until the deadline has passed",
        variant: "destructive",
      });
      return;
    }

    setIsWithdrawing(true);
    
    try {
      await contractService.withdrawFunds(id);
      
      toast({
        title: "Withdrawal Successful!",
        description: "Funds have been transferred to your wallet",
      });
      
      // Reload campaign data
      await loadCampaign();
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to withdraw funds",
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleRefund = async () => {
    if (!account || !contractService || !id) return;

    if (!isDeadlinePassed) {
      toast({
        title: "Campaign Active",
        description: "Cannot request refund until the deadline has passed",
        variant: "destructive",
      });
      return;
    }

    if (isGoalReached) {
      toast({
        title: "Goal Reached",
        description: "Cannot refund when the campaign goal has been reached",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(userContribution) === 0) {
      toast({
        title: "No Contribution",
        description: "You have not contributed to this campaign",
        variant: "destructive",
      });
      return;
    }

    setIsRefunding(true);
    
    try {
      await contractService.refund(id);
      
      toast({
        title: "Refund Successful!",
        description: "Your contribution has been refunded",
      });
      
      // Reload campaign data
      await loadCampaign();
    } catch (error: any) {
      console.error('Error refunding:', error);
      toast({
        title: "Refund Failed",
        description: error.message || "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Rocket className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold gradient-text">
              Yegna Crowdfunding
            </h1>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate('/campaigns')} className="mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Campaign Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">{campaign.title}</h1>
              <p className="text-lg text-muted-foreground">{campaign.description}</p>
            </div>

            {/* Progress */}
            <Card className="bg-gradient-card border-border/50 p-6 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold">{campaign.amountRaised} ETH</span>
                  <span className="text-muted-foreground">of {campaign.goal} ETH</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Goal</p>
                      <p className="font-semibold">{campaign.goal} ETH</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Backers</p>
                      <p className="font-semibold">{campaign.contributorCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time Left</p>
                      <p className="font-semibold">
                        {contractService?.formatTimeLeft(campaign.deadline) || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                {isGoalReached && (
                  <div className="pt-2 text-sm font-semibold text-green-500">
                    ✓ Goal Reached!
                  </div>
                )}
                {isDeadlinePassed && (
                  <div className="pt-2 text-sm font-semibold text-yellow-500">
                    Campaign Ended
                  </div>
                )}
              </div>
            </Card>

            {/* Full Description */}
            <Card className="bg-gradient-card border-border/50 p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-4">Campaign Story</h2>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-line text-muted-foreground">
                  {campaign.description}
                </p>
              </div>
            </Card>

            {/* Owner Actions */}
            {isOwner && (
              <Card className="bg-gradient-card border-border/50 p-6 backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-4">Creator Actions</h2>
                <div className="space-y-4">
                  <Button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing || !isGoalReached || !isDeadlinePassed || campaign.withdrawn}
                    variant="hero"
                    className="w-full gradient-btn"
                  >
                    {isWithdrawing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Withdrawing...
                      </>
                    ) : (
                      'Withdraw Funds'
                    )}
                  </Button>
                  {campaign.withdrawn && (
                    <p className="text-sm text-muted-foreground text-center">
                      Funds have been withdrawn
                    </p>
                  )}
                  {!isDeadlinePassed && (
                    <p className="text-sm text-muted-foreground text-center">
                      Withdrawal available after deadline
                    </p>
                  )}
                  {!isGoalReached && isDeadlinePassed && (
                    <p className="text-sm text-yellow-500 text-center">
                      Goal not reached - contributors can request refunds
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Contributor Actions */}
            {!isOwner && parseFloat(userContribution) > 0 && (
              <Card className="bg-gradient-card border-border/50 p-6 backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-4">Your Contribution</h2>
                <div className="space-y-4">
                  <p className="text-lg">
                    You have contributed <span className="font-bold">{userContribution} ETH</span>
                  </p>
                  {!isGoalReached && isDeadlinePassed && (
                    <Button
                      onClick={handleRefund}
                      disabled={isRefunding}
                      variant="outline"
                      className="w-full"
                    >
                      {isRefunding ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing Refund...
                        </>
                      ) : (
                        'Request Refund'
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Creator */}
            <Card className="bg-gradient-card border-border/50 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Campaign Creator</p>
                  <p className="font-mono text-sm">{campaign.creator}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Contribution Card */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-card border-border/50 p-6 backdrop-blur-sm sticky top-24">
              <h3 className="text-2xl font-bold mb-6">Back this project</h3>
              {isDeadlinePassed ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">This campaign has ended</p>
                </div>
              ) : (
                <form onSubmit={handleContribute} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Contribution Amount (ETH)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={contributionAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContributionAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    onClick={() => setContributionAmount('0.1')}
                  >
                    0.1 ETH
                  </Button>
                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    onClick={() => setContributionAmount('0.5')}
                  >
                    0.5 ETH
                  </Button>
                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    onClick={() => setContributionAmount('1')}
                  >
                    1 ETH
                  </Button>
                </div>

                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full gradient-btn"
                    disabled={isContributing || !account}
                  >
                    {isContributing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Contribute Now'
                    )}
                  </Button>

                  {!account && (
                    <p className="text-sm text-muted-foreground text-center">
                      Connect your wallet to contribute
                    </p>
                  )}
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-border/50 space-y-2 text-sm text-muted-foreground">
                <p>✓ Secure blockchain transactions</p>
                <p>✓ Full transparency</p>
                <p>✓ Instant confirmation</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CampaignDetail;