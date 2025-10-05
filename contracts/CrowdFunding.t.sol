// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "./CrowdFunding.sol";

contract CrowdFundingTest is Test {
    CrowdFunding crowdfunding;
    address creator = address(0x1);
    address contributor1 = address(0x2);
    address contributor2 = address(0x3);

    function setUp() public {
        crowdfunding = new CrowdFunding();
        // Fund addresses with ETH
        vm.deal(creator, 10 ether);
        vm.deal(contributor1, 10 ether);
        vm.deal(contributor2, 10 ether);
    }

    function testCreateCampaign() public {
        vm.prank(creator);
        uint256 campaignId = crowdfunding.createCampaign("Test", "Desc", 1 ether, 10);
        (
            address _creator,
            string memory title,
            string memory description,
            uint256 goal,
            uint256 deadline,
            uint256 amountRaised,
            bool withdrawn
        ) = crowdfunding.getCampaign(campaignId);
        assertEq(_creator, creator);
        assertEq(title, "Test");
        assertEq(description, "Desc");
        assertEq(goal, 1 ether);
        assertEq(deadline, block.timestamp + 10 days);
        assertEq(amountRaised, 0);
        assertEq(withdrawn, false);
    }

    function testContribute() public {
        vm.prank(creator);
        uint256 campaignId = crowdfunding.createCampaign("Test", "Desc", 1 ether, 10);
        vm.prank(contributor1);
        crowdfunding.contribute{value: 0.5 ether}(campaignId);
        assertEq(crowdfunding.getContribution(campaignId, contributor1), 0.5 ether);
        assertEq(crowdfunding.getContributorCount(campaignId), 1);
        vm.prank(contributor2);
        crowdfunding.contribute{value: 0.5 ether}(campaignId);
        assertEq(crowdfunding.getContribution(campaignId, contributor2), 0.5 ether);
        assertEq(crowdfunding.getContributorCount(campaignId), 2);
        // Verify campaign's total amount raised
        (,,,,, uint256 amountRaised,) = crowdfunding.getCampaign(campaignId);
        assertEq(amountRaised, 1 ether);
    }

    function testWithdrawFunds() public {
        vm.prank(creator);
        uint256 campaignId = crowdfunding.createCampaign("Test", "Desc", 1 ether, 1);
        vm.prank(contributor1);
        crowdfunding.contribute{value: 1 ether}(campaignId);
        // Fast forward time
        vm.warp(block.timestamp + 2 days);
        // Record initial balance
        uint256 initialBalance = creator.balance;
        vm.prank(creator);
        crowdfunding.withdrawFunds(campaignId);
        (, , , , , , bool withdrawn) = crowdfunding.getCampaign(campaignId);
        assertTrue(withdrawn);
        // Verify creator received funds
        assertEq(creator.balance, initialBalance + 1 ether);
    }

    function testRefund() public {
        vm.prank(creator);
        uint256 campaignId = crowdfunding.createCampaign("Test", "Desc", 2 ether, 1);
        vm.prank(contributor1);
        crowdfunding.contribute{value: 1 ether}(campaignId);
        // Fast forward time
        vm.warp(block.timestamp + 2 days);
        // Record initial balance
        uint256 initialBalance = contributor1.balance;
        vm.prank(contributor1);
        crowdfunding.refund(campaignId);
        assertEq(crowdfunding.getContribution(campaignId, contributor1), 0);
        // Verify contributor received refund
        assertEq(contributor1.balance, initialBalance + 1 ether);
    }

    function testContributeAfterDeadlineReverts() public {
        vm.prank(creator);
        uint256 campaignId = crowdfunding.createCampaign("Test", "Desc", 1 ether, 1);
        vm.warp(block.timestamp + 2 days);
        vm.prank(contributor1);
        vm.expectRevert("Campaign has ended");
        crowdfunding.contribute{value: 1 ether}(campaignId);
    }

    function testWithdrawByNonCreatorReverts() public {
        vm.prank(creator);
        uint256 campaignId = crowdfunding.createCampaign("Test", "Desc", 1 ether, 1);
        vm.prank(contributor1);
        crowdfunding.contribute{value: 1 ether}(campaignId);
        vm.warp(block.timestamp + 2 days);
        vm.prank(contributor1);
        vm.expectRevert("Only the campaign creator can withdraw funds");
        crowdfunding.withdrawFunds(campaignId);
    }

    function testRefundWhenGoalMetReverts() public {
        vm.prank(creator);
        uint256 campaignId = crowdfunding.createCampaign("Test", "Desc", 1 ether, 1);
        vm.prank(contributor1);
        crowdfunding.contribute{value: 1 ether}(campaignId);
        vm.warp(block.timestamp + 2 days);
        vm.prank(contributor1);
        vm.expectRevert("Funding goal was reached; no refunds");
        crowdfunding.refund(campaignId);
    }
}