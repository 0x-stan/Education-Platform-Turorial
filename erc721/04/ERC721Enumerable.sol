// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC721Token} from "./ERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract ERC721Enumerable is ERC721Token {
    using Strings for uint256;

    // Array to store all token IDs
    uint256[] private _allTokens;

    // Mapping from token ID to position in the allTokens array
    mapping(uint256 => uint256) private _allTokensIndex;

    // Mapping from owner to list of owned token IDs
    mapping(address => uint256[]) private _ownedTokens;

    // Mapping from token ID to index of the owner tokens list
    mapping(uint256 => uint256) private _ownedTokensIndex;

    // base URI

    // tokenURI

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_
    ) ERC721Token(name_, symbol_) {
        baseURI = baseURI_;
    }

    // totalSupply

    // tokenByIndex

    // tokenOfOwnerByIndex


    // Override _mint to handle enumeration

    // _addTokenToAllTokensEnumeration

    // _addTokenToOwnerEnumeration

}
