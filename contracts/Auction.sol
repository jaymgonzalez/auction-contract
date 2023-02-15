// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/**
*@title Auction
*@author Jay M Gonzalez
*@dev A contract that allows the initialization of auction items with starting bids,
and allows users to place bids on those items. The highest bidder for each item is
tracked, and the auction can be ended by the owner at any time. Additionally,
the owner can withdraw the funds from the contract at any time.
 */
contract Auction {
    /**
     *@dev Struct that holds information about each auction item.
     *@param startingBid The starting bid for the item.
     *@param highestBidder The address of the highest bidder for the item.
     *@param highestBid The highest bid amount for the item.
     *@param ended A boolean flag indicating whether the auction for the item has ended.
     */
    struct AuctionItems {
        uint256 startingBid;
        address highestBidder;
        uint256 highestBid;
        bool ended;
    }

    /// @dev The address of the owner of the contract.
    address public owner;

    /// @dev A mapping of item IDs to their corresponding AuctionItems structs.
    mapping(uint256 => AuctionItems) public items;

    /// @dev A mapping of item IDs to a boolean flag indicating whether the item has been initialized.
    mapping(uint256 => bool) public itemInitialized;

    /// @dev Constructor that sets the owner of the contract to the address that deployed the contract.
    constructor() {
        owner = msg.sender;
    }

    /**
     *@dev Initializes auction items with their corresponding starting bids.
     *@param itemIds An array of item IDs to initialize.
     *@param startingBids An array of starting bids corresponding to the item IDs to initialize.
     *@notice Length of itemIds and startingBids must be the same
     *@notice If the itemId has already been initialized execution will be reverted
     *@notice Passing a struct instead of 2 separate arrays was more difficult and less gas efficient than spliting an array of objects in the front end with JS. In the case of IDs and starting bids being in the same file.
     */
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

    /**
     *@dev Allows a non-owner to place a bid on a specified item.
     *@param itemId The ID of the item to bid on.
     *@notice Tx will revert if the bid is lower than previous bid or the initial bid.
     *@notice Caller sends the bid value to the contract.
     *@notice If a bider is overbid, the contract sends back the bid value. This has gas implications that have to been taken into account.
     */
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

    /**
     *@dev Returns the address of the highest bidder for an auction item.
     *@param itemId The ID of the item to get the highest bidder for.
     *@return The address of the highest bidder for the item.
     */
    function highestBidder(uint256 itemId) public view returns (address) {
        require(!items[itemId].ended, "Auction not ended yet");
        return items[itemId].highestBidder;
    }

    // Helper functions
    /**
     * @dev Ends the auction for a specified item.
     * @param itemId The ID of the item.
     * @notice This function could be automatically called with the specific requirements to finish each auction from a secure server.
     */
    function endAuction(uint256 itemId) public onlyOwner {
        require(itemInitialized[itemId], "Auction not initialized");
        items[itemId].ended = true;
    }

    /// @dev Allows the contract owner to withdraw the balance of the contract.
    function withdraw() public onlyOwner {
        (bool sent, ) = owner.call{value: address(this).balance}("");
        require(sent);
    }

    // Modifiers
    /// @dev Modifier that allows only the owner to call the function.
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner is allowed");
        _;
    }

    /// @dev Modifier that allows only non-owners to call the function.
    modifier onlyNonOwner() {
        require(msg.sender != owner, "Not owner allowed");
        _;
    }
}
