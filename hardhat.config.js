require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-web3");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  settings: {
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
};
