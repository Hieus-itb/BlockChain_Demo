const { ethers } = require("hardhat");

async function main() {
  const Shipping = await ethers.getContractFactory("ShippingInsurance");
  const shipping = await Shipping.deploy();
  await shipping.deployed();
  console.log("ShippingInsurance deployed to:", shipping.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});