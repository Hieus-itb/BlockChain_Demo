require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  paths: {
    sources: "./",  // Look for .sol files in the root
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};