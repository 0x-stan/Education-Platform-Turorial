//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Pool.sol";

contract Factory {
    // 设置一个 mapping 变量 `getPool`, 映射 tokenAddress 和 poolAddress

    function createPool(address _tokenAddress) public returns (address) {
        // 检查 token 地址不是 address 0，否则报错 "invalid token address"

        // 保证同一个 交易对 地址相同，不会出现多个交易所的情况
        // 我们不希望流动性分散在多个交易所，最好集中在一个交易所以减少滑点并提供更好的汇率。
        // 检查 `mapping getPool` 相关值是 address 0 （代表该交易对的交易所还未创建）
        // 否则报错 "pool already exists"

        // 创建 Pool 合约，并将其地址更新到 `getPool`

        // 返回 Pool 地址
    }
}
