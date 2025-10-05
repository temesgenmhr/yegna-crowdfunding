import { WalletConnect } from "../components/WalletConnect";
import { Button } from "../components/ui/button";
import { CampaignCard } from "../components/CampaignCard";
import { Rocket, Shield, Zap, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";


// Mock data for demonstration
const mockCampaigns = [
  {
    id: '1',
    title: 'Decentralized Education Platform',
    description: 'Building a blockchain-based learning platform for underserved communities',
    goal: '10',
    raised: '6.5',
    contributors: 42,
    deadline: '30 days left',
    owner: '0x1234...5678',
  },
  {
    id: '2',
    title: 'Green Energy Initiative',
    description: 'Fund solar panel installations in rural areas using blockchain transparency',
    goal: '25',
    raised: '18.3',
    contributors: 87,
    deadline: '15 days left',
    owner: '0xabcd...efgh',
  },
  {
    id: '3',
    title: 'Open Source Healthcare',
    description: 'Develop open-source medical software for developing nations',
    goal: '15',
    raised: '4.2',
    contributors: 23,
    deadline: '45 days left',
    owner: '0x9876...4321',
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { account } = useWeb3();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-8 w-8 text-primary " />
            <h1 className="text-2xl font-bold gradient-text">
              Yegna Crowdfunding
            </h1>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            Fund Innovation on the
            <span className="gradient-text">
              {' '}Blockchain
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A decentralized crowdfunding platform where transparency meets innovation.
            Create campaigns, contribute securely, and track progress on Ethereum.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button
              variant="hero"
              size="lg"
              onClick={() => account ? navigate('/create') : null}
              disabled={!account}
              className="gradient-btn "
            >
              <Plus className="h-5 w-5" />
              Create Campaign
            </Button>
            <Button variant="glass" size="lg" onClick={() => navigate('/campaigns')} className="gradient-btn">
              Explore Campaigns
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="bg-gradient-card border border-border/50 rounded-lg p-6 backdrop-blur-sm">
            <Shield className="h-12 w-12 text-primary mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">Secure & Transparent</h3>
            <p className="text-muted-foreground">
              All transactions on blockchain, fully auditable and secure
            </p>
          </div>
          <div className="bg-gradient-card border border-border/50 rounded-lg p-6 backdrop-blur-sm">
            <Zap className="h-12 w-12 text-accent mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">Fast & Efficient</h3>
            <p className="text-muted-foreground">
              Instant transactions on Ethereum testnet with low fees
            </p>
          </div>
          <div className="bg-gradient-card border border-border/50 rounded-lg p-6 backdrop-blur-sm">
            <Rocket className="h-12 w-12 text-primary mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">Global Access</h3>
            <p className="text-muted-foreground">
              Connect with backers worldwide, no borders or restrictions
            </p>
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Campaigns</h2>
          <Button variant="ghost" onClick={() => navigate('/campaigns')}>
            View All
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} {...campaign} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2024 Yegna Crowdfunding. Powered by Ethereum.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

