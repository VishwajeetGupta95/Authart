// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuthArtMarketplace is ReentrancyGuard, Ownable {
    struct Listing { address seller; address nft; uint256 tokenId; uint256 price; bool active; }
    uint256 public nextListingId = 1;
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public reputation;

    constructor() {}

    function list(address nft, uint256 tokenId, uint256 price) external returns (uint256 id) {
        require(price > 0, "price=0");
        require(IERC721(nft).ownerOf(tokenId) == msg.sender, "not owner");
        IERC721(nft).transferFrom(msg.sender, address(this), tokenId);
        id = nextListingId++;
        listings[id] = Listing(msg.sender, nft, tokenId, price, true);
    }

    function cancel(uint256 id) external {
        Listing storage l = listings[id];
        require(l.active && l.seller == msg.sender, "not seller");
        l.active = false;
        IERC721(l.nft).transferFrom(address(this), l.seller, l.tokenId);
    }

    function buy(uint256 id) external payable nonReentrant {
        Listing storage l = listings[id];
        require(l.active, "inactive");
        require(msg.value == l.price, "wrong price");
        l.active = false;
        uint256 royalty;
        address receiver;
        try ERC2981(l.nft).royaltyInfo(l.tokenId, msg.value) returns (address royaltyAddr, uint256 royaltyAmount) {
            receiver = royaltyAddr;
            royalty = royaltyAmount;
        } catch {}
        uint256 sellerAmount = msg.value - royalty;
        if (royalty > 0 && receiver != address(0)) payable(receiver).transfer(royalty);
        payable(l.seller).transfer(sellerAmount);
        IERC721(l.nft).transferFrom(address(this), msg.sender, l.tokenId);
        reputation[l.seller] += 1;
        reputation[msg.sender] += 1;
    }
}
