// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "hardhat/console.sol";

contract Auction {
    struct AuctionItems {
        uint256 startingBid;
        address highestBidder;
        uint256 highestBid;
        bool ended;
    }

    address public owner;
    mapping(uint256 => AuctionItems) public items;
    mapping(uint256 => bool) public itemInitialized;

    constructor() {
        owner = msg.sender;
    }

    function initializeAuction(
        uint256[] calldata itemIds,
        uint256[] calldata startingBids
    ) public onlyOwner {
        require(itemIds.length == startingBids.length, "Invalid input length");

        for (uint256 i = 0; i < itemIds.length; i++) {
            require(!itemInitialized[itemIds[i]], "Item already exists");
            items[itemIds[i]] = AuctionItems(
                startingBids[i],
                address(0),
                0,
                false
            );
            itemInitialized[itemIds[i]] = true;
        }
    }

    function placeBid(uint256 itemId) public payable onlyNonOwner {
        AuctionItems storage item = items[itemId];
        require(!items[itemId].ended, "Auction has ended");
        require(
            msg.value > items[itemId].startingBid,
            "Bid lower than starting bid"
        );
        require(
            msg.value > items[itemId].highestBid,
            "Bid lower than highest bid"
        );

        if (item.highestBidder != address(0)) {
            (bool sent, ) = item.highestBidder.call{value: item.highestBid}("");
            require(sent);
        }

        item.highestBidder = msg.sender;
        item.highestBid = msg.value;
    }

    function highestBidder(uint256 itemId) public view returns (address) {
        require(!items[itemId].ended, "Auction not ended yet");
        return items[itemId].highestBidder;
    }

    // Helper functions

    function endAuction(uint256 itemId) public onlyOwner {
        items[itemId].ended = true;
    }

    function setItemInitializeToFalse(uint256 itemId) public onlyOwner {
        itemInitialized[itemId] = false;
    }

    function withdraw() public onlyOwner {
        (bool sent, ) = owner.call{value: address(this).balance}("");
        require(sent);
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner is allowed");
        _;
    }

    modifier onlyNonOwner() {
        require(msg.sender != owner, "Not owner allowed");
        _;
    }
}
