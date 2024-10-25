// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC721Token} from "./ERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract ERC721Enumerable is ERC721Token {
    using Strings for uint256;

    // base URI
    string public baseURI;

    // tokenURI
    mapping(uint256 => string) public tokenURI;

    // Array to store all token IDs
    uint256[] private _allTokens;

    // Mapping from token ID to position in the allTokens array
    mapping(uint256 => uint256) private _allTokensIndex;

    // Mapping from owner to list of owned token IDs
    mapping(address => uint256[]) private _ownedTokens;

    // Mapping from token ID to index of the owner tokens list
    mapping(uint256 => uint256) private _ownedTokensIndex;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_
    ) ERC721Token(name_, symbol_) {
        baseURI = baseURI_;
    }

    function totalSupply() public view returns (uint256) {
        return _allTokens.length;
    }

    function tokenByIndex(uint256 index) public view returns (uint256) {
        require(
            index < _allTokens.length,
            "ERC721Enumerable: global index out of bounds"
        );
        return _allTokens[index];
    }

    function tokenOfOwnerByIndex(
        address owner,
        uint256 index
    ) public view returns (uint256) {
        require(
            index < _ownedTokens[owner].length,
            "ERC721Enumerable: owner index out of bounds"
        );
        return _ownedTokens[owner][index];
    }

    // Override _mint to handle enumeration
    function mint(address to, uint256 tokenId) external override {
        super._mint(to, tokenId);
        tokenURI[tokenId] = string.concat(baseURI, tokenId.toString());
        _addTokenToAllTokensEnumeration(tokenId);
        _addTokenToOwnerEnumeration(to, tokenId);
    }

    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }

    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);
    }
}
