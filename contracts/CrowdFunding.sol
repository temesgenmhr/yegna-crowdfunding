// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract CrowdFunding {
    struct Campaign {
        address creator;
        string title;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 amountRaised;
        bool withdrawn;
        mapping(address => uint256) contributions;
        address[] contributors;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goal,
        uint256 deadline
    );

    event ContributionMade(
        uint256 indexed campaignId,
        address indexed,
        uint256 amount
    );

    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    event RefundIssued(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _durationInDays
    ) external returns (uint256) {
        require(_goal > 0, "Goal must be greater than 0");
        require(_durationInDays > 0, "Duration must be greater than 0");

        uint256 campaignId = campaignCount++;
        Campaign storage newCampaign = campaigns[campaignId];

        newCampaign.creator = msg.sender;
        newCampaign.title = _title;
        newCampaign.description = _description;
        newCampaign.goal = _goal;
        newCampaign.deadline = block.timestamp + (_durationInDays * 1 days);
        newCampaign.amountRaised = 0;
        newCampaign.withdrawn = false;

        emit CampaignCreated(
            campaignId,
            msg.sender,
            _title,
            _goal,
            newCampaign.deadline
        );
        return campaignId;
    }

    function contribute(uint256 _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId];

        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(msg.value > 0, "Contribution must be greater than 0");

        if (campaign.contributions[msg.sender] == 0) {
            campaign.contributors.push(msg.sender);
        }
        campaign.contributions[msg.sender] += msg.value;
        campaign.amountRaised += msg.value;

        emit ContributionMade(_campaignId, msg.sender, msg.value);
    }

    function withdrawFunds(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(
            msg.sender == campaign.creator,
            "Only the campaign creator can withdraw funds"
        );
        require(
            block.timestamp >= campaign.deadline,
            "Campaign is still ongoing"
        );
        require(
            campaign.amountRaised >= campaign.goal,
            "Funding goal not reached"
        );
        require(!campaign.withdrawn, "Funds have already been withdrawn");

        campaign.withdrawn = true;
        uint256 amount = campaign.amountRaised;

        (bool success, ) = (payable(campaign.creator).call{value: amount}(""));
        require(success, "Transfer failed");

        emit FundsWithdrawn(_campaignId, campaign.creator, amount);
    }

    function refund(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];

        require(
            block.timestamp >= campaign.deadline,
            "Campaign is still ongoing"
        );
        require(
            campaign.amountRaised < campaign.goal,
            "Funding goal was reached; no refunds"
        );
        uint256 contributedAmount = campaign.contributions[msg.sender];
        require(contributedAmount > 0, "No contributions to refund");

        campaign.contributions[msg.sender] = 0;
        campaign.amountRaised -= contributedAmount;

        (bool success, ) = (
            payable(msg.sender).call{value: contributedAmount}("")
        );
        require(success, "Refund transfer failed");

        emit RefundIssued(_campaignId, msg.sender, contributedAmount);
    }

    function getCampaign(
        uint256 _campaignId
    )
        external
        view
        returns (
            address creator,
            string memory title,
            string memory description,
            uint256 goal,
            uint256 deadline,
            uint256 amountRaised,
            bool withdrawn
        )
    {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.creator,
            campaign.title,
            campaign.description,
            campaign.goal,
            campaign.deadline,
            campaign.amountRaised,
            campaign.withdrawn
        );
    }

    function getContribution(uint256 _campaignId, address _contributor) external view returns(uint256) {
        return campaigns[_campaignId].contributions[_contributor];
    }

    function getContributorCount(uint256 _campaignId) external view returns (uint256){
        return campaigns[_campaignId].contributors.length;
    }

    function getCampainCount() external view returns (uint256) {
        return campaignCount;
    }
}
