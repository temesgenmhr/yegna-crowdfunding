import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Users, Calendar, View } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CampaignCardProps {
  id: string;
  title: string;
  description: string;
  goal: string;
  raised: string;
  contributors: number;
  deadline: string;
  owner: string;
}

export const CampaignCard = ({
  id,
  title,
  description,
  goal,
  raised,
  contributors,
  deadline,
}: CampaignCardProps) => {
  const navigate = useNavigate();
  const progress = (parseFloat(raised) / parseFloat(goal)) * 100;

  return (
    <Card className="bg-gradient-card border-border/50 p-6 hover:shadow-glow transition-all duration-300 backdrop-blur-sm">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2">{description}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Raised</span>
            <span className="font-semibold">{raised} ETH / {goal} ETH</span>
          </div>
          <Progress value={progress} className="h-2 text-primary" />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{contributors} contributors</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{deadline}</span>
          </div>
        </div>

        <Button
          variant="glass"
          className="w-full gradient-btn"
          onClick={() => navigate(`/campaign/${id}`)}
        >
          <View className="h-4 w-4 mr-2" />
          View Campaign
        </Button>
      </div>
    </Card>
  );
};