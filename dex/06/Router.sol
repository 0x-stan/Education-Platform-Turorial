//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Pool.sol";
import "./Factory.sol";

contract Router {

    // 创建 `factoryAddress` 变量
    // 创建 `ETHAddress` 变量，令其等于 `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`

    // `constructor` 中设置 factoryAddress
    
    // 设置 `receive` 函数，以便 Router 可以接受 ETH 转账

    // swap 函数逻辑:
    // - 交易输入资产是 ETH (即 ETH -> tokenB): 直接调用 PoolB 进行 swap
    // - 交易输入资产不是 ETH:
    // - 先使用 `transferFrom` 拉取 TokenA 到 Router 合约
    // - 如果检查 Router 对 PoolA 是否有授权转账 TokenA，若不足，则 approve 授权
    // - 判断输出资产是否为 ETH:
    //     - 是 ETH 直接调用 PoolA 进行交易
    //     - 不是 ETH ，需要两次交易:
    //     - 调用 PoolA 交易 `TokenA -> ETH`
    //     - 调用 PoolB 交易 `ETH -> TokenB`
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

    function getPool(address _tokenAddress) public view returns (address) {
        // 返回 Factory 合约的 getPool 查询结果
    }

}
