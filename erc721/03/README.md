# ERC721 核心功能和方法

ERC721 是一个不可替代的代币标准，具有独特的所有权管理功能。本文将介绍其核心功能，包括安全性检查、转移机制、授权功能等，并提供相应的合约代码示例与测试用例。通过学习这些功能，您将能够实现一个完整的 ERC721 智能合约。

## 授权机制

ERC721 标准提供了两种授权机制：

- `approve` 单个授权
- `setApprovalForAll` 全局授权(允许操作者转走拥有者所有的 Token，而避免逐个进行 approve 操作)

它们允许代币所有者授予其他地址操作代币的权限。

### `approve` 函数

`approve` 允许代币所有者将某个 `tokenId` 授权给其他地址。这在拍卖、Token 借贷等场景中十分有用。`_approve internal` 的实现如下：

- **验证授权人**：`auth` 必须为代币的所有者或已获得全局授权的地址。
- **更新授权映射**：将 `tokenApprovals[tokenId]` 更新为 `to`，标记该地址获得操作 `tokenId` 的权限。
- **触发授权事件**：如果 `emitEvent` 为 `true`，触发 `Approval` 事件，便于监听和追踪授权操作。

```solidity
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
```

### `setApprovalForAll` 函数

`setApprovalForAll` 提供全局授权功能，允许用户授予某地址操作所有自己代币的权限。此功能对于外部管理工具或交易市场应用非常实用。

```solidity
function setApprovalForAll(address operator, bool approved) public {
    operatorApprovals[msg.sender][operator] = approved;
    emit ApprovalForAll(msg.sender, operator, approved);
}
```

- **全局授权**：将 `operatorApprovals[msg.sender][operator]` 设置为 `true` 或 `false`，分别表示允许或取消全局授权。
- **事件触发**：调用 `ApprovalForAll` 事件，以便区块链系统追踪授权变化。

## 转账函数

在 ERC721 中，安全性和权限控制至关重要，特别是在转移、授权和接收代币的流程中。这些检查保证了只有符合条件的用户能够操作特定代币。

### `transferFrom`

#### `transferFrom` 的权限控制

在 `transferFrom` 方法中，首先对调用者权限进行了验证。代码如下：

```solidity
require(
    msg.sender == ownerOf[tokenId] ||
    tokenApprovals[tokenId] == to ||
    operatorApprovals[from][msg.sender],
    "Invalid sender address"
);
```

该权限检查包含三层逻辑，用于判断调用者是否有权操作 `tokenId`：

- `msg.sender == ownerOf[tokenId]`：判断调用者是否为该 `tokenId` 的所有者。
- `tokenApprovals[tokenId] == to`：判断 `msg.sender` 是否是通过 `approve` 函数被授权的地址，即是否被赋予操作该特定 `tokenId` 的权限。
- `operatorApprovals[from][msg.sender]`：判断 `msg.sender` 是否在全局上被 `from` 地址授权为操作员（通过 `setApprovalForAll` 授予），能够操作 `from` 所有的代币。

如果 `msg.sender` 既不是代币所有者，也没有通过 `approve` 或 `setApprovalForAll` 授权，则会抛出 `"Invalid sender address"` 错误，阻止非授权用户操作代币。

#### 接收地址有效性检查

在 `transferFrom` 函数中，另一项重要的安全性检查是确保目标地址有效，代码如下：

```solidity
require(to != address(0), "Invalid recipient address");
```

该语句检查接收地址 `to` 是否为 `0` 地址（也称为“burn address”）。这是因为如果目标地址为 `0`，将导致代币被永久“烧毁”或失去所有权，进而造成不可恢复的损失。通过此检查，确保每次代币转移都指向有效的接收地址。

#### 更新所有权和清除授权信息

一旦通过权限和地址的安全性检查，`transferFrom` 函数会完成代币转移的主要流程：

```solidity
balanceOf[from]--;
balanceOf[to]++;
ownerOf[tokenId] = to;
// 一定要记得清除 approve 授权
tokenApprovals[tokenId] = address(0);
emit Transfer(from, to, tokenId);
```

该流程包括以下步骤：

1. **更新持有者的余额**：`balanceOf[from]--` 和 `balanceOf[to]++` 分别减少转出地址的代币数量，并增加接收地址的代币数量，保持代币数量一致。
2. **更新所有权**：`ownerOf[tokenId] = to` 将 `tokenId` 的所有者更新为新的接收地址。
3. **清除授权**：`tokenApprovals[tokenId] = address(0)` 将先前对该 `tokenId` 的单一授权清除，以确保接收地址不再有旧授权记录，防止未经授权的再次操作。
4. **触发事件**：`emit Transfer(from, to, tokenId);` 记录这次转移事件，便于链上和链外服务监控代币转移。

通过以上操作步骤，`transferFrom` 函数完成了安全的代币转移。

### `safeTransferFrom` 函数中的合约兼容性检查

对于安全转移的需求，`safeTransferFrom` 函数包含对接收方合约的兼容性检查，以确保其支持 `IERC721Receiver` 接口。

```solidity
require(
    _checkOnERC721Received(from, to, tokenId),
    "Transfer to non ERC721Receiver implementer"
);
```

该语句调用了 `_checkOnERC721Received` 内部函数，检查接收方合约是否实现了 `onERC721Received` 方法：

```solidity
function _checkOnERC721Received(address from, address to, uint256 tokenId) private returns (bool) {
    if (to.code.length > 0) {
        try
            IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, "")
        returns (bytes4 retval) {
            return retval == IERC721Receiver.onERC721Received.selector;
        } catch {
            return false;
        }
    }
    return true;
}
```

`_checkOnERC721Received` 的具体逻辑为：

- **检查地址是否为合约**：`to.code.length > 0` 用于判断 `to` 地址是否为合约。如果 `to` 为合约，则调用 `onERC721Received` 方法。
- **兼容性检查**：尝试调用 `onERC721Received`，若返回值与 `IERC721Receiver.onERC721Received.selector` 相等，则表明 `to` 合约实现了接收功能。否则，函数返回 `false`，导致 `safeTransferFrom` 函数失败，从而避免代币发送至不支持接收的合约。

这种方式确保了当接收方为合约地址时，安全性检查可以防止代币丢失，通常我们使用 `safeTransferFrom` 代替 `transferFrom`。

## `mint` 函数(可选)

`mint` 函数用于创建新的 NFT 代币，赋予指定地址并触发 `Transfer` 事件。通过 `mint`，用户可以在链上发布新的唯一代币。

```solidity
function mint(address to, uint256 tokenId) external {
    _mint(to, tokenId);
}

function _mint(address to, uint256 tokenId) internal {
    require(ownerOf[tokenId] == address(0), "Token already minted");
    require(to != address(0), "Invalid recipient address");

    balanceOf[to]++;
    ownerOf[tokenId] = to;

    // 兼容检查
    _checkOnERC721Received(address(0), to, tokenId);
    emit Transfer(address(0), to, tokenId);
}
```

- **检查是否已铸造**：`require(ownerOf[tokenId] == address(0))` 确保 `tokenId` 尚未存在。
- **更新映射**：增加 `balanceOf` 和 `ownerOf` 的映射，标记该地址为新代币所有者。
- **合约兼容检查**：调用 `_checkOnERC721Received` 确保接收方兼容 ERC721。
- **事件触发**：调用 `Transfer` 事件，标记代币的生成并发送给目标地址。

`mint` 函数并非必须实现的功能，事实上，你也可以不暴露该接口，而是在创建之初将所有 Token mint 出来进行发放。

## 🏁 目标

为 ERC721 合约扩展实现 Metadata 和 ERC721Enumerable 功能，设置以下变量和功能模块，以支持元数据关联和代币的枚举功能：

- **`baseURI`**: `string` 类型，基础 URI，用于生成每个代币的完整元数据链接。
- **`tokenURI`**: `mapping(uint256 => string)` 类型，存储每个代币的特定 URI，允许为每个代币关联唯一的元数据。
- **`_allTokens`**: `uint256[]` 数组，存储所有已铸造的代币 ID，支持按序遍历。
- **`_allTokensIndex`**: `mapping(uint256 => uint256)` 类型，记录每个代币在 `_allTokens` 数组中的位置，用于快速查找。
- **`_ownedTokens`**: `mapping(address => uint256[])` 类型，存储每个地址持有的代币 ID 列表。
- **`_ownedTokensIndex`**: `mapping(uint256 => uint256)` 类型，记录每个代币在持有者代币列表中的位置，便于高效访问。

扩展功能实现：

- **totalSupply()**: 返回合约中当前的代币总量，方便查询和统计。
- **tokenByIndex(uint256 index)**: 返回 `_allTokens` 数组中指定位置的代币 ID，用于按序遍历合约中的所有代币。
- **tokenOfOwnerByIndex(address owner, uint256 index)**: 返回特定地址持有的第 `index` 个代币 ID，便于查询用户持有的代币列表。

这些变量和功能模块使 ERC721 合约支持代币的元数据关联和枚举管理，为代币的展示和遍历提供了完整的结构。通过这些扩展，用户可以查询代币的元数据和总量，按序查看合约内代币，并检索持有者的代币列表。
