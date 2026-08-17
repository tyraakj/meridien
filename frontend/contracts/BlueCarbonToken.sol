// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BlueCarbonToken (BCT)
 * @dev ERC-20 Token representing verified metric tons of sequestered blue carbon (1.0 BCT = 1 tCO2e).
 * @custom:hackathon Smart India Hackathon 2026 (Team: Git Push Pray, ID: SIH2601)
 */
contract BlueCarbonToken is ERC20, Ownable {
    address public mrvController;
    uint256 public totalCarbonRetired;

    event MRVControllerUpdated(address indexed previousController, address indexed newController);
    event CarbonMinted(address indexed to, uint256 amount, uint256 indexed reportId);
    event CarbonRetired(
        address indexed retiree,
        uint256 amount,
        string beneficiary,
        string reason,
        uint256 timestamp
    );

    constructor() ERC20("Meridien Blue Carbon Token", "BCT") Ownable(msg.sender) {}

    modifier onlyMRVController() {
        require(msg.sender == mrvController, "Caller is not MRV Controller");
        _;
    }

    /**
     * @notice Set the MRV Controller contract address authorized to mint credits.
     */
    function setMRVController(address _controller) external onlyOwner {
        require(_controller != address(0), "Invalid controller address");
        address previous = mrvController;
        mrvController = _controller;
        emit MRVControllerUpdated(previous, _controller);
    }

    /**
     * @notice Mint BCT tokens to a project developer upon MRV verification.
     * @param to Developer wallet address.
     * @param amount Token amount (in 18-decimal precision: 1.0 * 10^18 = 1 tCO2e).
     * @param reportId Verified MRV Report ID.
     */
    function mint(address to, uint256 amount, uint256 reportId) external onlyMRVController {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Mint amount must be greater than 0");
        _mint(to, amount);
        emit CarbonMinted(to, amount, reportId);
    }

    /**
     * @notice Retire (burn) verified carbon credits for voluntary offsetting or compliance.
     * @param amount Quantity of tokens to retire (18 decimals).
     * @param beneficiary Entity or organization on whose behalf the credits are retired.
     * @param reason Purpose of retirement (e.g. "Corporate Scope 3 Offset FY2026").
     */
    function retire(uint256 amount, string calldata beneficiary, string calldata reason) external {
        require(amount > 0, "Retire amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient BCT balance to retire");
        require(bytes(beneficiary).length > 0, "Beneficiary cannot be empty");

        _burn(msg.sender, amount);
        totalCarbonRetired += amount;

        emit CarbonRetired(msg.sender, amount, beneficiary, reason, block.timestamp);
    }
}
