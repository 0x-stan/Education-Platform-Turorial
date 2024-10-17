# 搭建自己的 Uniswap：定价和交易

上一节我们为Pool合约添加流动性管理的函数，接下来我们将实现它的定价和交易功能。

## 实现定价功能

传统的订单簿机制交易所，交易双方会报价，然后靠平台撮合订单；也就是说价格是由交易者报价产生，然而 AMM 不存在类似的报价机制，其价格是由公式决定，即恒定乘积公式 `x*y=k`。

每一笔交易都会改变两个代币的数量，无论数量如何变化，`k` 都应该保持不变。当用户希望用资产 x 交换资产 y，则：

$$(x + \Delta x)(y - \Delta y) = xy = k$$

那么根据这个公式，我们就能根据交易的输入计算输出的数量，或者反过来也一样。

而 $\Delta x$ 与 $\Delta y$ 的比值就是传统交易的交易价格(交易均价)，只不过对于我们的合约来说，我们不需要计算价格，只需要提供一个计算输入或者输出数量的方法即可。

### swap fees (交易手续费)

传统交易所在输入资产数量中扣除手续费，比如费率 1%， 那么交易者用100个资产x买入资产y，会先扣除 1 个资产x，然后用剩下的资产x交易资产y。而 AMM 中通常在交易输出端收费，即在资产y数量的基础上扣除 1%。

所以根据公式计算出的输出端数量之后，还要扣除这 1% 手续费作为 LP 的收益，留在 Pool 合约中。

### LP 的收益

LP 贡献了交易的流动性，那么交易手续费即是他们的收益。假设 Pool 中原本由价值 1000 USDC 的资产作为流动性，经过一段时间交易后，通过手续费增加了 10 USDC 价值的资产，目前 Pool 的总流动性价值 1010 USDC， 于是当 LP 赎回流动性时，会按照比例分配这多出来的利润，即为LP的收益。

### `getAmount`

我们定义一个 `getAmount` 函数用来计算交易后， Pool 资产的数量。比如当用资产 x 交易 y （已知x数量，求y的数量），那么 `getAmount` 函数将计算出交易之后，Pool中y资产的数量（减少后）。

$$
(y - \Delta y) = xy / (x + \Delta x)
$$

> 由于 solidity 不支持浮点运算，计算百分比时可以分子乘以 99， 分母乘以100.

```solidity
// This is a low-level function, so let it be private.
function getAmount(
    uint256 inputAmount,
    uint256 inputReserve,
    uint256 outputReserve
) private pure returns (uint256) {
    // 检查 `inputReserve` 和 `outputReserve` 都必须大于0，否则报错 "invalid reserves"

    // 收取1%的手续费
    // solidity 不支持浮点运算，所以分子和分母同时 × 100
    // outputAmount = (inputAmount * outputReserve) / (inputReserve + inputAmount) 

    // 返回结果
}
```

在实现了内部计算函数之后，可以利用这个函数分别为交易 ETH 和交易 Token 暴露两个查询接口：

```solidity
// 已知输入端 ETH 的数量，查询输出端 Token 数量
function getTokenAmount(uint256 amount) public view returns (uint256) {
    // 检查 amount 大于0，否则报错 "amount is too small"

    // 获取 Pool 合约 Token 的数量

    // 利用 `getAmount` 内部计算函数计算结果，并返回
}

// 已知输入端 Token 的数量，查询输出端 ETH 数量
function getEthAmount(uint256 amount) public view returns (uint256) {
    // 检查 amount 大于0，否则报错 "amount is too small"

    // 获取 Pool 合约 Token 的数量

    // 利用 `getAmount` 内部计算函数计算结果，并返回
}
```

## swap (交易功能)

交易功能需要区分交易方向，我们使用 `bool ETHForToken` 作为标识。

并且为了防止交易被抢跑攻击 ([front-runing attack](https://quillaudits.medium.com/front-running-and-sandwich-attack-explained-quillaudits-de1e8ff3356d)), 我们需要增加一个最小交易输出量的参数。

另外，还可以增加一个 `recipient` 参数，让交易输出的资产可以指定不同的接受地址，这个功能在后续 token 交易 token 的流程中会用到。

```solidity
function swap(
    uint256 amountIn,
    uint256 minAmountOut,
    bool ETHForToken,
    address recipient
) public payable returns (uint256 amountOut) {
    // ETH in Token out
    if (ETHForToken) {
        // 获取交易之前的两种资产的数量，这里注意，ETH数量需要扣除 `msg.value`

        // 使用 `getAmount` 函数计算交易输出数量

        // 检查 `amountOut` 不低于 `minAmountOut`, 否则报错 "insufficient output amount"

        // 将交易输出的 token 转给 `recipient`
    } else {
        // Token in ETH out
       // 获取交易之前的两种资产的数量，这里注意，ETH数量需要扣除 `msg.value`

        // 使用 `getAmount` 函数计算交易输出数量

        // 检查 `amountOut` 不低于 `minAmountOut`, 否则报错 "insufficient output amount"
        
        // 使用 `ERC20.transferFrom` 将用户的 Token 转入
        // 将交易输出的 ETH 转给 `recipient`
    }
}
```

## 🏁 目标

Pool 价格查询以及交易的功能；

为其添加以下函数：

- `getAmount`: 交易数量查询的内部函数
- `getTokenAmount`: 已知输入端 ETH 的数量，查询输出端 Token 数量
- `getEthAmount`: 已知输入端 Token 的数量，查询输出端 ETH 数量
- `swap`: 执行交易
