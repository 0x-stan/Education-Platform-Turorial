# ERC721

## ERC721 Token 概览

- ERC-721 接口
- transferFrom 函数
- 元数据和安全转移

## ERC721 的变量

- **ERC721 概述**: ERC721 是什么及其与 ERC20 的不同之处（不可替代性）。
- **主要变量**:
  - **tokenId**: 每个 token 的唯一标识符。
  - **ownerOf**: `mapping(uint256 => address)`，记录 token 所有者。
  - **balanceOf**: `mapping(address => uint256)`，记录每个地址拥有的 token 数量。
  - **tokenURI**: `mapping(uint256 => string)`，记录每个 token 的元数据 URI。
- **事件**:
  - **Transfer** 事件: 记录 token 的转移，用于后续的事件监听与日志记录。

## ERC721 的核心功能和方法

- **安全性检查**: 添加 `require` 语句，确保 `tokenId` 有效并且地址确实是拥有者。
- **transferFrom 函数**: 功能: 将某个 token 从一个地址转移到另一个地址。
- **safeTransferFrom 函数**: 确保在合约地址接收 token 时不会丢失 token，通过 `isContract` 检查接收者。
- **授权机制**:
  - **approve**: 授权某个地址操作特定的 token。
  - **setApprovalForAll**: 允许某个地址可以操作所有 token。

## ERC721 扩展功能与自定义实现

- **Enumerable 扩展（ERC721Enumerable）**: 实现 **`totalSupply`**、**`tokenOfOwnerByIndex`** 和 **`tokenByIndex`** 函数，允许遍历所有 token。
- **批量转移（Batch Transfer）**: 实现多个 token 的批量转移，优化 gas 费用和操作效率。
- **多种 Token 标准的结合**:  ERC721 和 ERC1155 的结合。
- **使用 OpenZeppelin 库**: 如何使用 OpenZeppelin 库简化 ERC721 的实现，导入可用模块。
