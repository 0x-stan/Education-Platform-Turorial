// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Token {
    uint256 public totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals;
    mapping(address => uint256) public balanceOf;
    // mapping allowance

    // Transfer event

    // Approval event;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    // function transfer

    // function approve

    // function transferFrom

}