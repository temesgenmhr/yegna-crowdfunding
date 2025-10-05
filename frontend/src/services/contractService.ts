
// Import ethers.js v6 for blockchain interaction
import { ethers, Contract, JsonRpcSigner } from 'ethers';
// Import the compiled CrowdFunding contract ABI
import CrowdFundingABI from '../abis/CrowdFunding.json';
// Import network configuration (addresses, etc.)
import { config } from '../config';

/**
 * Campaign structure as returned by the smart contract.
 */
export interface Campaign {
  id: string; // Campaign ID (stringified number)
  creator: string; // Address of campaign creator
  title: string; // Campaign title
  description: string; // Campaign description
  goal: string; // Goal amount in ETH (as string)
  deadline: number; // Deadline as UNIX timestamp (seconds)
  amountRaised: string; // Amount raised in ETH (as string)
  withdrawn: boolean; // Whether funds have been withdrawn
  contributorCount: number; // Number of contributors
}


/**
 * Service class for interacting with the CrowdFunding smart contract.
 * Provides methods to create campaigns, contribute, withdraw, refund, and query campaign data.
 */
export class ContractService {
  private contract: Contract; // ethers.js Contract instance

  /**
   * Initialize the service with a signer and chainId.
   * @param signer - ethers.js JsonRpcSigner (from wallet)
   * @param chainId - Network chain ID (number or string)
   */
  constructor(signer: JsonRpcSigner, chainId: number | string) {
    // Get contract address from config for the current network
    const address = (config as any)[Number(chainId)]?.CrowdFundingAddress;
    if (!address) throw new Error('CrowdFunding contract address not found for this network');
    this.contract = new Contract(address, CrowdFundingABI.abi, signer);
  }

  /**
   * Create a new crowdfunding campaign.
   * @param title - Campaign title
   * @param description - Campaign description
   * @param goalInEth - Goal amount in ETH (string)
   * @param durationInDays - Duration in days
   * @returns The new campaign's ID as a string
   */
  async createCampaign(
    title: string,
    description: string,
    goalInEth: string,
    durationInDays: number
  ): Promise<string> {
    const goalInWei = ethers.parseEther(goalInEth);
    const tx = await this.contract.createCampaign(title, description, goalInWei, durationInDays);
    const receipt = await tx.wait();
    // Find CampaignCreated event in logs
    const event = receipt?.logs?.map((l: any) => {
      try { return this.contract.interface.parseLog(l); } catch { return null; }
    }).find((e: any) => e && e.name === 'CampaignCreated');
    if (!event) throw new Error('CampaignCreated event not found');
    return event.args.campaignId.toString();
  }

  /**
   * Contribute ETH to a campaign.
   * @param campaignId - Campaign ID
   * @param amountInEth - Amount to contribute in ETH (string)
   */
  async contribute(campaignId: string, amountInEth: string): Promise<void> {
    const amountInWei = ethers.parseEther(amountInEth);
    const tx = await this.contract.contribute(campaignId, { value: amountInWei });
    await tx.wait();
  }

  /**
   * Withdraw funds from a campaign (creator only).
   * @param campaignId - Campaign ID
   */
  async withdrawFunds(campaignId: string): Promise<void> {
    const tx = await this.contract.withdrawFunds(campaignId);
    await tx.wait();
  }

  /**
   * Refund a contributor from a campaign.
   * @param campaignId - Campaign ID
   */
  async refund(campaignId: string): Promise<void> {
    const tx = await this.contract.refund(campaignId);
    await tx.wait();
  }

  /**
   * Get details of a campaign by ID.
   * @param campaignId - Campaign ID
   * @returns Campaign object
   */
  async getCampaign(campaignId: string): Promise<Campaign> {
    const campaign = await this.contract.getCampaign(campaignId);
    const contributorCount = await this.contract.getContributorCount(campaignId);
    return {
      id: campaignId,
      creator: campaign.creator,
      title: campaign.title,
      description: campaign.description,
      goal: ethers.formatEther(campaign.goal),
      deadline: Number(campaign.deadline),
      amountRaised: ethers.formatEther(campaign.amountRaised),
      withdrawn: campaign.withdrawn,
      contributorCount: Number(contributorCount),
    };
  }

  /**
   * Get all campaigns on the contract.
   * @returns Array of Campaign objects
   */
  async getAllCampaigns(): Promise<Campaign[]> {
    // Note: ABI has getCampainCount (typo in contract?)
    const count = await this.contract.getCampainCount();
    const campaigns: Campaign[] = [];
    for (let i = 0; i < Number(count); i++) {
      const campaign = await this.getCampaign(i.toString());
      campaigns.push(campaign);
    }
    return campaigns;
  }

  /**
   * Get the contribution amount for a contributor in a campaign.
   * @param campaignId - Campaign ID
   * @param contributor - Contributor address
   * @returns Amount contributed in ETH (string)
   */
  async getContribution(campaignId: string, contributor: string): Promise<string> {
    const contribution = await this.contract.getContribution(campaignId, contributor);
    return ethers.formatEther(contribution);
  }

  /**
   * Check if a campaign's deadline has passed.
   * @param deadline - Deadline as UNIX timestamp (seconds)
   * @returns True if deadline is passed
   */
  isDeadlinePassed(deadline: number): boolean {
    return Date.now() / 1000 > deadline;
  }

  /**
   * Check if a campaign's goal is reached.
   * @param raised - Amount raised (ETH, string)
   * @param goal - Goal amount (ETH, string)
   * @returns True if raised >= goal
   */
  isGoalReached(raised: string, goal: string): boolean {
    return parseFloat(raised) >= parseFloat(goal);
  }

  /**
   * Format the time left until a campaign's deadline.
   * @param deadline - Deadline as UNIX timestamp (seconds)
   * @returns Human-readable time left string
   */
  formatTimeLeft(deadline: number): string {
    const now = Date.now() / 1000;
    const timeLeft = deadline - now;
    if (timeLeft <= 0) return 'Ended';
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    if (days > 0) return `${days} days left`;
    return `${hours} hours left`;
  }
}
