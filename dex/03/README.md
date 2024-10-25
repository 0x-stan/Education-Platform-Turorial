# 搭建自己的 Uniswap：核心需求和接口设计

本节我们讲开始实现自己的 Uniswap 合约。

## 核心需求

在搭建合约之前，我们需要先梳理核心需求：

### 1. **流动性池（Liquidity Pool）管理**

流动性池允许用户存入一种 ERC20 Token 和 ETH，作为交易对（如 ETH/DAI）。这些流动性池完全托管在智能合约中，任何用户都可以通过向流动性池添加资金来成为流动性提供者（LP）。

- 管理每个 Token 对的流动性池，并存储 Token 的当前余额。
- 用户能够向流动性池中添加或移除流动性。
- 通过智能合约托管用户的资产，并确保池中的资金安全。

### 2. **恒定乘积公式 `x*y=k`**

Uniswap V1 的核心定价机制是恒定乘积公式 `x*y=k`，其中：

- `x`：流动性池中一种 Token 的数量。
- `y`：流动性池中另一种 Token 的数量。
- `k`：常量，代表流动性池中两种 Token 数量的乘积，保持不变。

每次交易都会改变资产的数量，但公式中的乘积必须保持不变，从而自动决定交易价格。

- 根据当前流动性池的余额，自动调整 Token 交换比例。
- 确保交易后满足 `x*y=k`，即不破坏流动性池的平衡。

### 3. **Token Swap**

- 用户可以调用接口，将一种 Token 交换为另一种 Token。
- 合约自动计算交易价格，并完成 Token 的转账。
- 交易的滑点机制需要根据池子的深度来动态计算价格变化。

### 4. **添加和移除流动性**

任何人都可以向 Uniswap V1 中的流动性池添加资金，并成为流动性提供者。相应的，流动性提供者也可以随时从池中移除流动性，并取回他们的资金。

- 用户添加流动性时，必须按照当前流动性池的比例存入两种 Token。
- 为流动性提供者提供 LP Token，代表其在池中的份额。
- 用户移除流动性时，按比例返还其提供的两种 Token。

### 5. **LP Token（Liquidity Provider Tokens）**

LP Token 是一种特殊 Token，用于代表流动性提供者在池中的份额。流动性提供者在加入流动性时会收到 LP Token，并在移除流动性时销毁这些 Token。

- 铸造和销毁 LP Token，以确保流动性提供者可以随时通过 LP Token 获得其底层资产。
- LP Token 比例与流动性池中两种 Token 的余额挂钩。

### 6. **手续费机制**

收取每笔交易的 0.3% 作为手续费，这些手续费将被添加到流动性池中，并作为奖励分配给流动性提供者。

- 每笔交易需要自动扣除 0.3% 的手续费，并将其存入流动性池中。
- 确保手续费分配给所有流动性提供者，作为奖励机制。

### 7. **ETH/Token 交易对**

在 Uniswap V1 中，每个流动性池中的一种 Token 必须是 WETH。这意味着所有交易都是 ETH 和 ERC20 Token 之间的交换。

- 支持 ETH 与任意 ERC20 Token 之间的交易。
- 使用 WETH Token 来封装和管理 ETH。

> Uniswap V1 使用这种设计，这样便可以通过 ETH 作为媒介，让所有 Token 可交易，在 V2 中改进了设计，允许任何 Token 之间创建交易对

## 合约接口设计

![uniswap-pool.png](https://github.com/Dapp-Learning-DAO/Education-Platform-Tutorial/raw/main/dex/03/img/uniswap-pool.png)

> 这里我们讲主要讨论 `pool` 合约 (满足交易功能的合约，形象的将其比喻为资产的池子，即交易池)，`Factory` 将在后续的章节中讨论。

### 1. **添加流动性**

#### `addLiquidity`

这个接口允许用户向流动性池中添加流动性，并通过提交 ETH 和 ERC20 Token 来获得相应的 LP Token 。

**函数定义:**

```solidity
function addLiquidity(uint256 _tokenAmount) public payable returns (uint256);
```

**参数：**

- `_tokenAmount`：用户提供的 ERC20 Token 数量。

**功能：**

- 当池子中无流动性时，用户可以自由设置初始流动性；否则需要按照当前储备比例添加流动性。
- 根据提供的 ETH 和Token 的比例，计算并铸造相应数量的 LP Token 。

**返回值：**

- `liquidity`：用户获得的 LP Token 数量。

---

### 2. **移除流动性**

#### `removeLiquidity`

允许用户移除其提供的流动性，并取回相应比例的 ETH 和 ERC20 Token 。

**函数定义:**

```solidity
function removeLiquidity(uint256 _amount) public returns (uint256, uint256);
```

**参数：**

- `_amount`：用户希望移除的 LP Token 数量。

**功能：**

- 用户销毁 LP Token ，并按比例从流动性池中取回 ETH 和 ERC20 Token 。

**返回值：**

- `ethAmount`：用户取回的 ETH 数量。
- `tokenAmount`：用户取回的 ERC20 Token 数量。

---

### 3. **Token 与 ETH 交换**

#### `ethToTokenSwap`

用户支付 ETH 来交换指定数量的 ERC20 Token 。

**函数定义:**

```solidity
function ethToTokenSwap(uint256 _minTokens) public payable;
```

**参数：**

- `_minTokens`：用户期望收到的最小 ERC20 Token 数量。

**功能：**

- 用户支付 ETH，根据池中的储备，按照恒定乘积公式 `x*y=k` 计算得到可获得的 ERC20 Token 数量。
- 如果可获得的Token 数量低于 `_minTokens`，交易失败。

---

#### `ethToTokenTransfer`

用户支付 ETH，将 ERC20 Token 发送到指定接收地址。

**函数定义:**

```solidity
function ethToTokenTransfer(uint256 _minTokens, address _recipient) public payable;
```

**参数：**

- `_minTokens`：用户期望收到的最小 ERC20 Token 数量。
- `_recipient`：ERC20 Token 的接收地址。

**功能：**

- 类似于 `ethToTokenSwap`，但Token 直接发送给 `_recipient`。

---

### 4. **Token 与 ETH 交换**

#### `tokenToEthSwap`

用户提供 ERC20 Token 来交换 ETH。

**函数定义:**

```solidity
function tokenToEthSwap(uint256 _tokensSold, uint256 _minEth) public;
```

**参数：**

- `_tokensSold`：用户出售的 ERC20 Token 数量。
- `_minEth`：用户期望收到的最小 ETH 数量。

**功能：**

- 用户提交 ERC20 Token ，合约根据池中的储备量和恒定乘积公式，计算可获得的 ETH 数量。
- 如果 ETH 数量低于 `_minEth`，交易失败。

---

### 5. **Token 与Token 交换**

#### `tokenToTokenSwap`

用户提供 ERC20 Token ，通过 ETH 作为中介来交换其他 ERC20 Token 。

**函数定义:**

```solidity
function tokenToTokenSwap(
    uint256 _tokensSold,
    uint256 _minTokensBought,
    address _tokenAddress
) public;
```

**参数：**

- `_tokensSold`：用户提供的源 ERC20 Token 数量。
- `_minTokensBought`：期望收到的目标 ERC20 Token 的最小数量。
- `_tokenAddress`：用户希望购买的目标 ERC20 Token 合约地址。

**功能：**

- 用户提供 ERC20 Token ，并在池子中转换为 ETH，再通过 ETH 交换目标 ERC20 Token 。
- 如果收到的目标Token 少于 `_minTokensBought`，交易失败。

---

### 6. **查询函数**

#### `getETHReserve`

返回流动性池中的 ETH 储备量。

**函数定义:**

```solidity
function getETHReserve() public view returns (uint256);
```

**返回值：**

- `ETHReserve`：池中的 ETH 数量。

#### `getTokenReserve`

返回流动性池中的 ERC20 Token 储备量。

**函数定义:**

```solidity
function getTokenReserve() public view returns (uint256);
```

**返回值：**

- `tokenReserve`：池中的 ERC20 Token 数量。

---

#### `getTokenAmount`

根据提供的 ETH 数量，返回可获得的 ERC20 Token 数量。

**函数定义:**

```solidity
function getTokenAmount(uint256 _ethSold) public view returns (uint256);
```

**参数：**

- `_ethSold`：出售的 ETH 数量。

**返回值：**

- `tokenAmount`：可获得的 ERC20 Token 数量。

---

#### `getEthAmount`

根据提供的 ERC20 Token 数量，返回可获得的 ETH 数量。

**函数定义:**

```solidity
function getEthAmount(uint256 _tokenSold) public view returns (uint256);
```

**参数：**

- `_tokenSold`：出售的 ERC20 Token 数量。

**返回值：**

- `ethAmount`：可获得的 ETH 数量。

---

### Pool interface

综合上述，我们就得到了 `Uniswap Pool` 合约的接口：

```solidity
interface IPool {
    function addLiquidity(uint256 _tokenAmount) public payable returns (uint256);

    function removeLiquidity(uint256 _amount) public returns (uint256, uint256);

    function ethToTokenSwap(uint256 _minTokens) external payable;

    function ethToTokenTransfer(uint256 _minTokens, address _recipient)
        external
        payable;
    
    function getETHReserve() public view returns (uint256);

    function getTokenReserve() public view returns (uint256);

    function getEthAmount(uint256 _tokenSold) public view returns (uint256);
}
```
