# 搭建自己的 Token (part 1)

为了更好的理解 ERC20 的工作原理，我们将从零开始搭建一个自己的 Token 合约。

## TotalSupply & Decimals

我们发行的 Token 需要有一个变量来记录总发行量，将其命名为 `totalSupply`。

另外需要注意的是，solidity 本身只支持整型运算，然而 Token 的运算是需要有浮点运算的，所以我们需要人为设置一个精度参数，即小数点后的位数。

举个例子， 假设我们规定精度为 4，那么 `number` 表达的数字 100，实际存储的是 `100 * 10**decimals = 10000000`. 通过这个方法，我们就能在整型上表达精度较高的浮点数。

```solidity
uint8 decimals = 4;
uint256 number = 100*10**decimals;
```

需要 ERC20 token 使用了和 Ether 相同的精度 18，例如 `DAI`, 当然也有部分 token 没有使用这么高的精度，比如 `USDT`, `USDC` 使用了 6。精度的可以根据需要来设置，在这里我们将使用常规的 18 作为精度。

因为 `totalSupply` 的数值会非常大，所以我们使用 `uint256` 类型; 而 `decimals` 使用 `uint8` 便足矣。

## Token 的标识

虽然在程序运行中，将 Token 合约地址作为唯一标识，但对于人类来说，地址太长不便于记忆和辨识，所以 ERC20 设置了 `name` 和 `symbol` 来作为辨识标识。你可以设置任意的值， symbol 一般是以字母组成的简写，name 是 token 的全称。

## balanceOf

我们需要一个变量来记录每一位 token 持有者的余额，这个变量需要能动态的增加存储空间（因为持有者的人数可能越来越大），并且能方便的查询。所以我们将使用 `mapping` 类型来存储。其结构将是这样：

```solidity
mapping(address => uint256) public balanceOf;
```

## 初始化

我们将在合约构造阶段，对上述变量进行初始化，例如设置 `totalSupply`, `name`, `symbol`, `decimals`, 另外我们会将所有初始发行的 token 全部分分配给创建者。

## 🏁 目标

为合约设置以下变量

- `totalSupply`: `uint256`类型， 总发行量; 请在构造函数中设置为 1000;
- `decimals`: `uint8` 类型， 精度
- `name`: `string` 类型， 名称
- `symbol`: `string` 类型， 标识符
- `balanceOf`: `mapping` 类型， 每一位持有人的余额

在构造函数初始化以上变量。
