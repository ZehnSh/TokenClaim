const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require('@nomicfoundation/hardhat-network-helpers');


describe("TokenClaim Contract", () => {
    let owner, addr1, addr2, addr3;
    let tokenClaimContract;
    let erc20TokenContract;

    beforeEach(async () => {
        // Get signers
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        // Deploy ERC20TokenContract
        erc20TokenContract = await ethers.deployContract("MyToken");

        // Deploy TokenClaimContract and grant role to ERC20TokenContract
        tokenClaimContract = await ethers.deployContract("TokenClaim", [erc20TokenContract.target]);
        await erc20TokenContract.grantRole(tokenClaimContract.target);
    });

    it("should be deployed correctly", async () => {
        // Check addresses of deployed contracts
        expect(await tokenClaimContract.getTokenAddress()).to.equal(erc20TokenContract.target);
    });

    it("should add and remove whitelisted users correctly", async () => {
        // Add addr1 to the whitelist
        await expect(tokenClaimContract.addWhitelistedUser(addr1.address)).to.emit(tokenClaimContract, "Whitelisted").withArgs(addr1.address);
        expect(await tokenClaimContract.isWhitelisted(addr1.address)).to.equal(true);

        // Attempt to add addr1 again (should revert)
        await expect(tokenClaimContract.addWhitelistedUser(addr1.address)).to.be.revertedWithCustomError(tokenClaimContract, 'AlreadyWhitelisted');

        // Remove addr1 from the whitelist
        await tokenClaimContract.removeWhitelistedUser(addr1.address);
        expect(await tokenClaimContract.isWhitelisted(addr1.address)).to.equal(false);

        // Attempt to remove addr1 again (should revert)
        await expect(tokenClaimContract.removeWhitelistedUser(addr1.address)).to.be.revertedWithCustomError(tokenClaimContract, 'NotWhitelisted');
    });

    it("should not allow whitelisted user to claim tokens before claim interval", async () => {
        // Attempt to claim tokens before being whitelisted (should revert)
        await expect(tokenClaimContract.connect(addr1).claim()).to.be.revertedWithCustomError(tokenClaimContract, 'NotWhitelisted');

        // Add addr1 to the whitelist
        await tokenClaimContract.addWhitelistedUser(addr1.address);
        expect(await tokenClaimContract.isWhitelisted(addr1.address)).to.equal(true);

        // Claim tokens
        await tokenClaimContract.connect(addr1).claim();
        expect(await erc20TokenContract.balanceOf(addr1.address)).to.equal(100);

        // Attempt to claim tokens again before claim interval (should revert)
        await expect(tokenClaimContract.connect(addr1).claim()).to.be.revertedWithCustomError(tokenClaimContract, 'ClaimIntervalNotPassed');
    });

    it("should allow whitelisted user to claim tokens after claim interval has passed", async () => {
        // Add addr1 to the whitelist
        await tokenClaimContract.addWhitelistedUser(addr1.address);

        const timestamp = await time.latest()+1;
        // Claim tokens
        await expect(tokenClaimContract.connect(addr1).claim()).to.emit(tokenClaimContract, "Claimed").withArgs(addr1.address, timestamp);
        expect(await erc20TokenContract.balanceOf(addr1.address)).to.equal(100);

        // Attempt to claim tokens again before claim interval (should revert)
        await expect(tokenClaimContract.connect(addr1).claim()).to.be.revertedWithCustomError(tokenClaimContract, 'ClaimIntervalNotPassed');

        // Increase time to pass the claim interval
        await ethers.provider.send('evm_increaseTime', [600]);

        // Claim tokens again
        await tokenClaimContract.connect(addr1).claim();
        expect(await erc20TokenContract.balanceOf(addr1.address)).to.equal(200);
    });
});
