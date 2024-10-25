// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

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

    // tokenApprovals
    mapping(uint256 => address) public tokenApprovals;

    // operatorApprovals
    mapping(address => mapping(address => bool)) public operatorApprovals;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );
    event Approval(
        address indexed owner,
        address indexed approved,
        uint256 indexed tokenId
    );
    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    constructor(string memory name_, string memory symbol_) {
        name = name_;
        symbol = symbol_;
    }

    // transferFrom function

    // approve function

    // setApprovalForAll function

    // `_checkOnERC721Received` internal function

    // mint function

}

contract NonERC721Receiver {
    // This is an empty contract which hasn't ERC721Receiver function
}
