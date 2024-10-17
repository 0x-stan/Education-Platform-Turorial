# 搭建自己的 Uniswap：Factory 与 Router

上一节我们实现了 Pool 的核心功能，现在它已经可以添加移除流动性，能够进行 ETH 与 Token 的交易。但是由于我们设定的 Pool 必须是 ETH 与其他 Token 组成的交易对，用户如果希望使用一种 Token 交易另一种 Token，则无法直接在 Pool 合约中实现。

接下来我们将进一步改进合约，让其具备直接 Token 交易 Token 的功能

## Token 交易 Token

现有版本的合约，用户如果希望用 TokenA 交易 TokenB，需要分成两步交易：

1. 在 ETH-TokenA Pool 合约交易，使用 TokenA 交易 ETH
2. 在 ETH-TokenB Pool 合约交易，使用 ETH 交易 TokenB

为了改善这个流程，我们可以在合约中集成 Token 交易 Token 的功能，让用户可以一笔交易中完成。

![MyUniswap.png](https://github.com/0x-stan/Education-Platform-Tutorial/raw/main/dex/06/img/MyUniswap.drawio.png)

具体的做法是添加一个 Router 合约 与 一个 Factory 合约：

- `Factory`: 创建 Pool 的工厂合约，在创建之后，注册 Pool 地址
- `Router`: 交易路由合约，用户输入交易的两个 Token 地址，自动帮助用户路由交易路径，完成 Token 交易 Token 的流程

## Factory

用于创建 Pool 的工厂函数，同时也保存了所有 Pool 地址便于查询。

### getPool 变量

设置一个 `mapping(address => address)` 变量 `getPool`, 记录所有创建的 Pool 地址，便于查询。

```solidity
mapping(address => address) public getPool;
```

### createPool 函数

根据 Token 地址创建 Pool 的函数：

```solidity
function createPool(address _tokenAddress) public returns (address) {
    // 检查 token 地址不是 address 0，否则报错 "invalid token address"

    // 保证同一个 交易对 地址相同，不会出现多个交易所的情况
    // 我们不希望流动性分散在多个交易所，最好集中在一个交易所以减少滑点并提供更好的汇率。
    // 检查 `mapping getPool` 相关值是 address 0 （代表该交易对的交易所还未创建）
    // 否则报错 "pool already exists"

    // 创建 Pool 合约，并将其地址更新到 `getPool`

    // 返回 Pool 地址
}
```

## Router

用于交易以及交易查询的路由合约，根据交易资产品种自动路由 Pool，方便用户交易。

### `factoryAddress` & `ETHAddress`

- `factoryAddress`: 工厂合约地址, 在 `constructor` 中设置
- `ETHAddress`: 用于代表 ETH 的 Token 地址，规定为 `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`

### Swap

交易函数，根据输入和输出的资产种类，进行自动路由，其逻辑如下：

- 交易输入资产是 ETH (即 ETH -> tokenB): 直接调用 PoolB 进行 swap
- 交易输入资产不是 ETH:
  - 先使用 `transferFrom` 拉取 TokenA 到 Router 合约
  - 如果检查 Router 对 PoolA 是否有授权转账 TokenA，若不足，则 approve 授权
  - 判断输出资产是否为 ETH:
    - 是 ETH 直接调用 PoolA 进行交易
    - 不是 ETH ，需要两次交易:
      - 调用 PoolA 交易 `TokenA -> ETH`
      - 调用 PoolB 交易 `ETH -> TokenB`

```solidity
function swap(
    address tokenA,
    address tokenB,
    uint256 amountIn,
    uint256 minAmountOut,
    address recipient
) public payable returns (uint256 amountOut) {
    // 根据交易输入输出的资产分情况编写逻辑


    // 交易输入是 ETH
    if (tokenA == ETHAddress) {
        // 检查转入 ETH 是否足够，否则报错 "insufficient input amount"

        // 直接调用 PoolB 进行 swap
    } else {
        // 交易输入不是 ETH

        // 使用 `transferFrom` 拉取 TokenA 到 Router 合约

        // 查询 TokenA Router 合约对 poolA 的授权数量 `allowance`，如果需要，调用approve授权

        if (tokenB == ETHAddress) {
            // 交易输出是 ETH，只需要调用 `poolA.swap`
        } else {
            // 交易输出不是 ETH，需要使用两个 pool 交易

            // 第一次交易 TokenA -> ETH, `poolA.swap`

            // 第二次交易 ETH -> TokenB, `poolB.swap`
            // 注意：第二次交易的输入数量是第一次交易的输出数量

        }
    }
}
```

### `getAmountOut`

交易查询接口，根据输入和输出的交易品种以及输入数量，自动查询交易的输出数量, 路由逻辑和 swap 一致:

```solidity
function getAmountOut(
    address tokenA,
    address tokenB,
    uint256 amountIn
) public view returns (uint256 amountOut) {
    Pool pool;

    // 交易输入是 ETH
    if (tokenA == ETHAddress) {
        // `poolB.getTokenAmount(amountIn)`
    } else {
        // 交易输入不是 ETH
        pool = Pool(getPool(tokenA));
        // 交易输出是 ETH，只需要调用 `PoolA.getAmount(amountIn)`
        //

        if (tokenB != ETHAddress) {
            // 交易输出不是 ETH，需要使用两个pool
            // 第一次交易 TokenA -> ETH, `poolA.getAmount(amountIn)`

            // 第二次交易 ETH -> TokenB, `poolB.getAmount(amountOut)`
            // 注意：第二次交易的输入数量是第一次交易的输出数量
        }
    }
}
```

### `getPool`

调用 `Factory.getPool` 返回查询结果。

## 🏁 目标

为我们的 DEX 添加自动交易路由功能。

创建 `Factory` 合约，为其添加变量:

- `mapping(address => address) getPool`: 记录所有创建的 Pool 地址

并为其添加以下函数：

- `createPool`: 根据 Token 地址创建 Pool 的函数

创建 `Router` 合约，为其添加变量:

- `factoryAddress`: Factory 合约地址
- `ETHAddress`: 用于代表 ETH 的 Token 地址，规定为 `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`

并为其添加以下函数：

- `swap`: 交易函数，根据输入和输出的资产种类，进行自动路由
- `getAmountOut`: 交易查询接口
- `getPool`: 调用 `Factory.getPool` 返回查询结果
