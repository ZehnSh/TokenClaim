// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("MyToken", "MTK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function grantRole(address _address) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, _address);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
