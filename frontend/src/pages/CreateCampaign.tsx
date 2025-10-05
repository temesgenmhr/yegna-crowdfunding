import { WalletConnect } from '../components/WalletConnect';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Rocket, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useState } from 'react';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
// Fallback toast implementation if use-toast is missing
const toast = (opts: { title: string; description?: string; variant?: string }) => {
    if (opts.variant === 'destructive') {
        alert(`${opts.title}\n${opts.description || ''}`);
    } else {
        // eslint-disable-next-line no-console
        console.log(`${opts.title}: ${opts.description || ''}`);
    }
};

const CreateCampaign = () => {
    const { contractService } = useWeb3();

    const navigate = useNavigate();
    const { account } = useWeb3();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        goal: '',
        deadline: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!account) {
            toast({
                title: "Wallet not connected",
                description: "Please connect your wallet to create a campaign",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {

            if (!contractService) {
                throw new Error("Contract service not initialized");
            }

            await contractService.createCampaign(
                formData.title,
                formData.description,
                formData.goal,
                parseInt(formData.deadline)
            );

            toast({
                title: "Campaign Created!",
                description: "Your campaign has been successfully deployed to the blockchain",
            });
            navigate('/campaigns');
        } catch (error: any) {
            console.error('Error creating campaign:', error);
            toast({
                title: "Creation Failed",
                description: error.message || "Failed to create campaign",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
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
            <main className="container mx-auto px-4 py-12 max-w-3xl">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                <div className="mb-8">
                    <h2 className="text-4xl font-bold mb-2">Create Campaign</h2>
                    <p className="text-muted-foreground">Launch your project on the blockchain</p>
                </div>

                <Card className="bg-gradient-card border-border/50 p-8 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Campaign Title</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="Enter campaign title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe your campaign and what you plan to achieve..."
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={6}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="goal">Funding Goal (ETH)</Label>
                                <Input
                                    id="goal"
                                    name="goal"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.goal}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deadline">Deadline (Days)</Label>
                                <Input
                                    id="deadline"
                                    name="deadline"
                                    type="number"
                                    placeholder="30"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                variant="hero"  
                                className="w-full gradient-btn"
                                disabled={isSubmitting || !account}
                            >
                                {isSubmitting ? 'Creating Campaign...' : 'Create Campaign'}
                            </Button>
                            {!account && (
                                <p className="text-sm text-muted-foreground text-center mt-2">
                                    Connect your wallet to create a campaign
                                </p>
                            )}
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
};

export default CreateCampaign;