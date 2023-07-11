const { ethers } = require("hardhat");

/**
 * Start with "npx hardhat node"
 * then run " npx hardhat run --network localhost scripts/PrintEvent.js"
 */

let owner, addr1, addr2, addr3;
let erc20TokenContract;
let tokenClaimContract;

async function deploy() {
  // Get signers
  [owner, addr1, addr2, addr3] = await ethers.getSigners();

  // Deploy ERC20TokenContract
  erc20TokenContract = await ethers.deployContract("MyToken");

  // Deploy TokenClaimContract and grant role to ERC20TokenContract
  tokenClaimContract = await ethers.deployContract("TokenClaim", [erc20TokenContract.target]);
  await erc20TokenContract.grantRole(tokenClaimContract.target);
}

async function setUpWhiteListing(address) {
  await tokenClaimContract.addWhitelistedUser(address);
}

async function main() {
  await deploy();
  /**
   * Event Listener will print whenever the transaction is started 
   * */
  tokenClaimContract.on("Whitelisted", (user) => {
    console.log("Whitelisted Event", user);
  });

  /** Used setTimeout to represent the event printed on console log */
  setTimeout(() => setUpWhiteListing(addr1.address), 5000);
  setTimeout(() => setUpWhiteListing(addr2.address), 10000);
  setTimeout(() => setUpWhiteListing(addr3.address), 15000);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
