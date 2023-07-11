const hre = require("hardhat");

/**
 * From what I can understand we have to use queryfilter from etherjs library to query the missed events from the
 * startingBlock to the lastestBlock or to block number where the event are missed
 * Run bye Following
 * npx hardhat node
 * npx hardhat run --network localhost scripts/MissedEventsScript.js
 */


let owner, addr1, addr2, addr3;
let erc20TokenContract;
let tokenClaimContract;
let startingBlock;

async function deploy() {
    // Get signers
    [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();
    // Deploy ERC20TokenContract
    erc20TokenContract = await hre.ethers.deployContract("MyToken");

    // Deploy TokenClaimContract and grant role to ERC20TokenContract
    tokenClaimContract = await hre.ethers.deployContract("TokenClaim", [erc20TokenContract.target]);
    await erc20TokenContract.grantRole(tokenClaimContract.target);
}

async function setUp() {
    await tokenClaimContract.addWhitelistedUser(addr1.address);
    // let's suppose here out blockchain events were missed
    // we will take block number from this tx and get all the events from this the latest block
    const tx = await tokenClaimContract.addWhitelistedUser(addr2.address);
    startingBlock = tx.blockNumber;
    await tokenClaimContract.addWhitelistedUser(addr3.address);

    await tokenClaimContract.connect(addr1).claim();
    await tokenClaimContract.connect(addr2).claim();
    await tokenClaimContract.connect(addr3).claim();


}
async function main() {

    await deploy();
    await setUp();
    // we will use queryfilter from etherJS Library to get the emmitted log events from the starting
    // block to current block
    let latestBlock = await hre.ethers.provider.getBlock("latest")
    console.log(latestBlock.number, startingBlock)
    const missedEventsWhiteListed = await tokenClaimContract.queryFilter('Whitelisted', startingBlock, latestBlock.number);
    console.log(missedEventsWhiteListed)
    const missedEventsClaim = await tokenClaimContract.queryFilter('Claimed', startingBlock, latestBlock.number);
    console.log(missedEventsClaim)


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
