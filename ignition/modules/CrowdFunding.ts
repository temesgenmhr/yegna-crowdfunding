import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CrowdFundingModule = buildModule("CrowdFundingModule", (m) => {
    const crowdFunding = m.contract("CrowdFunding");
    return { crowdFunding };
});

export default CrowdFundingModule;