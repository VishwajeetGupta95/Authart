// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AuthArtNFT – ERC-721 with on-chain royalties (ERC-2981) and per-token URI.
/// Compatible with OpenZeppelin v4.x
contract AuthArtNFT is ERC721URIStorage, ERC721Royalty, Ownable {
    uint256 private _nextTokenId = 1;
    mapping(uint256 => address) public creators;

    constructor() ERC721("AuthArt", "AART") {}

    function mint(
        address to,
        string calldata uri,
        address royaltyReceiver,
        uint96 royaltyBps
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _setTokenRoyalty(tokenId, royaltyReceiver, royaltyBps);
        creators[tokenId] = royaltyReceiver;
        return tokenId;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721URIStorage, ERC721Royalty) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
