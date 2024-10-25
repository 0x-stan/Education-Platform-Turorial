# ERC721 Token 概览

假设您想在以太坊网络上创建一系列独特的数字资产，这些资产可能是：

- 游戏中的稀有道具或角色
- 数字艺术品

不同于 ERC-20 Token（它们是同质化的），ERC-721 Token 是 **不可替代的（Non-Fungible Token, NFT）**。这意味着每个 Token 都是独一无二的，不可互换的。每个 NFT 都有自己独特的特征，不能简单地用一个 NFT 与另一个直接交换。

**ERC-721** 提供了一种标准化的接口，用于创建 NFT。无论是游戏开发者、数字艺术家，只要符合 ERC-721 标准，用户就可以在各种去中心化市场或平台上自由交易和使用这些 Token。

## ERC-721 接口

就像 ERC-20，ERC-721 也有一套标准的接口和函数。这些规则确保每个符合 ERC-721 标准的 Token 可以在各种场景（如钱包、交易所）中无缝使用。

核心函数包括：

- **`balanceOf`**：查询某个地址持有多少个 NFT。
- **`ownerOf`**：确定某个 NFT 的所有者。
- **`transferFrom`**：转移 NFT 所有权。
- **`approve`** 和 **`setApprovalForAll`**：授权第三方操作 Token。

这些函数让开发者可以轻松创建符合 ERC-721 标准的智能合约，并确保其可与现有的去中心化生态系统兼容。

```solidity
contract MyNFTContract is IERC721 {
    // 实现 ERC-721 函数...
}
```

## ERC-721 `transferFrom` 函数

ERC-721 中最重要的函数之一是 **`transferFrom`**，它允许用户将 NFT 从一个地址转移到另一个地址。与 ERC-20 不同，每次只能转移一个 NFT，因为每个 NFT 都是独一无二的。

这个函数将是核心，因为它决定了物品（如角色、武器或艺术品）从一个钱包到另一位钱包的转移。

```solidity
function transferFrom(address _from, address _to, uint256 _tokenId) external;
```

通过这个函数，用户可以在一个去中心化市场上安全地交易他们的 NFT，无需担心中心化的控制或欺诈行为。

## 额外的功能：元数据和安全转移

除了基本的转移功能，ERC-721 还支持可选的 **元数据（Metadata）**，允许每个 Token 附带额外的信息。例如，对于一幅数字艺术品，元数据可能包括艺术品的名称、创作者、年份等。

ERC-721 还引入了 **`safeTransferFrom`** 函数，确保转移 Token 的合约地址支持 ERC-721 标准。如果目标地址不支持，则交易会被拒绝，从而避免资产的丢失。

## 建议阅读

- [ERC-721 代币标准](https://eips.ethereum.org/EIPS/eip-721)
- [OpenZeppelin 的 ERC-721 智能合约实现](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol)
