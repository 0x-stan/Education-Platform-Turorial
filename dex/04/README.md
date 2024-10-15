# 搭建自己的 Uniswap：添加和移除流动性

上一节我们已经设计好了 Pool 合约的接口，接下来我们将具体的实现它。交易的前提是具备流动性，所以我们的第一步是给合约一个添加流动性和移除流动性的功能。

## 规定交易品种

我们设计的 Pool 交易机制，是用 ETH 和其他 ERC20 token 组成交易对，所以我们需要一个变量来存储这个 ERC20 token 的地址。

```solidity
address public tokenAddress;
```

## get reserve

编写查询合约的 ETH 和 token 余额的函数。

```solidity
function getETHReserve() public view returns (uint256) {
    // 直接返回 `address.balance`
}
    
function getTokenReserve() public view returns (uint256) {
    // 使用 `ERC20.balanceOf` 接口查询本合约的余额，并返回
}
```

## LP token

我们需要为 `LP` (Liquidity Provider, 流动性提供者) 提供资产证明，以此为赎回流动性的凭证，并且这个凭证最好是能便于流通的。比如 LP 可以使用钱包 A 提供流动性，由于某些原因，他希望将这部分流动性的所有权转给另一个钱包 B，那么如果能直接将凭证像 token 转账一样发送过去，就比 `赎回 -> 转账底层资产 -> 再存入流动性` 的流程要方便很多。我们需要满足这些特性，自然而然就会想到，将 LP 凭证规定为一种 ERC20 token。

所以我们直接将 Pool 合约继承 ERC20 合约。

```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Pool is ERC20 {

    constructor(address _token) ERC20("LP token", "LPT") {
        ...
    }
}
```

> 我们之前实现过自己的 ERC20 合约，不过在实际开发中，我们通常使用 openzepplin 提供的标准 ERC20 token 合约。

## addLiquidity

这个函数主要工作是添加流动性，然后给 LP 分发 LP token (流动性凭证)。那么如何计算 LP token 的数量便是我们主要考虑的问题。

为了保证公平，我们将根据添加资产的价值和 Pool 价值的比例进行分配；由于恒定乘积的机制，我们可以认为 Pool 中两种资产的价值总是相等的，所以我们只需要用其中一种资产的比例作为LP token 的计算比例即可，比如我们将添加流动性中的ETH数量与 Pool 中的ETH数量作为比例，乘以现有 LP token 总数，即可得到新增LP token 的数量。

$$
\Delta LP = LP * \frac{\Delta x}{x}
$$

另外添加流动性需要考虑两种情况，即：

- 初始添加流动性
- 后续添加流动性

因为在添加第一笔流动性之前，LP token 总数为0， 那么按照公式计算将始终得数为0。所以我们在初始添加流动性时，直接使用恒定乘积的公式来计算流动性数量，即：

$$
k = x*y = ETH_{balance} * Token_{balance} = LP_{init}
$$

由于k是二次方量级(x*y),而我们需要线性的数值来比较（一次方数值），所以liquidity通常是 $\sqrt{k}$.

另外还需要注意的一点是：添加流动性的两种资产要严格按照 Pool 中原有的两种资产比例，否则会改变 Pool 的交易价格。

代码逻辑如下：

```solidity
function addLiquidity(uint256 _tokenAmount)
        public
        payable
        returns (uint256 liquidity)
{
    // 当合约没有ERC20时，认为是初始添加流动性
    if (getTokenReserve() == 0) {
        // 从LP钱包中转入 ERC20 token，使用 `ERC20.transferFrom`
        
        // 计算 liquidity （根号k）

        //  ERC20._mint() 向流动性提供者发送 LP token

        // 返回liquidity数量
    } else {
        // 再转入token之前，我们需要确定转入的 token 数量与
        // 转入的ETH数量要按照 Pool 原有的比例，
        // 否则将会改变 Pool 的价格
        // 注意：solidity不支持浮点运算，所以运算顺序非常重要，遵循先乘后除原则
        // `msg.value * (tokenReserve / ethReserve)` 的写法会产生计算误差
        // `msg.value * tokenReserve / ethReserve` 则更加精确


        // 保证流动性按照当前比例注入，如果token少于应有数量则不能执行
        // 如果token数量不足，我们需要报错 "insufficient token amount"

        // ERC20 转账

        // 使用ETH的增量与添加之前 Pool ETH 数量的比值，来计算新增 liquidity 数量
        // 注意：同样遵循先乘后除原则
      
        //  ERC20._mint() 向流动性提供者发送 LP token

        // 返回 liquidity 数量
    }
}
```

## removeLiquidity

相对于添加流动性，移除流动性的流程会简单一些，只需要按照比例将 LP 的底层资产转给 LP 用户，并销毁相应数量的 LP token。

```solidity
function removeLiquidity(uint256 _amount)
    public
    returns (uint256, uint256)
{
    // 检查移除流动性数量要大于0， 否则报错 "invalid amount"

    // 按照移除 LP token 数量 与 `totalSupply()` 的比例，
    // 分别计算需要返还用户的 ETH 和 ERC20 token 数量

    // ERC20._burn() 销毁LP

    // 向用户转账 eth 和 token

    // 返回两种底层资产的返还数量
}
```

## 🏁 目标

Pool 合约继承 ERC20 合约，满足 LP token 的需求；

并为其添加以下变量：

- `tokenAddress`: ERC20 token address

以及以下函数：

- `getETHReserve`: 查询 ETH 数量
- `getTokenReserve`: 查询 ERC20 Token 数量
- `addLiquidity`: 添加流动性
- `removeLiquidity`: 移除流动性
