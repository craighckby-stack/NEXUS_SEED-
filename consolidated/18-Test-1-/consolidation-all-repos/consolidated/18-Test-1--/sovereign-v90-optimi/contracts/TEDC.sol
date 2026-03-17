// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TEDC (Tidal Exchange Decentralized Credit)
 * @notice Standard ERC-20 token implementing basic ownership controls.
 * @dev Utilizes OpenZeppelin for security and compliance.
 */
contract TEDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 18;

    /**
     * @notice Constructs the TEDC token.
     * @param initialSupply The total amount of tokens to mint initially (in full tokens, converted to wei by the constructor).
     * @param deployer The address that will receive the initial supply and serve as the contract owner.
     */
    constructor(uint256 initialSupply, address deployer)
        ERC20("Tidal Exchange Decentralized Credit", "TEDC")
        Ownable(deployer)
    {
        // Calculates supply in smallest unit (wei) based on standard 18 decimals.
        uint256 supplyInWei = initialSupply * (10 ** uint256(DECIMALS));
        _mint(deployer, supplyInWei);
    }

    /**
     * @dev Overrides ERC20 standard decimals implementation to enforce 18.
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    // Future logic (e.g., pausing, burning, minting functions accessible only by Ownable) 
    // can be added here based on evolving mission requirements.
}