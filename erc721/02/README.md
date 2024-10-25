# ERC721 的变量

与 ERC20 类似，ERC721 也需要一些基本的变量来确保其运行正常。由于 ERC721 的非同质化特性，每个 token 都是唯一的，因此我们需要一些额外的变量来表示每个 token 的所有权及其元数据。

## name 和 symbol

与ERC20 一样，我们需要 name 和 symbol 来作为 Token 的标识。

```solidity
// Token name
string public name;

// Token symbol
string public symbol;
```

## TokenId 和 TokenURI

在 ERC721 中，每个 token 都有一个唯一的标识符，称为 `tokenId`。 `tokenId` 是 `uint256` 类型的整数，用来表示特定 token。为了区分每个 token 的独特性，我们可以通过 `tokenURI` 函数将 `tokenId` 与一个元数据 URI 关联，这个 URI 一般会指向存储在链下的文件，包含诸如图片、描述等数据。

```solidity
mapping(uint256 => string) public tokenURI;
```

我们可以通过 `tokenURI(uint256 tokenId)` 方法返回每个 `tokenId` 的元数据 URI，方便查看 token 的 URI 属性（URI通常是一个媒体文件地址，例如NFT 类通常会是一张独一无二的图片）。

> NFT 的 tokenId 通常不会使用一个单独的变量来记录，因为新的 `tokenId` 可能是随机的，所以由外部传入，只要保证不与之前的重复即可。

## ownerOf

与 ERC20 中的 `balanceOf` 类似，ERC721 也需要一个 `mapping` 来记录每个 token 的拥有者。因为每个 `tokenId` 都是唯一的，所以我们使用 `mapping(uint256 => address)` 类型来存储每个 token 的所有者地址。

```solidity
mapping(uint256 => address) public ownerOf;
```

## balanceOf

虽然每个 token 是唯一的，但一个地址可以持有多个 ERC721 token。为了查询某个地址持有的 token 数量，我们需要创建 `balanceOf` 变量来返回某个地址所拥有的 ERC721 token 的数量。

```solidity
mapping(address => uint256) public balanceOf;
```

## 事件

与 ERC20 一样，ERC721 也需要事件来记录 token 的转移。ERC721 规范要求必须实现 `Transfer` 事件，用来记录每个 token 的从一个地址到另一个地址的转移。

```solidity
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
```

## 🏁 目标

为 ERC721 合约设置以下变量：

- `tokenId`: `uint256` 类型， 每个 token 的唯一标识符
- `tokenURI`: `mapping(uint256 => string)` 类型， 存储每个 token 的元数据 URI
- `ownerOf`: `mapping(uint256 => address)` 类型， 记录每个 token 的所有者
- `balanceOf`: `mapping(address => uint256)` 类型， 记录每个地址拥有的 token 数量
- `event Transfer`: 事件，用于记录 token 转移

这为后续实现 ERC721 的核心功能打下了基础，确保每个 token 都能拥有唯一的所有者，并可以通过 `tokenId` 与 `metadata` 元数据关联。
