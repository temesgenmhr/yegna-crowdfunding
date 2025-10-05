
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Rocket, Search, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useState, useEffect } from 'react';
import type { Campaign } from '../services/contractService';
import { WalletConnect } from '../components/WalletConnect';
import { CampaignCard } from '../components/CampaignCard';

// Mock data
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
  {
    id: '4',
    title: 'Community Art Gallery',
    description: 'Create a digital art space showcasing local artists on the blockchain',
    goal: '8',
    raised: '8',
    contributors: 56,
    deadline: 'Completed',
    owner: '0x5555...6666',
  },
];

const Campaigns = () => {
  const navigate = useNavigate();
  const { account, contractService } = useWeb3();
  const [searchQuery, setSearchQuery] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, [contractService]);

  const loadCampaigns = async () => {
    if (!contractService) {
      // Use mock data if contract service is not available
      setCampaigns(mockCampaigns.map((c, idx) => ({
        id: c.id,
        creator: c.owner,
        title: c.title,
        description: c.description,
        goal: c.goal,
        deadline: Math.floor(Date.now() / 1000) + 86400 * 30,
        amountRaised: c.raised,
        withdrawn: false,
        contributorCount: c.contributors,
      })));
      setIsLoading(false);
      return;
    }

    try {
      const allCampaigns = await contractService.getAllCampaigns();
      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      // Fallback to mock data on error
      setCampaigns(mockCampaigns.map((c, idx) => ({
        id: c.id,
        creator: c.owner,
        title: c.title,
        description: c.description,
        goal: c.goal,
        deadline: Math.floor(Date.now() / 1000) + 86400 * 30,
        amountRaised: c.raised,
        withdrawn: false,
        contributorCount: c.contributors,
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">All Campaigns</h2>
            <p className="text-muted-foreground">Discover projects that need your support</p>
          </div>
          <Button
            variant="hero"
            onClick={() => account ? navigate('/create') : null}
            disabled={!account}
            className="gradient-btn"
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Campaign Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard 
                  key={campaign.id} 
                  id={campaign.id}
                  title={campaign.title}
                  description={campaign.description}
                  goal={campaign.goal}
                  raised={campaign.amountRaised}
                  contributors={campaign.contributorCount}
                  deadline={contractService?.formatTimeLeft(campaign.deadline) || 'N/A'}
                  owner={campaign.creator}
                />
              ))}
            </div>

            {filteredCampaigns.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No campaigns found</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Campaigns;