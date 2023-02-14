// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

contract Auction {
    address public owner;

    struct AuctionItems {
        string item;
        uint startingAmount;
    }

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier notOwner() {
        require(msg.sender != owner);
        _;
    }

    function initializeAuction() external onlyOwner {}

    function placeBid() external notOwner {}
}
