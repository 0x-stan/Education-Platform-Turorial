// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ERC721Token {
    // Token name
    string public name;

    // Token symbol
    string public symbol;

    // ownerOf
    mapping(uint256 => address) public ownerOf;

    // balanceOf
    mapping(address => uint256) public balanceOf;

    // tokenURI
    mapping(uint256 => string) public tokenURI;

    // event Transfer
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor(string memory name_, string memory symbol_) {
        // 初始化 name, symbol
        name = name_;
        symbol = symbol_;
    }
}