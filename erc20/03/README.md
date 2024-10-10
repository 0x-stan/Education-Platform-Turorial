# ERC20 的转账逻辑

上一章节我们为自己的 Token 设置了必要的变量，接下来我们将创建一些必要的函数，来完善 Token 的功能。

## Transfer

我们的 Token 缺少一个至关重要的功能，那就是转账。转账的本质其实是在转出账户的余额减去指定数量，同时在转入账户余额上加伤指定数量，另外我们需要在转账之前做余额是否充足的条件检查。

另外我们还需要为转账行为发送一个 event 以便链下追踪统计。

所以我们的代码逻辑应该是这样子的：

```solidity
function transfer(address to, uint256 amount) {
    // 1. 检查 msg.sender 余额是否足以支付这次转账
    // 2. 扣除 msg.sender 余额
    // 3. 加上 to 的余额
    // 4. 发送 event
}
```

## Approve & TransferFrom

Transfer 是一个主动转账的方法，也就是说必须由资产拥有者自己发起转账。但这样并不利于程序之间的可组合性，例如我希望将自己的 Token A 交易为 Token B，就必须先将 Token A 转给 Dex （去中心化交易所），然后调用 Dex 的交易相关方法进行交易。显然这样是缺乏效率的，理想情况是这两个操作在同一笔交易中完成。

所以我们需要实现一个授权+被动转账的流程，例如我们给 Dex 合约授权一定的额度，让他们的合约可以直接转走我名下的部分资产用于交易。其代码逻辑应该是这样的：

1. 调用授权函数，给目标地址授权额度
2. 目标地址调用函数转走资产

在ERC20中，这两步所对应的函数分别是 `approve` 和 `transferFrom`。另外，为了记录 approve 相关的数据，我们还需要一个 `allowance` mapping 变量，以及一个 approve 相关的 event。

```solidity
event Approval(...);
// owner => spender => value
mapping(address => mapping(address => uint256)) public allowance;
```

而在 transferFrom 函数中，我们将先检查 allowance，`owner` 是否为 `spender` 授权了足够的额度，然后重复 `transfer` 函数中的逻辑。

## 🏁 目标

为合约添加以下函数：

- `transfer`: 转账函数
- `approve`: `owner` 为 `spender` 授权转账额度
- `transferFrom`: `spender` 转走 `owner` 资产

并且添加相应的 event:

- `event Transfer` (transfer, transferFrom 函数都发送这个event)
- `event Approval`
