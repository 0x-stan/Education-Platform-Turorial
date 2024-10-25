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
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(
            msg.sender == ownerOf[tokenId] ||
                tokenApprovals[tokenId] == to ||
                operatorApprovals[from][msg.sender],
            "Invalid sender address"
        );
        require(to != address(0), "Invalid recipient address");
        balanceOf[from]--;
        balanceOf[to]++;
        ownerOf[tokenId] = to;
        
        // Clear approval. No need to re-authorize or emit the Approval event
        tokenApprovals[tokenId] = address(0);
        emit Transfer(from, to, tokenId);
    }

    // safeTransferFrom function
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public {
        transferFrom(from, to, tokenId);
        require(
            _checkOnERC721Received(from, to, tokenId),
            "Transfer to non ERC721Receiver implementer"
        );
    }

    // approve function
    function approve(address to, uint256 tokenId) public {
        _approve(to, tokenId, msg.sender);
    }

    function _approve(
        address to,
        uint256 tokenId,
        address auth
    ) internal {
        // Avoid reading the owner unless necessary
        if (auth != address(0)) {
            address owner = ownerOf[tokenId];

            require(
                auth == address(0) ||
                    owner == auth ||
                    operatorApprovals[owner][auth],
                "Invalid approver"
            );
            
            emit Approval(owner, to, tokenId);
        }
        tokenApprovals[tokenId] = to;
    }

    // setApprovalForAll function
    function setApprovalForAll(address operator, bool approved) public {
        operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    // `_checkOnERC721Received` internal function
    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId
    ) private returns (bool) {
        if (to.code.length > 0) {
            try
                IERC721Receiver(to).onERC721Received(
                    msg.sender,
                    from,
                    tokenId,
                    ""
                )
            returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch {
                return false;
            }
        }
        return true;
    }

    // mint function
    function mint(address to, uint256 tokenId) external virtual {
        _mint(to, tokenId);
    }

    function _mint(address to, uint256 tokenId) internal {
        require(ownerOf[tokenId] == address(0), "Invalid sender address");
        require(to != address(0), "Invalid recipient address");
        balanceOf[to]++;
        ownerOf[tokenId] = to;
        _checkOnERC721Received(address(0), to, tokenId);
        emit Transfer(address(0), to, tokenId);
    }
}

contract NonERC721Receiver {
    // This is an empty contract which hasn't ERC721Receiver function
}
