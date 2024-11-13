// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Token {
    // totalSupply
    uint256 public totalSupply;
    // name, symbol, decimals
    string public name;
    string public symbol;
    uint8 public decimals;

    mapping(address => uint256) public balanceOf;

    // event Transfer
    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _initialSupply * (10 ** uint256(decimals));
        balanceOf[msg.sender] = totalSupply; // 初始化发行给合约部署者
    }

}
