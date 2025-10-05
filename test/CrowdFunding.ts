import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CrowdFunding", function () {
  async function increaseTime(seconds: number | bigint) {
    // advance EVM time and mine a block
    await ethers.provider.send("evm_increaseTime", [Number(seconds)]);
    await ethers.provider.send("evm_mine", []);
  }

  const oneDay = 24n * 60n * 60n;

  let owner: any;
  let alice: any;
  let bob: any;
  let crowd: any;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    crowd = await ethers.deployContract("CrowdFunding");
  });

  it("creates a campaign and stores initial data correctly", async function () {
    const title = "Save The Forest";
    const description = "Plant a million trees";
    const goal = ethers.parseEther("10");
    const duration = 1n; // days

    const tx = await crowd.createCampaign(title, description, goal, duration);

    // Verify event emission with expected args (deadline checked below)
    await expect(tx).to.emit(crowd, "CampaignCreated");

    // Verify stored data via getter
    const campaignId = 0n; // first campaign on a fresh deployment
    const [creator, gotTitle, gotDesc, gotGoal, deadline, amountRaised, withdrawn] =
      await crowd.getCampaign(campaignId);

    expect(creator).to.equal(owner.address);
    expect(gotTitle).to.equal(title);
    expect(gotDesc).to.equal(description);
    expect(gotGoal).to.equal(goal);
    expect(amountRaised).to.equal(0n);
    expect(withdrawn).to.equal(false);

    // Check deadline equals block.timestamp + durationInDays * 1 day
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt!.blockNumber);
    const expectedDeadline = BigInt(block!.timestamp) + duration * oneDay;
    expect(deadline).to.equal(expectedDeadline);

    // Check campaign count
    expect(await crowd.getCampainCount()).to.equal(1n);
  });

  it("accepts contributions, tracks amounts and contributors, and emits events", async function () {
    const goal = ethers.parseEther("5");
    await crowd.createCampaign("Title", "Desc", goal, 1n);

    const campaignId = 0n;

    // Alice contributes 1 ETH (twice)
    await expect(
      crowd.connect(alice).contribute(campaignId, { value: ethers.parseEther("1") })
    )
      .to.emit(crowd, "ContributionMade")
      .withArgs(campaignId, alice.address, ethers.parseEther("1"));

    await expect(
      crowd.connect(alice).contribute(campaignId, { value: ethers.parseEther("2") })
    )
      .to.emit(crowd, "ContributionMade")
      .withArgs(campaignId, alice.address, ethers.parseEther("2"));

    // Bob contributes 2 ETH
    await expect(
      crowd.connect(bob).contribute(campaignId, { value: ethers.parseEther("2") })
    )
      .to.emit(crowd, "ContributionMade")
      .withArgs(campaignId, bob.address, ethers.parseEther("2"));

    // Total raised: 5 ETH
    const [, , , , , amountRaised] = await crowd.getCampaign(campaignId);
    expect(amountRaised).to.equal(ethers.parseEther("5"));

    // Per-contributor amounts
    expect(await crowd.getContribution(campaignId, alice.address)).to.equal(
      ethers.parseEther("3"),
    );
    expect(await crowd.getContribution(campaignId, bob.address)).to.equal(
      ethers.parseEther("2"),
    );

    // Contributor count must be 2 (alice only counted once)
    expect(await crowd.getContributorCount(campaignId)).to.equal(2n);

    // Reject zero-value contributions
    await expect(
      crowd.connect(alice).contribute(campaignId, { value: 0 })
    ).to.be.revertedWith("Contribution must be greater than 0");
  });

  it("rejects contributions after deadline", async function () {
    await crowd.createCampaign("Title", "Desc", ethers.parseEther("1"), 1n);
    const campaignId = 0n;

    // move time forward beyond deadline
    await increaseTime(oneDay + 1n);

    await expect(
      crowd.connect(alice).contribute(campaignId, { value: ethers.parseEther("0.1") })
    ).to.be.revertedWith("Campaign has ended");
  });

  it("allows creator to withdraw only after deadline and when goal reached", async function () {
    const goal = ethers.parseEther("3");
    await crowd.createCampaign("Title", "Desc", goal, 1n);
    const campaignId = 0n;

    // Fund below goal first
    await crowd.connect(alice).contribute(campaignId, { value: ethers.parseEther("1") });

    // Non-creator cannot withdraw
    await expect(crowd.connect(alice).withdrawFunds(campaignId)).to.be.revertedWith(
      "Only the campaign creator can withdraw funds",
    );

    // Creator cannot withdraw before deadline
    await expect(crowd.connect(owner).withdrawFunds(campaignId)).to.be.revertedWith(
      "Campaign is still ongoing",
    );

    // Top-up to reach goal
    await crowd.connect(bob).contribute(campaignId, { value: ethers.parseEther("2") });

    // After deadline, creator can withdraw
    await increaseTime(oneDay + 1n);

    const contractAddress = crowd.target as string;
    const preBalance = await ethers.provider.getBalance(contractAddress);
    expect(preBalance).to.equal(goal);

    await expect(crowd.connect(owner).withdrawFunds(campaignId))
      .to.emit(crowd, "FundsWithdrawn")
      .withArgs(campaignId, owner.address, goal);

    const postBalance = await ethers.provider.getBalance(contractAddress);
    expect(postBalance).to.equal(0n);

    // Cannot withdraw twice
    await expect(crowd.connect(owner).withdrawFunds(campaignId)).to.be.revertedWith(
      "Funds have already been withdrawn",
    );
  });

  it("prevents withdrawal when goal not reached after deadline", async function () {
    const goal = ethers.parseEther("10");
    await crowd.createCampaign("Title", "Desc", goal, 1n);
    const campaignId = 0n;

    // Only 2 ETH raised
    await crowd.connect(alice).contribute(campaignId, { value: ethers.parseEther("2") });

    await increaseTime(oneDay + 1n);

    await expect(crowd.connect(owner).withdrawFunds(campaignId)).to.be.revertedWith(
      "Funding goal not reached",
    );
  });

  it("issues refunds to contributors when goal not reached after deadline", async function () {
    const goal = ethers.parseEther("5");
    await crowd.createCampaign("Title", "Desc", goal, 1n);
    const campaignId = 0n;

    // Raise 3 ETH total
    await crowd.connect(alice).contribute(campaignId, { value: ethers.parseEther("1") });
    await crowd.connect(bob).contribute(campaignId, { value: ethers.parseEther("2") });

    await increaseTime(oneDay + 1n);

    // Refund Alice
    await expect(crowd.connect(alice).refund(campaignId))
      .to.emit(crowd, "RefundIssued")
      .withArgs(campaignId, alice.address, ethers.parseEther("1"));

    // Alice contribution reset
    expect(await crowd.getContribution(campaignId, alice.address)).to.equal(0n);

    // Refund Bob
    await expect(crowd.connect(bob).refund(campaignId))
      .to.emit(crowd, "RefundIssued")
      .withArgs(campaignId, bob.address, ethers.parseEther("2"));

    // Bob contribution reset
    expect(await crowd.getContribution(campaignId, bob.address)).to.equal(0n);

    // Contract balance should be 0 after both refunds
    const contractBalance = await ethers.provider.getBalance(crowd.target as string);
    expect(contractBalance).to.equal(0n);

    // Double refund should fail
    await expect(crowd.connect(alice).refund(campaignId)).to.be.revertedWith(
      "No contributions to refund",
    );
  });

  it("disallows refunds when goal is reached", async function () {
    const goal = ethers.parseEther("2");
    await crowd.createCampaign("Title", "Desc", goal, 1n);
    const campaignId = 0n;

    await crowd.connect(alice).contribute(campaignId, { value: ethers.parseEther("1") });
    await crowd.connect(bob).contribute(campaignId, { value: ethers.parseEther("1") });

    await increaseTime(oneDay + 1n);

    await expect(crowd.connect(alice).refund(campaignId)).to.be.revertedWith(
      "Funding goal was reached; no refunds",
    );
  });
});
