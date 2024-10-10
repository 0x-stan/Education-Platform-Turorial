# ERC20 Token 标准

想象一下，您在以太坊网络上创建了一种新资产，这种资产被称为Token。这个 Token 可以是任何东西，比如：

- 在线平台中的信誉积分
- 游戏中一个角色的技能
- 彩票
- 金融资产类似于公司股份的资产
- 像美元一样的法定货币
- 一盎司黄金
- 以及其他让人脑洞大开的奇葩创意...

![plug_standard.jpeg](https://github.com/0x-stan/Education-Platform-Tutorial/raw/main/erc20/01/img/plug_standard.jpeg)
![plug_pig.jpeg](https://github.com/0x-stan/Education-Platform-Tutorial/raw/main/erc20/01/img/plug_pig.png)

然而，如果每次有人创建新的Token都得从头再写一遍，那将像每个国家都有不同的插头标准一样麻烦。而这正是 ERC-20 的用武之地！它就像一套统一的插头标准，让所有设备都能轻松兼容；就像编写网页应用时，不必每次都重新设计 API 一样，ERC-20 标准为大家省去了大量重复劳动。它使得像 Uniswap 这样的去中心化交易所只需一次开发就可以兼容任何符合 ERC-20 标准的Token。而且，钱包应用、去中心化金融（DeFi）协议等等，也能够直接使用这些Token，无缝衔接、互联互通，避免各种杂乱无章的情况。这对于所有人来说，都是一种理想的状态。例如，如果你想让Token代表黄金、白银或者猫币的价值，那就需要用到一些高级的 Solidity 特性。不过别担心，我们会一步步带你理解这些内容，慢慢来。

## ERC-20 接口：Token的游戏规则

就像每个桌游都有一本游戏规则，ERC-20 Toekn也必须遵守一套统一的标准。ERC-20 定义了一组接口，也就是一组函数，所有 ERC-20 Toekn必须实现这些函数，以便它们可以与任何兼容 ERC-20 的应用程序（例如钱包或交易所）互动。而这个接口也为我们新开发的项目带来了极大的便利，我们可以轻松使用任何支持 ERC-20 的应用程序，而不必担心会有人跳出来问：“为什么你的Toekn总是搞些独立特行的玩意儿？”

这些函数包括但不限于：

- **名称、符号和小数位数**：Toekn的身份识别要素
- **`totalSupply`**：所有存在的Toekn的总数量
- **`balanceOf`**：查询某个地址到底有多少Toekn
- **`transfer`**：最重要的Toekn转账函数

在 Solidity 中，你可以通过实现 ERC-20 接口来使你的Token符合这个标准。就像这样：

```solidity
contract MyContract is IERC20 {
    // 实现 ERC-20 函数...
}
```

当你这样做时，你的合约就变得符合 ERC-20 标准了！

## ERC-20 `transfer` 函数

在 ERC-20 兼容的智能合约中，只有以下方法可以改变余额：

- **`transfer`**：对 `transfer` 方法的调用直接调用合约的转账功能。
- **`approve` 和 `transferFrom`**：有关如何结合使用 `approve` 和 `transferFrom` 的更多细节将在以后介绍！

## 建议阅读

- [ERC-20 代币标准](https://eips.ethereum.org/EIPS/eip-20)
- [OpenZeppelin 的 ERC-20 智能合约实现](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC20/ERC20.sol)
