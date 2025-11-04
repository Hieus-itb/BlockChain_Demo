const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShippingInsurance", function () {
  it("should create a policy and allow oracle to payout", async function () {
    const [owner, insured, oracle] = await ethers.getSigners();

    const Shipping = await ethers.getContractFactory("ShippingInsurance");
    const shipping = await Shipping.deploy();
    await shipping.deployed();

    // Fund contract with some ETH by owner so payouts can be made if needed
    await owner.sendTransaction({ to: shipping.address, value: ethers.utils.parseEther("5") });

    // Insured creates a policy by sending premium
    const premium = ethers.utils.parseEther("0.01");
    const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    await shipping.connect(insured).createPolicy(insured.address, expiry, { value: premium });

    // Owner sets oracle
    await shipping.connect(owner).setOracle(oracle.address);

    // Oracle reports damage for policy 0
    const before = await ethers.provider.getBalance(insured.address);
    await shipping.connect(oracle).reportDamage(0, "evidence-url");
    const after = await ethers.provider.getBalance(insured.address);
    expect(after).to.be.gt(before);
  });
});