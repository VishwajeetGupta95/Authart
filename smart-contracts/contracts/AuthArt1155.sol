// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuthArt1155 is ERC1155, Ownable {
    uint256 private _nextId = 1;
    mapping(uint256 => address) public creators;
    mapping(uint256 => string) private _uris;

    constructor() ERC1155("") {}

    function mint(address to, uint256 amount, string calldata tokenUri) external onlyOwner returns (uint256 id) {
        id = _nextId++;
        creators[id] = to;
        _uris[id] = tokenUri;
        _mint(to, id, amount, "");
    }

    function uri(uint256 id) public view override returns (string memory) {
        return _uris[id];
    }
}
