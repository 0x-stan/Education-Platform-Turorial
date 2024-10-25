# Metadata 与 ERC721Enumerable 扩展功能详解

在 ERC721 标准中，元数据（Metadata）和枚举（Enumerable）功能为代币提供了更丰富的展示和访问方式。**Metadata** 通过 `tokenURI` 链接将链上代币与链下信息关联，**Enumerable** 则为代币提供了按序索引和持有者枚举功能。本文详细讲解这两个功能的实现和其重要性。

---

## ERC721 Metadata 的作用与通用格式

**元数据**（Metadata）为每个 NFT 提供了独特的描述信息，它可以包含图像、属性、故事背景等内容。通过在合约中定义 `tokenURI`，将 NFT 与链下存储的 JSON 文件关联，使其内容更加丰富。

### JSON 格式示例：以 Bored Ape 为例

在 NFT 项目中，元数据通常以 **JSON 格式**表示，包含以下常用字段：

- **name**: NFT 名称，例如 `"Bored Ape #1"`.
- **description**: 简短描述，例如 `"A unique Bored Ape in the BAYC collection"`.
- **image**: 图像 URL，用于展示 NFT，例如 `"https://example.com/boredape1.png"`.
- **attributes**: 属性列表，用于描述 NFT 特性，例如：

```json
{
  "name": "Bored Ape #1",
  "description": "A unique Bored Ape in the BAYC collection",
  "image": "https://example.com/boredape1.png",
  "attributes": [
    { "trait_type": "Background", "value": "Blue" },
    { "trait_type": "Eyes", "value": "Red" },
    { "trait_type": "Clothes", "value": "T-Shirt" },
    { "trait_type": "Fur", "value": "Golden Brown" },
    { "trait_type": "Mouth", "value": "Smile" }
  ]
}
```

在上面的 JSON 中，每个 `Bored Ape` 的图像和属性都可以通过 `tokenURI` 在链外 JSON 文件中被描述和访问。这样，用户可以在钱包和 NFT 市场中看到该 NFT 的图片和详情。

### 元数据的意义

- **唯一性**：Metadata 提供描述信息，使每个 NFT 都有不同的外观和属性。
- **可展示性**：通过图像和属性展示，用户可以在 NFT 市场中浏览和查看。
- **链下扩展**：由于链上存储成本高昂，图像和大数据量的属性信息都通过 `tokenURI` 实现链下扩展。

---

## 扩展功能：ERC721Enumerable

**ERC721Enumerable** 扩展标准为代币提供了枚举功能，使用户和应用程序可以轻松地按序遍历和获取代币列表。常用的三大枚举函数如下：

1. **totalSupply**：返回合约中代币总量，适合用来统计代币总数量。

    ```solidity
    function totalSupply() public view returns (uint256);
    ```

2. **tokenByIndex**：按索引查找代币 ID，适合在合约内按序访问代币。

    ```solidity
    function tokenByIndex(uint256 index) public view returns (uint256);
    ```

3. **tokenOfOwnerByIndex**：查找某地址持有的第 `index` 个代币的 `tokenId`，便于查询用户持有的 NFT 列表。

    ```solidity
    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256);
    ```

---

## 代码实现解析

在合约 `ERC721TokenWithMetadata` 中，我们实现了 Metadata 和 ERC721Enumerable 的扩展：

### 1. 设置 `baseURI` 和 `tokenURI`

`baseURI` 是元数据的基本 URL，`tokenURI` 则是为每个代币指定的元数据地址：

```solidity
string public baseURI;
mapping(uint256 => string) public tokenURI;

constructor(string memory name_, string memory symbol_, string memory baseURI_) ERC721Token(name_, symbol_) {
    baseURI = baseURI_;
}
```

通过 `baseURI` 可以为所有代币指定相同的基础 URL，代币的完整 `tokenURI` 通过 `baseURI` 与代币 ID 拼接而成。

### 2. ERC721Enumerable 的实现

我们通过数组和映射实现了代币的全局和用户级枚举。

- `_allTokens` 数组：存储所有代币的 ID，用于全局枚举。
- `_allTokensIndex` 映射：存储每个代币在 `_allTokens` 中的位置，便于快速查找。
- `_ownedTokens` 映射：存储每个地址的代币列表，用于持有者级枚举。
- `_ownedTokensIndex` 映射：存储每个代币在 `_ownedTokens` 中的位置，用于快速查找。

#### totalSupply、tokenByIndex 和 tokenOfOwnerByIndex 实现

这三个函数为用户提供了代币的枚举功能：

```solidity
function totalSupply() public view returns (uint256) {
    return _allTokens.length;
}

function tokenByIndex(uint256 index) public view returns (uint256) {
    require(index < _allTokens.length, "ERC721Enumerable: global index out of bounds");
    return _allTokens[index];
}

function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
    require(index < _ownedTokens[owner].length, "ERC721Enumerable: owner index out of bounds");
    return _ownedTokens[owner][index];
}
```

### 3. 重写 `mint` 函数以更新枚举映射

每当创建新的代币时，我们重写 `_mint` 函数以更新枚举相关的映射。

```solidity
function mint(address to, uint256 tokenId) external override {
    super._mint(to, tokenId);
    tokenURI[tokenId] = string.concat(baseURI, tokenId.toString());
    _addTokenToAllTokensEnumeration(tokenId);
    _addTokenToOwnerEnumeration(to, tokenId);
}

function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
    _allTokensIndex[tokenId] = _allTokens.length;
    _allTokens.push(tokenId);
}

function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
    _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
    _ownedTokens[to].push(tokenId);
}
```

在 `_mint` 函数中，调用 `_addTokenToAllTokensEnumeration` 和 `_addTokenToOwnerEnumeration` 方法，分别将新铸造的代币添加到全局代币列表 `_allTokens` 和持有者的代币列表 `_ownedTokens` 中。

---

## 🏁 目标

通过实现 Metadata 和 ERC721Enumerable 扩展功能，我们达成了以下目标：

1. **元数据管理**：
   - 通过 `baseURI` 和 `tokenURI`，为每个 NFT 提供了链下描述和展示，便于在 NFT 市场和钱包中显示。

2. **按序索引和持有者枚举**：
   - 实现 `totalSupply`、`tokenByIndex` 和 `tokenOfOwnerByIndex` 函数，使用户和应用可以快速访问和遍历代币信息。

3. **扩展功能完整性**：
   - 通过枚举机制，使得合约在 NFT 市场和展示应用中的用户体验更为完整和流畅。