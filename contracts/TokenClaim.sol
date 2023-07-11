// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;

import {IERC20Token} from "./Interfaces/IERC20Token.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Token Claiming Contract :- where users can come and claim tokens after every 10 mins
 * @author Jenith Sharma
 * @notice There is no tranfering eth to contract for claiming the token as in description there
 * was only mentioned to claim the token after certain minutes that is what I am gonna implement.
 */
contract TokenClaim is Ownable {
    /////////////////////
    // STATE VARIABLES //
    /////////////////////

    
    // Gas Saving
    IERC20Token private immutable tokenAddress;
    uint16 private claimInterval = 10 minutes;
    uint8 private defaultClaimValue = 100;

    mapping(address user => bool) whitelist;
    mapping(address user => uint256 claimTime) lastClaimTime;

    ////////////
    // EVENTS //
    ////////////
    event Whitelisted(address user);
    event Claimed(address user, uint256 timeStamp);

    ////////////
    // ERRORS //
    ////////////
    error AlreadyWhitelisted();
    error NotWhitelisted();
    error ClaimIntervalNotPassed();

    constructor(address _tokenAddress) {
        tokenAddress = IERC20Token(_tokenAddress);
    }

    ////////////////////////
    // EXTERNAL FUNCTIONS //
    ////////////////////////
    function addWhitelistedUser(address _user) external onlyOwner returns (bool) {
        if (whitelist[_user]) {
            revert AlreadyWhitelisted();
        }
        whitelist[_user] = true;
        emit Whitelisted(_user);
        return true;
    }

    function removeWhitelistedUser(address _user) external onlyOwner returns (bool) {
        if (!whitelist[_user]) {
            revert NotWhitelisted();
        }
        whitelist[_user] = false;
        return true;
    }

    function claim() external returns (address _recipient, uint256 value) {
        _recipient = msg.sender;
        if (!whitelist[_recipient]) {
            revert NotWhitelisted();
        }
        uint256 currentTimestamp = block.timestamp;
        /**
         * First time the lastClaim Time will be = 0
         * therefore the user can claim without reverting
         * the following condition
         */
        if (currentTimestamp - lastClaimTime[_recipient] <= claimInterval) {
            revert ClaimIntervalNotPassed();
        }
        updateLastClaimTime(_recipient, currentTimestamp);
        value = defaultClaimValue;

        tokenAddress.mint(_recipient, value);

        emit Claimed(msg.sender, currentTimestamp);
    }

    function updateLastClaimTime(address _recipient, uint256 _newClaimTime) private {
        lastClaimTime[_recipient] = _newClaimTime;
    }

    function updateClaimInterval(uint16 _claimInterval) external onlyOwner {
        if (_claimInterval < 10 minutes || _claimInterval > 60 minutes) {
            revert();
        }
        claimInterval = _claimInterval;
    }

    function updateDefaultClaimValue(uint8 _defaultClaimValue) external onlyOwner {
        if (_defaultClaimValue > 100) {
            revert();
        }
        defaultClaimValue = _defaultClaimValue;
    }

    function isWhitelisted(address _user) external view returns (bool) {
        return whitelist[_user];
    }

    function getLastClaimTime(address _user) external view returns (uint256) {
        return lastClaimTime[_user];
    }

    function getTokenAddress() external view returns (address) {
        return address(tokenAddress);
    }
}
